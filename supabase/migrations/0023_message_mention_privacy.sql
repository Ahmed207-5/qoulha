-- Fixes "Message not found" when a user clicks a mention notification
-- that came from a private (unpublished) inbox message.
--
-- Root cause: that was never a routing bug. /m/[messageId] correctly
-- refuses the mentioned user via RLS — they are neither the recipient
-- nor the sender, so they have no legitimate access to a private,
-- unpublished message. Pointing the link somewhere else can't fix that;
-- the only real options were (a) grant them access (a privacy
-- regression) or (b) never send them there at all. Chosen: (b).
--
-- This migration only replaces notify_on_message_mention()'s payload:
-- instead of a message_id someone would then try to navigate to, it now
-- stores a short, pre-extracted snippet around the @mention itself —
-- never the full message, never the reply, never sender/recipient
-- identity. The trigger, its matching/exclusion/cap logic, the
-- 'mention' notification type, and comment mentions (0021, untouched)
-- are all otherwise unchanged.

create or replace function public.notify_on_message_mention()
returns trigger language plpgsql security definer as $$
declare
  v_username text;
  v_mentioned_id uuid;
  v_notified uuid[] := '{}';
  v_pos int;
  v_snippet text;
  v_window constant int := 30;
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
      -- Case-insensitive search for where this @mention sits in the
      -- original content, then take a small window of text around it.
      v_pos := position(lower('@' || v_username) in lower(new.content));
      if v_pos > 0 then
        v_snippet :=
          (case when v_pos > v_window + 1 then '…' else '' end)
          || substr(new.content, greatest(1, v_pos - v_window), (2 * v_window) + length(v_username) + 1)
          || (case when (v_pos - 1 + length(v_username) + 1 + v_window) < length(new.content) then '…' else '' end);
      else
        v_snippet := left(new.content, 60);
      end if;

      perform public.create_notification(
        v_mentioned_id, 'mention', jsonb_build_object('mention_snippet', v_snippet)
      );
      v_notified := array_append(v_notified, v_mentioned_id);
    end if;
  end loop;

  return new;
end;
$$;
