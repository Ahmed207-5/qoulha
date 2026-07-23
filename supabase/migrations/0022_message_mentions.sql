-- @mentions inside private messages (Inbox), reusing the exact same
-- 'mention' notification type + create_notification() helper introduced
-- for comment mentions in 0021_comment_mentions.sql. No new notification
-- type, no new column/table — mentions are just "@username" text inside
-- messages.content, parsed the same way as in comments.
--
-- The one deliberate difference from the comment version: messages are
-- anonymous by design (see 0002_rls_policies.sql revoking column access
-- to sender_user_id/sender_fingerprint, and every later migration that
-- protects this). A mentioned third party must NEVER learn who sent the
-- message, so this trigger creates the notification WITHOUT actor_id —
-- getNotificationText() already falls back to its no-actor phrasing when
-- actor_id is absent, so the notifications UI needs no changes either.
--
-- Also excluded from notification (both are no-ops, not privacy issues,
-- just redundant):
--   - the message's own recipient, if they happen to @mention themselves
--     (they already get the 'new_message' notification for this message)
--   - the sender mentioning themselves, only checkable when they were
--     logged in when sending (sender_user_id is not null) — mirrors the
--     same not-null check notify_on_reply() already uses for this reason
-- At most 5 distinct users are notified per message, no duplicates.

create or replace function public.notify_on_message_mention()
returns trigger language plpgsql security definer as $$
declare
  v_username text;
  v_mentioned_id uuid;
  v_notified uuid[] := '{}';
begin
  for v_username in
    select distinct m[1]
    from regexp_matches(new.content, '@([A-Za-z0-9_]{2,30})', 'g') as m
  loop
    exit when array_length(v_notified, 1) >= 5;

    select id into v_mentioned_id
    from public.profiles
    where lower(username) = lower(v_username)
      and is_public = true
      and is_suspended = false;

    if v_mentioned_id is not null
       and v_mentioned_id <> new.recipient_id
       and (new.sender_user_id is null or v_mentioned_id <> new.sender_user_id)
       and not (v_mentioned_id = any(v_notified))
    then
      perform public.create_notification(
        v_mentioned_id, 'mention', jsonb_build_object('message_id', new.id)
      );
      v_notified := array_append(v_notified, v_mentioned_id);
    end if;
  end loop;

  return new;
end;
$$;

create trigger trg_notify_on_message_mention
  after insert on public.messages
  for each row execute function public.notify_on_message_mention();
