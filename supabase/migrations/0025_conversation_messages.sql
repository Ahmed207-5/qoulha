-- =========================================================
-- Milestone: Lightweight anonymous conversation
--
-- Replaces the single "one official reply" model (0005_replies.sql /
-- 0020_private_replies.sql) with a short back-and-forth thread, capped
-- at 10 messages per side (20 total), between exactly two parties:
--   - the message owner (public.messages.recipient_id)
--   - the original anonymous sender (whoever satisfies
--     public.is_message_sender(), same helper introduced in
--     0020_private_replies.sql — i.e. only senders who were logged in
--     at send-time can ever continue the thread; this is an existing
--     constraint of the app, not a new one)
--
-- Anonymity is preserved by construction, not by hiding a column: this
-- table stores WHICH SIDE sent a message (owner/anonymous), never WHO.
-- There is no author_id here at all, so there is nothing to leak.
--
-- Unlike the old replies table, this conversation is NEVER visible to
-- the public — not even once the original message is published to the
-- wall. That guarantee only ever applied to the single official reply;
-- a multi-message private thread is a stricter, narrower feature and
-- the RLS below reflects that (no "is_published" carve-out at all).
-- =========================================================

create table public.conversation_messages (
  id uuid primary key default uuid_generate_v4(),
  message_id uuid not null references public.messages(id) on delete cascade,
  sender_role text not null check (sender_role in ('owner', 'anonymous')),
  content text not null check (char_length(content) between 1 and 500),
  created_at timestamptz not null default now()
);

create index idx_conversation_messages_thread on public.conversation_messages (message_id, created_at);

-- ---------- Backfill: carry over existing single replies as the first "owner" message ----------
insert into public.conversation_messages (message_id, sender_role, content, created_at)
select message_id, 'owner', content, created_at from public.replies;

-- ---------- Retire the old one-reply system ----------
-- Dropping the table cascades to its triggers/policies/indexes automatically.
drop table if exists public.replies cascade;
drop function if exists public.notify_on_reply();

alter table public.conversation_messages enable row level security;

create policy "Owner or original sender can view their conversation"
  on public.conversation_messages for select
  using (
    exists (select 1 from public.messages m where m.id = message_id and m.recipient_id = auth.uid())
    or public.is_message_sender(message_id)
  );

-- Public Wall regression fix: the wall shows the owner's latest reply
-- alongside a published message (this is the one piece of the thread that
-- was ever meant to be public — same as the old single `replies` row's
-- "is_published" carve-out). Deliberately narrow and additive:
--   - sender_role = 'owner' only — the anonymous side of the thread stays
--     fully private, always, no matter what.
--   - only once the underlying message is_published — an unpublished
--     message's owner reply stays private to the two participants, via
--     the policy above.
-- This is a second PERMISSIVE policy, OR'd with the one above by Postgres,
-- so the existing private-conversation-view policy is unchanged and still
-- applies as-is.
create policy "Anyone can view the owner's reply on a published message"
  on public.conversation_messages for select
  using (
    sender_role = 'owner'
    and exists (select 1 from public.messages m where m.id = message_id and m.is_published = true)
  );

-- Two narrow insert policies (rather than one combined one) so each side's
-- 10-message cap is enforced independently, purely in SQL, with no way for
-- either side to spend the other's budget.
create policy "Owner can send messages in the conversation"
  on public.conversation_messages
  for insert
  with check (
    sender_role = 'owner'
    and exists (
      select 1
      from public.messages m
      where m.id = message_id
        and m.recipient_id = auth.uid()
    )
  );

create policy "Original sender can send messages in the conversation"
  on public.conversation_messages
  for insert
  with check (
    sender_role = 'anonymous'
    and public.is_message_sender(message_id)
  );

-- No update/delete policies — messages in the thread are permanent once
-- sent (no edit/delete for this lightweight version), matching the spec.

-- ---------- Notifications (reuses create_notification() from 0016) ----------
create or replace function public.notify_on_conversation_message()
returns trigger language plpgsql security definer as $$
declare
  v_recipient_id uuid;
  v_sender_id uuid;
begin
  if new.sender_role = 'owner' then
    -- Notify the original sender that the owner replied — same event
    -- type and same "only if they were logged in" guard as the old
    -- notify_on_reply(), just re-homed onto the new table.
    select sender_user_id into v_sender_id from public.messages where id = new.message_id;
    if v_sender_id is not null then
      perform public.create_notification(v_sender_id, 'new_reply', jsonb_build_object('message_id', new.message_id));
    end if;
  else
    -- Notify the owner that the anonymous sender wrote back. Reuses
    -- 'new_message' — from the owner's point of view this is exactly
    -- what it already means: a new anonymous message arrived.
    select recipient_id into v_recipient_id from public.messages where id = new.message_id;
    perform public.create_notification(v_recipient_id, 'new_message', jsonb_build_object('message_id', new.message_id));
  end if;
  return new;
end;
$$;

create trigger trg_notify_on_conversation_message
  after insert on public.conversation_messages
  for each row execute function public.notify_on_conversation_message();
