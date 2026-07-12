-- Milestone 1: Replies
-- One official reply per message, authored only by the message's recipient,
-- and only once the message has been published to the wall.

create table public.replies (
  id uuid primary key default uuid_generate_v4(),
  message_id uuid not null unique references public.messages(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_replies_message on public.replies (message_id);
create index idx_replies_author on public.replies (author_id);

-- Reuses the set_updated_at() trigger function defined in 0001_init_schema.sql
create trigger trg_replies_updated_at
  before update on public.replies
  for each row execute function public.set_updated_at();

alter table public.replies enable row level security;

create policy "Anyone can view a reply on a published message"
  on public.replies for select
  using (
    exists (select 1 from public.messages m where m.id = message_id and m.is_published = true)
    or author_id = auth.uid()
  );

create policy "Only the message recipient can create their official reply"
  on public.replies for insert
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.messages m
      where m.id = message_id and m.recipient_id = auth.uid() and m.is_published = true
    )
  );

create policy "Only the reply author can edit their reply"
  on public.replies for update
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

create policy "Only the reply author can delete their reply"
  on public.replies for delete
  using (author_id = auth.uid());
