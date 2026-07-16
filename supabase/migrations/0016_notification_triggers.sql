-- =========================================================
-- Notification triggers
--
-- All notification rows are created through create_notification(), a
-- SECURITY DEFINER function — exactly like the fix in
-- 0012_fix_notification_trigger_privacy.sql. This means we deliberately
-- do NOT add an INSERT policy on `notifications` for anon/authenticated;
-- every write goes through this trusted path instead, which is the
-- safer default (a broad INSERT policy would let any client fabricate
-- notifications for other users).
-- =========================================================

create or replace function public.create_notification(p_user_id uuid, p_type notification_type, p_payload jsonb)
returns void language plpgsql security definer as $$
begin
  insert into public.notifications (user_id, type, payload) values (p_user_id, p_type, p_payload);
end;
$$;

-- ---------- Reply → notify the ORIGINAL SENDER, not the recipient ----------
-- Only the message's recipient can ever create a reply (see 0005_replies.sql),
-- so "someone replies to their message" can only sensibly mean: the person
-- who sent the anonymous message gets notified that it was replied to.
-- This only fires if the sender was logged in when they sent it
-- (sender_user_id is not null) — it never reveals sender identity to
-- anyone else, and the sender already knows what they sent.
create or replace function public.notify_on_reply()
returns trigger language plpgsql security definer as $$
declare
  v_sender_id uuid;
begin
  select sender_user_id into v_sender_id from public.messages where id = new.message_id;
  if v_sender_id is not null and v_sender_id <> new.author_id then
    perform public.create_notification(v_sender_id, 'new_reply', jsonb_build_object('message_id', new.message_id));
  end if;
  return new;
end;
$$;

create trigger trg_notify_on_reply
  after insert on public.replies
  for each row execute function public.notify_on_reply();

-- ---------- Comment → notify the message recipient ----------
create or replace function public.notify_on_comment()
returns trigger language plpgsql security definer as $$
declare
  v_recipient_id uuid;
begin
  select recipient_id into v_recipient_id from public.messages where id = new.message_id;
  if v_recipient_id is not null and v_recipient_id <> new.author_id then
    perform public.create_notification(
      v_recipient_id, 'new_comment',
      jsonb_build_object('message_id', new.message_id, 'comment_id', new.id, 'actor_id', new.author_id)
    );
  end if;
  return new;
end;
$$;

create trigger trg_notify_on_comment
  after insert on public.comments
  for each row execute function public.notify_on_comment();

-- ---------- Reaction → notify the message recipient ----------
-- Only fires on the first reaction (INSERT); changing an existing
-- reaction goes through the UPDATE path in setReactionAction and
-- deliberately does not re-notify, to avoid spamming the recipient every
-- time someone taps a different emoji.
create or replace function public.notify_on_reaction()
returns trigger language plpgsql security definer as $$
declare
  v_recipient_id uuid;
begin
  select recipient_id into v_recipient_id from public.messages where id = new.message_id;
  if v_recipient_id is not null and v_recipient_id <> new.user_id then
    perform public.create_notification(
      v_recipient_id, 'reaction',
      jsonb_build_object('message_id', new.message_id, 'actor_id', new.user_id, 'emoji', new.emoji)
    );
  end if;
  return new;
end;
$$;

create trigger trg_notify_on_reaction
  after insert on public.message_reactions
  for each row execute function public.notify_on_reaction();

-- ---------- Repost → notify the original message's recipient ----------
create or replace function public.notify_on_repost()
returns trigger language plpgsql security definer as $$
declare
  v_recipient_id uuid;
begin
  select recipient_id into v_recipient_id from public.messages where id = new.original_message_id;
  if v_recipient_id is not null and v_recipient_id <> new.reposted_by then
    perform public.create_notification(
      v_recipient_id, 'new_repost',
      jsonb_build_object('message_id', new.original_message_id, 'actor_id', new.reposted_by)
    );
  end if;
  return new;
end;
$$;

create trigger trg_notify_on_repost
  after insert on public.reposts
  for each row execute function public.notify_on_repost();

-- ---------- Follow → notify the followed user ----------
create or replace function public.notify_on_follow()
returns trigger language plpgsql security definer as $$
begin
  perform public.create_notification(
    new.following_id, 'new_follower', jsonb_build_object('actor_id', new.follower_id)
  );
  return new;
end;
$$;

create trigger trg_notify_on_follow
  after insert on public.follows
  for each row execute function public.notify_on_follow();

-- ---------- Admin moderation → notify the message's recipient ----------
-- Fires only when the ACTING user is not the recipient themselves. Since
-- the messages UPDATE policy only allows the recipient or an admin
-- (0002_rls_policies.sql + 0013_fix_admin_message_moderation.sql), "acting
-- user is not the recipient" reliably means an admin took the action —
-- this must never fire for a user's own publish/unpublish/delete of their
-- own message.
create or replace function public.notify_on_moderation()
returns trigger language plpgsql security definer as $$
begin
  if auth.uid() is distinct from new.recipient_id then
    if new.is_deleted = true and old.is_deleted = false then
      perform public.create_notification(
        new.recipient_id, 'moderation',
        jsonb_build_object('message_id', new.id, 'action', 'deleted')
      );
    elsif new.is_published = false and old.is_published = true then
      perform public.create_notification(
        new.recipient_id, 'moderation',
        jsonb_build_object('message_id', new.id, 'action', 'unpublished')
      );
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_notify_on_moderation
  after update on public.messages
  for each row execute function public.notify_on_moderation();
