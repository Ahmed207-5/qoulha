-- =========================================================
-- Fix: the mention system (both normal @username mentions and @all)
-- appeared broken because of two real bugs introduced across the last
-- two migrations, neither caught by application-level type-checking
-- since both are purely database-side:
--
-- BUG 1 — missing GRANT EXECUTE (the actual root cause).
-- Every RPC function callable from the client in this project has an
-- explicit `grant execute ... to authenticated` right next to its
-- definition (see 0004, 0011, 0019, 0020, 0024) — this project does not
-- rely on Postgres's default PUBLIC-execute grant for functions.
-- admin_create_daily_post(), admin_archive_daily_post() (0026) and
-- broadcast_admin_announcement() (0028) were each added WITHOUT one.
-- The practical effect: admins could not create a Today's Space post at
-- all (RPC call rejected with "permission denied for function ..."),
-- so Today's Space never had an active post to reply to — making its
-- @username mentions and @all *both* appear broken, since there was
-- nothing to mention anyone in. Wall-post @all was broken the same way
-- (togglePublishAction's call to broadcast_admin_announcement rejected).
-- Wall comments and Today's Space replies were never affected by this
-- specific bug — they insert directly into a table and their mention
-- trigger fires implicitly, which never required an EXECUTE grant.
--
-- BUG 2 — an avoidable fragility, hardened here defensively even though
-- it wasn't the confirmed root cause: notify_on_mention() and
-- notify_on_daily_space_mention() already verify the row's author is an
-- admin with a direct, reliable check (`exists (... where id =
-- new.author_id and is_admin = true)`) before calling
-- broadcast_admin_announcement() — which then independently re-derives
-- admin status from auth.uid() and RAISES on mismatch. Re-deriving a
-- fact the trigger already established, inside an AFTER INSERT trigger,
-- means any divergence between auth.uid() and new.author_id turns into
-- an exception that rolls back the *entire* insert — including any
-- ordinary @username mentions bundled in the same comment/reply. Split
-- into an internal, no-recheck function (used by both triggers, which
-- already did the real check) and a public, self-checking wrapper (used
-- only by the one legitimate client-facing RPC caller, Wall-post
-- publishing) — same reuse-not-duplicate shape as create_notification()
-- already has relative to its own callers.
-- =========================================================

create or replace function public._broadcast_admin_announcement(p_payload jsonb, p_exclude_user_id uuid)
returns void
language plpgsql security definer as $$
begin
  insert into public.notifications (user_id, type, payload)
  select id, 'admin_broadcast', p_payload
  from public.profiles
  where is_suspended = false and id <> p_exclude_user_id;
end;
$$;

create or replace function public.broadcast_admin_announcement(p_payload jsonb, p_exclude_user_id uuid)
returns void
language plpgsql security definer as $$
begin
  if not public.is_admin() then
    raise exception 'only an admin can broadcast an announcement';
  end if;
  perform public._broadcast_admin_announcement(p_payload, p_exclude_user_id);
end;
$$;

grant execute on function public.admin_create_daily_post(daily_post_type, text, text) to authenticated;
grant execute on function public.admin_archive_daily_post(uuid) to authenticated;
grant execute on function public.broadcast_admin_announcement(jsonb, uuid) to authenticated;

-- ---------- Wall comments — use the internal, no-recheck broadcast ----------
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
        perform public._broadcast_admin_announcement(
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

-- ---------- Today's Space replies — same internal broadcast ----------
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
        perform public._broadcast_admin_announcement(
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

-- ---------- Today's Space (the daily post itself) — same internal broadcast ----------
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
    -- is_admin() was already checked at the top of this function, so the
    -- internal, no-recheck broadcast is correct here too.
    perform public._broadcast_admin_announcement(jsonb_build_object('daily_post_id', v_row.id), auth.uid());
  end if;

  return v_row;
end;
$$;
