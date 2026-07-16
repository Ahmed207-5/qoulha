-- Follow system. Follower/following relationships are publicly visible
-- (consistent with how reactions/comments/reposts already work — social
-- engagement in Qoulha is attributed, only the original anonymous
-- message content is protected).

create table public.follows (
  id uuid primary key default uuid_generate_v4(),
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (follower_id, following_id),
  check (follower_id <> following_id)
);

create index idx_follows_follower on public.follows (follower_id);
create index idx_follows_following on public.follows (following_id);

alter table public.follows enable row level security;

create policy "Anyone can view follow relationships"
  on public.follows for select
  using (true);

create policy "Authenticated users can follow others"
  on public.follows for insert
  with check (follower_id = auth.uid());

create policy "Users can unfollow (delete their own follow)"
  on public.follows for delete
  using (follower_id = auth.uid());
