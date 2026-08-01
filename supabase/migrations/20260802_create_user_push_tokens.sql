create table if not exists public.user_push_tokens (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null references public.profiles(id) on delete cascade,

    token text not null unique,

    platform text default 'web',

    created_at timestamptz default now(),

    updated_at timestamptz default now()
);

create index if not exists idx_user_push_tokens_user_id
on public.user_push_tokens(user_id);

alter table public.user_push_tokens enable row level security;

create policy "Users can manage their own push tokens"
on public.user_push_tokens
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);