-- Milestone 1: Repost
-- A repost is a reference row, never a content copy — the original
-- message's recipient (author) always remains the row's true owner, so
-- "original author always remains visible" is structural, not something
-- the application layer has to remember to preserve.

create table public.reposts (
  id uuid primary key default uuid_generate_v4(),
  original_message_id uuid not null references public.messages(id) on delete cascade,
  reposted_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (original_message_id, reposted_by)
);

create index idx_reposts_message on public.reposts (original_message_id);
create index idx_reposts_user on public.reposts (reposted_by);

alter table public.reposts enable row level security;

create policy "Anyone can view reposts of a published message"
  on public.reposts for select
  using (
    exists (select 1 from public.messages m where m.id = original_message_id and m.is_published = true)
  );

create policy "Authenticated users can repost a published message"
  on public.reposts for insert
  with check (
    reposted_by = auth.uid()
    and exists (select 1 from public.messages m where m.id = original_message_id and m.is_published = true)
  );

create policy "Owner can remove their own repost, admin can remove any repost"
  on public.reposts for delete
  using (reposted_by = auth.uid() or public.is_admin());
