-- Milestone 1: Reactions (v2)
-- A NEW table, separate from the pre-existing `reactions` table (which
-- supported anonymous fingerprint-based multi-emoji reactions). This
-- milestone's spec requires "one reaction per user, changeable" — a
-- different uniqueness model — so rather than altering the old table's
-- constraints and data, we add message_reactions as the new source of
-- truth for wall reaction counts. The old `reactions` table is left
-- untouched and unused going forward (no data migration needed; it was
-- never populated with anything worth preserving).

create table public.message_reactions (
  id uuid primary key default uuid_generate_v4(),
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  emoji text not null check (emoji in ('❤️', '😂', '🥺', '👏', '🔥')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (message_id, user_id)
);

create index idx_message_reactions_message on public.message_reactions (message_id);
create index idx_message_reactions_user on public.message_reactions (user_id);

create trigger trg_message_reactions_updated_at
  before update on public.message_reactions
  for each row execute function public.set_updated_at();

alter table public.message_reactions enable row level security;

create policy "Anyone can view reactions on a published message"
  on public.message_reactions for select
  using (
    exists (select 1 from public.messages m where m.id = message_id and m.is_published = true)
  );

create policy "Authenticated users can react to a published message"
  on public.message_reactions for insert
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.messages m where m.id = message_id and m.is_published = true)
  );

create policy "Users can change their own reaction"
  on public.message_reactions for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can remove their own reaction"
  on public.message_reactions for delete
  using (user_id = auth.uid());
