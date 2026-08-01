-- =========================================================
-- @all — an admin-only, platform-wide broadcast mention.
--
-- Reuses the exact same @username token-scanning already present in
-- every existing mention trigger (notify_on_mention() for wall comments,
-- 0021; notify_on_daily_space_mention() for Today's Space replies, 0026)
-- and the same publish-gated model used for daily posts (0026/0027):
-- when the token "all" appears in content AND the row's author is an
-- admin, broadcast one 'admin_broadcast' notification to every other
-- user instead of doing the normal per-username profile lookup for it.
-- For a non-admin author, "@all" falls through unchanged to the existing
-- lookup — exactly as if this migration didn't exist (matching a real
-- user literally named "all", if one exists, same as any other
-- username). This is deliberate: it's what keeps regular users from
-- being able to "use" @all at all, with zero new validation/UI surface.
--
-- Wall posts (messages) are the one case handled in application code
-- instead of a trigger: a message's content is written by whoever sent
-- it — sometimes a completely different, even anonymous, person from
-- the recipient who later decides to publish it to the Wall (is_published,
-- see 0001/message-mutations.ts). "Publishing" is that recipient's action,
-- so @all there is checked against the *publisher's* admin status at
-- publish time (togglePublishAction), not the original sender — done via
-- an RPC call to broadcast_admin_announcement() below, which re-checks
-- is_admin() itself regardless of what the caller already checked.
-- =========================================================

alter type notification_type add value if not exists 'admin_broadcast';

create or replace function public.broadcast_admin_announcement(p_payload jsonb, p_exclude_user_id uuid)
returns void
language plpgsql security definer as $$
begin
  -- Re-checked here (not just by callers) so this function is safe to
  -- expose via RPC directly — same defensive posture as every other
  -- admin-only SECURITY DEFINER function in this schema.
  if not public.is_admin() then
    raise exception 'only an admin can broadcast an announcement';
  end if;

  insert into public.notifications (user_id, type, payload)
  select id, 'admin_broadcast', p_payload
  from public.profiles
  where is_suspended = false and id <> p_exclude_user_id;
end;
$$;

-- ---------- Wall comments ----------
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

    if lower(v_username) = 'all' then
      if exists (select 1 from public.profiles where id = new.author_id and is_admin = true) then
        perform public.broadcast_admin_announcement(
          jsonb_build_object('message_id', new.message_id, 'comment_id', new.id),
          new.author_id
        );
      end if;
      continue;
    end if;

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

-- ---------- Today's Space replies ----------
create or replace function public.notify_on_daily_space_mention()
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

    if lower(v_username) = 'all' then
      if exists (select 1 from public.profiles where id = new.author_id and is_admin = true) then
        perform public.broadcast_admin_announcement(
          jsonb_build_object('daily_post_id', new.daily_post_id, 'reply_id', new.id),
          new.author_id
        );
      end if;
      continue;
    end if;

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
        v_mentioned_id, 'daily_space_mention',
        jsonb_build_object('daily_post_id', new.daily_post_id, 'reply_id', new.id, 'actor_id', new.author_id)
      );
      v_notified := array_append(v_notified, v_mentioned_id);
    end if;
  end loop;

  return new;
end;
$$;

-- ---------- Today's Space (the daily post itself) ----------
-- admin_create_daily_post() is already admin-only (checked at the top of
-- the function), so any "@all" in the post's own content always
-- qualifies — no author check needed, unlike the two triggers above.
create or replace function public.admin_create_daily_post(
  p_type daily_post_type, p_title text, p_content text
)
returns public.daily_posts
language plpgsql security definer as $$
declare
  v_row public.daily_posts;
begin
  if not public.is_admin() then
    raise exception 'only an admin can create a daily post';
  end if;

  update public.daily_posts set status = 'archived', archived_at = now() where status = 'active';

  insert into public.daily_posts (type, title, content, created_by)
  values (p_type, nullif(trim(p_title), ''), p_content, auth.uid())
  returning * into v_row;

  insert into public.activity_logs (user_id, action, metadata)
  values (auth.uid(), 'daily_post_created', jsonb_build_object('daily_post_id', v_row.id, 'type', p_type));

  insert into public.notifications (user_id, type, payload)
  select id, 'daily_space_published', jsonb_build_object('daily_post_id', v_row.id)
  from public.profiles
  where is_suspended = false;

  if exists (
    select 1 from regexp_matches(p_content, '@([A-Za-z0-9_]{2,30})', 'g') as m where lower(m[1]) = 'all'
  ) then
    perform public.broadcast_admin_announcement(jsonb_build_object('daily_post_id', v_row.id), auth.uid());
  end if;

  return v_row;
end;
$$;
