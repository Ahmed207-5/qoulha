-- Milestone 1: Comments
-- Any authenticated user can comment on a published message. Soft-deleted
-- (is_deleted flag) rather than hard-deleted, matching the existing
-- messages.is_deleted convention, so moderation history is preserved.

create table public.comments (
  id uuid primary key default uuid_generate_v4(),
  message_id uuid not null references public.messages(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 300),
  is_deleted boolean not null default false,
  created_at timestamptz not null default now()
);

-- Supports "newest first" pagination scoped to one message
create index idx_comments_message_created on public.comments (message_id, created_at desc);
create index idx_comments_author on public.comments (author_id);

alter table public.comments enable row level security;

create policy "Anyone can view comments on a published message"
  on public.comments for select
  using (
    is_deleted = false
    and exists (select 1 from public.messages m where m.id = message_id and m.is_published = true)
  );

create policy "Authenticated users can comment on a published message"
  on public.comments for insert
  with check (
    author_id = auth.uid()
    and exists (select 1 from public.messages m where m.id = message_id and m.is_published = true)
  );

-- "Deletion" is a soft-delete via UPDATE, mirroring the messages table's own
-- pattern. Reuses is_admin() from 0002_rls_policies.sql.
create policy "Author can delete own comment, admin can delete any comment"
  on public.comments for update
  using (author_id = auth.uid() or public.is_admin())
  with check (author_id = auth.uid() or public.is_admin());
