-- Tags system. Tags are set by the SENDER at compose time (same moment
-- they pick category/mood) — they describe the message's subject, which
-- only the sender actually knows going in. Freeform (not a fixed list),
-- normalized to lowercase, so trending/popular tags emerge organically.

create table public.tags (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  slug text not null unique,
  usage_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_tags_slug on public.tags (slug);
create index idx_tags_usage on public.tags (usage_count desc);

create table public.message_tags (
  message_id uuid not null references public.messages(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (message_id, tag_id)
);

create index idx_message_tags_tag on public.message_tags (tag_id);

alter table public.tags enable row level security;
alter table public.message_tags enable row level security;

create policy "Anyone can view tags"
  on public.tags for select
  using (true);

create policy "Anyone can view tag assignments on published messages"
  on public.message_tags for select
  using (
    exists (select 1 from public.messages m where m.id = message_id and m.is_published = true)
  );

-- Tags are only ever written server-side via attach_tags_to_message()
-- (see 0018_functions_xp_badges_tags.sql), which validates count/length
-- and runs SECURITY DEFINER — no direct client INSERT policy is needed
-- or provided, same reasoning as `notifications`.
