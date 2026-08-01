-- =========================================================
-- Today's Space — engagement/discoverability follow-up to 0026:
--   1. A cheap, single-row-per-user "last viewed daily post" record,
--      instead of a per-post views log, powering the sidebar unread dot.
--   2. A notification broadcast to every user when a new daily post goes
--      live, folded into admin_create_daily_post() via CREATE OR REPLACE
--      (the function itself is only ever redefined, never edited in the
--      0026 file it was first created in — migrations already applied to
--      a database must never be changed after the fact).
-- =========================================================

alter type notification_type add value if not exists 'daily_space_published';

-- One row PER USER (primary key is user_id, not a composite of
-- user+post) — upserted every time Today's Space is opened. This is
-- exactly enough state to answer "has this user seen the current daily
-- post": no growing history table, no per-post row ever created.
create table public.daily_post_views (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  daily_post_id uuid references public.daily_posts(id) on delete set null,
  viewed_at timestamptz not null default now()
);

alter table public.daily_post_views enable row level security;

create policy "Users can view their own daily space view record"
  on public.daily_post_views for select
  using (user_id = auth.uid());

create policy "Users can create their own daily space view record"
  on public.daily_post_views for insert
  with check (user_id = auth.uid());

create policy "Users can update their own daily space view record"
  on public.daily_post_views for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

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

  -- Broadcast to every non-suspended user in one bulk insert (not a loop
  -- in application code, and not N calls to create_notification()).
  insert into public.notifications (user_id, type, payload)
  select id, 'daily_space_published', jsonb_build_object('daily_post_id', v_row.id)
  from public.profiles
  where is_suspended = false;

  return v_row;
end;
$$;
