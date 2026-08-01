-- =========================================================
-- "Today's Space" (مساحة اليوم) — a platform-managed daily post.
--
-- Distinct from the user-generated Public Wall: exactly one daily post is
-- ever "active" at a time, it's authored by an admin (question,
-- discussion, poll, challenge, or message), and every authenticated user
-- can leave ONE top-level public reply on it, like replies, and reply to
-- other users' replies (one level of nesting). Older daily posts are
-- archived, not deleted, and stay viewable — just read-only.
--
-- Follows the same conventions already established in this codebase:
--   - notification_type / activity_action are extended, not replaced
--     (mirrors 0015_extend_notification_types.sql / 0021).
--   - Mentions reuse the exact regex + no-self + max-5 + dedupe rules from
--     notify_on_mention() (0021_comment_mentions.sql), just retargeted at
--     daily_post_replies with its own notification type so it deep-links
--     into Today's Space instead of a wall message.
--   - All writes to daily_posts go through SECURITY DEFINER functions
--     that re-check is_admin() themselves (mirrors create_notification()
--     in 0016 and award_xp()/check_and_award_badges() in 0019) — there is
--     deliberately no INSERT/UPDATE policy for daily_posts, so a client
--     can never create or edit one directly, only read.
-- =========================================================

alter type notification_type add value if not exists 'daily_space_mention';
alter type activity_action add value if not exists 'daily_post_created';

create type daily_post_type as enum ('question', 'discussion', 'poll', 'challenge', 'message');
create type daily_post_status as enum ('active', 'archived');

create table public.daily_posts (
  id uuid primary key default uuid_generate_v4(),
  type daily_post_type not null default 'question',
  title text check (char_length(title) <= 120),
  content text not null check (char_length(content) between 1 and 1000),
  status daily_post_status not null default 'active',
  created_by uuid references public.profiles(id) on delete set null,
  published_at timestamptz not null default now(),
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

-- Enforces "only one daily post is active at a time" at the database
-- level (not just in application code): a partial unique index on the
-- constant value 'active' across the status column means a second row
-- can never share that value while one already exists.
create unique index idx_daily_posts_single_active on public.daily_posts (status) where status = 'active';
create index idx_daily_posts_published_at on public.daily_posts (published_at desc);

alter table public.daily_posts enable row level security;

create policy "Anyone can view daily posts, active or archived"
  on public.daily_posts for select
  using (true);

create table public.daily_post_replies (
  id uuid primary key default uuid_generate_v4(),
  daily_post_id uuid not null references public.daily_posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  -- One level of nesting only ("reply to other users' replies"). Enforced
  -- further in the insert policy below (a reply's parent must itself be
  -- top-level), so the thread can never grow past two levels deep.
  parent_reply_id uuid references public.daily_post_replies(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 500),
  is_deleted boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_daily_post_replies_post_created on public.daily_post_replies (daily_post_id, created_at);
create index idx_daily_post_replies_parent on public.daily_post_replies (parent_reply_id);

-- "Add one public reply": one TOP-LEVEL reply per user per daily post.
-- Deliberately excludes nested replies (parent_reply_id is not null) —
-- those are the separate, uncapped "reply to other users' replies"
-- interaction — and excludes soft-deleted rows, so a removed reply
-- doesn't permanently burn a user's one slot.
create unique index idx_daily_post_replies_one_top_level_per_user
  on public.daily_post_replies (daily_post_id, author_id)
  where parent_reply_id is null and is_deleted = false;

alter table public.daily_post_replies enable row level security;

create policy "Anyone can view public daily post replies"
  on public.daily_post_replies for select
  using (is_deleted = false);

create policy "Authenticated users can reply on the active daily post"
  on public.daily_post_replies for insert
  with check (
    author_id = auth.uid()
    and exists (select 1 from public.daily_posts p where p.id = daily_post_id and p.status = 'active')
    and (
      parent_reply_id is null
      or exists (
        select 1 from public.daily_post_replies parent
        where parent.id = parent_reply_id
          and parent.daily_post_id = daily_post_replies.daily_post_id
          and parent.parent_reply_id is null
      )
    )
  );

-- Soft-delete via UPDATE, mirroring comments (0006_comments.sql).
create policy "Author can delete own reply, admin can delete any reply"
  on public.daily_post_replies for update
  using (author_id = auth.uid() or public.is_admin())
  with check (author_id = auth.uid() or public.is_admin());

create table public.daily_post_reply_likes (
  id uuid primary key default uuid_generate_v4(),
  reply_id uuid not null references public.daily_post_replies(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (reply_id, user_id)
);

create index idx_daily_post_reply_likes_reply on public.daily_post_reply_likes (reply_id);

alter table public.daily_post_reply_likes enable row level security;

create policy "Anyone can view daily post reply like counts"
  on public.daily_post_reply_likes for select
  using (true);

create policy "Authenticated users can like a daily post reply"
  on public.daily_post_reply_likes for insert
  with check (user_id = auth.uid());

create policy "Users can remove their own like"
  on public.daily_post_reply_likes for delete
  using (user_id = auth.uid());

-- ---------- @mentions in daily post replies → notification ----------
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

create trigger trg_notify_on_daily_space_mention
  after insert on public.daily_post_replies
  for each row execute function public.notify_on_daily_space_mention();

-- ---------- Admin-only daily post management ----------
-- Both re-check is_admin() themselves rather than relying on being called
-- only from trusted code paths — same defensive posture as every other
-- SECURITY DEFINER function in this schema.

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

  -- Archive whatever is currently active first, in the same transaction
  -- as the insert below, so the single-active partial unique index above
  -- is never violated and there's never a moment with zero *or* two
  -- active posts visible to readers.
  update public.daily_posts set status = 'archived', archived_at = now() where status = 'active';

  insert into public.daily_posts (type, title, content, created_by)
  values (p_type, nullif(trim(p_title), ''), p_content, auth.uid())
  returning * into v_row;

  insert into public.activity_logs (user_id, action, metadata)
  values (auth.uid(), 'daily_post_created', jsonb_build_object('daily_post_id', v_row.id, 'type', p_type));

  return v_row;
end;
$$;

create or replace function public.admin_archive_daily_post(p_id uuid)
returns void
language plpgsql security definer as $$
begin
  if not public.is_admin() then
    raise exception 'only an admin can archive a daily post';
  end if;

  update public.daily_posts set status = 'archived', archived_at = now()
  where id = p_id and status = 'active';
end;
$$;
