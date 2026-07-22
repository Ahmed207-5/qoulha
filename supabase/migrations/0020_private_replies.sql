-- Milestone: Private replies to inbox messages, independent of publishing.
--
-- Problem: 0005_replies.sql required a message to be `is_published = true`
-- before the recipient could reply to it, forcing every private reply to
-- go public first. This migration removes that requirement while keeping
-- every existing guarantee intact:
--   - Only the message's recipient may still author a reply.
--   - Replying never touches is_published (enforced in the app layer too —
--     see message-mutations.ts / replies.ts, which are separate actions).
--   - Sender anonymity is preserved: sender_user_id / sender_fingerprint
--     stay revoked at the column-privilege level for anon/authenticated
--     (see 0002_rls_policies.sql) and are never selected here either.
--
-- We also close a related gap: today there is no way for a sender who
-- WAS logged in when they sent a message (sender_user_id is not null) to
-- ever view the reply they receive, because the messages/replies SELECT
-- policies only recognize "recipient" and "public + published". The
-- notify_on_reply() trigger (0016) already notifies that sender
-- regardless of publish state — but following that notification to
-- /m/[messageId] currently 404s unless the message happens to be
-- published, since nothing grants the sender row-level access.
--
-- Smallest safe fix: a SECURITY DEFINER helper (same pattern as
-- is_admin()) that checks sender_user_id server-side without ever
-- exposing that column to a client query or widening the column grant.

create or replace function public.is_message_sender(p_message_id uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.messages m
    where m.id = p_message_id and m.sender_user_id = auth.uid()
  );
$$;

-- Fully anonymous (logged-out) senders have no session/identity to check
-- against, so this can only ever resolve true for senders who had an
-- account at send-time — it grants nothing new to anyone else.
grant execute on function public.is_message_sender(uuid) to authenticated;

-- ---------- MESSAGES ----------
-- Lets a logged-in original sender view (read-only) the single message
-- they sent, in any publish state, so they can see a private reply.
-- Column-level grants above still hide sender_user_id/sender_fingerprint
-- from this same query — this only unlocks the row, not those columns.
create policy "Original sender can view a message they sent"
  on public.messages for select
  using (public.is_message_sender(id));

-- ---------- REPLIES ----------
drop policy if exists "Only the message recipient can create their official reply" on public.replies;
create policy "Only the message recipient can create their official reply"
  on public.replies for insert
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.messages m
      where m.id = message_id and m.recipient_id = auth.uid()
    )
  );

drop policy if exists "Anyone can view a reply on a published message" on public.replies;
create policy "Recipient, sender, or public (if published) can view a reply"
  on public.replies for select
  using (
    exists (select 1 from public.messages m where m.id = message_id and m.is_published = true)
    or author_id = auth.uid()
    or public.is_message_sender(message_id)
  );
