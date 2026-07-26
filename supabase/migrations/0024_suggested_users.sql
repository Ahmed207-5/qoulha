-- "People You May Know" — a single-query suggestion feed. Deliberately a
-- SQL function (not a client-side aggregation like leaderboard-service.ts)
-- so a page load costs exactly one round trip regardless of how the
-- ranking is computed.
--
-- Reuses everything that already exists: profiles.is_public/is_suspended
-- (same visibility rule as search-service.ts's searchUsers), profiles.xp
-- (existing gamification/activity score), and the follows table (0014).
-- No new tables, no new columns.
--
-- Ranking = xp (activity/engagement) + follower_count*5 (social proof) +
-- a small recency nudge from profiles.updated_at, all rounded off by a
-- random() jitter — so the ordering favors active/popular people but
-- isn't perfectly deterministic call to call, per the "randomize slightly"
-- requirement. Uses auth.uid() internally (never trusts a client-passed
-- viewer id), and p_exclude_ids lets the client page through more
-- suggestions without ever re-showing one already seen in this session —
-- correct even though the ranking has randomness in it, unlike a plain
-- OFFSET would be.

create or replace function public.get_suggested_users(p_limit int default 10, p_exclude_ids uuid[] default '{}')
returns table (
  id uuid,
  username text,
  full_name text,
  avatar_url text,
  bio text,
  follower_count bigint,
  public_message_count bigint
)
language sql stable as $$
  with candidates as (
    select
      p.id, p.username, p.full_name, p.avatar_url, p.bio, p.xp, p.updated_at,
      (select count(*) from public.follows f2 where f2.following_id = p.id)::bigint as follower_count,
      (select count(*) from public.messages m2
         where m2.recipient_id = p.id and m2.is_published = true and m2.is_deleted = false)::bigint as public_message_count
    from public.profiles p
    where p.is_public = true
      and p.is_suspended = false
      and p.id <> auth.uid()
      and not (p.id = any(p_exclude_ids))
      and not exists (
        select 1 from public.follows f where f.follower_id = auth.uid() and f.following_id = p.id
      )
  )
  select id, username, full_name, avatar_url, bio, follower_count, public_message_count
  from candidates
  order by (
    coalesce(xp, 0)
    + follower_count * 5
    + extract(epoch from updated_at) / 1e10
    + random() * 25
  ) desc
  limit p_limit;
$$;

grant execute on function public.get_suggested_users(int, uuid[]) to authenticated;
