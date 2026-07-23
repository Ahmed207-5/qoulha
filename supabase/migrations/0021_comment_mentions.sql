-- @mentions in Public Wall comments.
--
-- Mentions are plain "@username" text inside comments.content — no new
-- column/table needed (mirrors how the app already just stores comment
-- text as-is). This migration only adds the notification side-effect:
-- when a comment contains @username tokens that match real, public,
-- non-suspended profiles, each mentioned user gets ONE 'mention'
-- notification, reusing create_notification() (0016) exactly like every
-- other notification trigger.
--
-- Rules enforced here (server-side, unbypassable by any client):
--   - Only usernames that actually match a public, non-suspended profile
--     count as a mention (typing "@whatever" for a nonexistent user is
--     just text, no notification, same as it renders as a plain link).
--   - No self-notification (mentioning yourself is a no-op).
--   - No duplicate notification for the same user, even if mentioned
--     multiple times in one comment.
--   - At most 5 distinct mentioned users notified per comment.

alter type notification_type add value if not exists 'mention';

create or replace function public.notify_on_mention()
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
       and v_mentioned_id <> new.author_id
       and not (v_mentioned_id = any(v_notified))
    then
      perform public.create_notification(
        v_mentioned_id, 'mention',
        jsonb_build_object('message_id', new.message_id, 'comment_id', new.id, 'actor_id', new.author_id)
      );
      v_notified := array_append(v_notified, v_mentioned_id);
    end if;
  end loop;

  return new;
end;
$$;

create trigger trg_notify_on_mention
  after insert on public.comments
  for each row execute function public.notify_on_mention();
