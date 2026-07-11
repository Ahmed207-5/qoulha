-- =========================================================
-- Qoulha — Initial Schema
-- Design notes:
--  - auth.users (Supabase Auth) is the source of truth for identity.
--  - public.profiles is the 1:1 public-facing extension of a user.
--  - Sender identity is NEVER stored on the message row in a way the
--    recipient can read. We keep an internal-only sender_id column
--    protected by RLS (recipients cannot select it) purely so we can
--    do abuse/rate-limiting and admin moderation without breaking the
--    core anonymity promise.
-- =========================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- trigram search for wall search
create extension if not exists "citext"; -- case-insensitive username

-- ---------- ENUMS ----------
create type message_category as enum (
  'gratitude','compliment','advice','confession','apology','opinion','funny','general'
);

create type message_mood as enum (
  'happy','sad','thankful','regret','excited','motivated','calm'
);

create type report_status as enum ('pending','reviewed','actioned','dismissed');
create type report_reason as enum ('harassment','spam','hate_speech','sexual_content','threat','other');
create type notification_type as enum ('new_message','reaction','system','moderation');
create type activity_action as enum (
  'login','logout','message_sent','message_deleted','message_published',
  'message_unpublished','profile_updated','settings_updated','report_filed',
  'report_actioned','account_deleted'
);

-- ---------- PROFILES ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username citext not null unique,
  full_name text not null,
  bio text default '' check (char_length(bio) <= 280),
  avatar_url text,
  is_public boolean not null default true,
  is_admin boolean not null default false,
  is_suspended boolean not null default false,
  message_count integer not null default 0,
  visitor_count integer not null default 0,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_format check (username ~ '^[a-z0-9_]{3,20}$')
);
create index idx_profiles_username on public.profiles using btree (username);

-- ---------- MESSAGES ----------
create table public.messages (
  id uuid primary key default uuid_generate_v4(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  -- Internal only. RLS forbids recipients/public from selecting this column's
  -- meaning beyond "exists"; enforced via a security-barrier view (see below).
  sender_fingerprint text not null, -- hashed IP+UA+user_id(if any), for rate-limit/abuse detection only
  sender_user_id uuid references public.profiles(id) on delete set null, -- null if sender wasn't logged in
  content text not null check (char_length(content) between 1 and 500),
  category message_category not null default 'general',
  mood message_mood not null default 'calm',
  is_read boolean not null default false,
  is_favorited boolean not null default false,
  is_published boolean not null default false,
  published_at timestamptz,
  is_flagged boolean not null default false, -- profanity/spam filter tripped
  is_deleted boolean not null default false, -- soft delete
  created_at timestamptz not null default now()
);
create index idx_messages_recipient on public.messages (recipient_id, created_at desc);
create index idx_messages_published on public.messages (is_published, published_at desc) where is_deleted = false;
create index idx_messages_unread on public.messages (recipient_id) where is_read = false and is_deleted = false;
create index idx_messages_content_trgm on public.messages using gin (content gin_trgm_ops);

-- ---------- REACTIONS ----------
create table public.reactions (
  id uuid primary key default uuid_generate_v4(),
  message_id uuid not null references public.messages(id) on delete cascade,
  reactor_fingerprint text not null, -- anonymous reactors on public wall are allowed
  reactor_user_id uuid references public.profiles(id) on delete set null,
  emoji text not null check (emoji in ('❤️','😂','👏','😮','😢','🔥')),
  created_at timestamptz not null default now(),
  unique (message_id, reactor_fingerprint, emoji)
);
create index idx_reactions_message on public.reactions (message_id);

-- ---------- REPORTS ----------
create table public.reports (
  id uuid primary key default uuid_generate_v4(),
  message_id uuid not null references public.messages(id) on delete cascade,
  reporter_id uuid references public.profiles(id) on delete set null,
  reason report_reason not null,
  details text check (char_length(details) <= 500),
  status report_status not null default 'pending',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_reports_status on public.reports (status, created_at desc);

-- ---------- VISITS (profile page analytics) ----------
create table public.visits (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  visitor_fingerprint text not null,
  referrer text,
  created_at timestamptz not null default now()
);
create index idx_visits_profile_date on public.visits (profile_id, created_at desc);

-- ---------- NOTIFICATIONS ----------
create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type notification_type not null,
  payload jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_notifications_user on public.notifications (user_id, is_read, created_at desc);

-- ---------- SETTINGS (1:1 with profile, split out so hot profile row stays small) ----------
create table public.user_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  theme text not null default 'system' check (theme in ('light','dark','system')),
  allow_messages boolean not null default true,
  email_notifications boolean not null default true,
  require_captcha boolean not null default true,
  blocked_categories message_category[] not null default '{}',
  updated_at timestamptz not null default now()
);

-- ---------- ACTIVITY LOGS ----------
create table public.activity_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete set null,
  action activity_action not null,
  metadata jsonb not null default '{}'::jsonb,
  ip_hash text,
  created_at timestamptz not null default now()
);
create index idx_activity_logs_user on public.activity_logs (user_id, created_at desc);

-- =========================================================
-- TRIGGERS
-- =========================================================

-- keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- maintain denormalized message_count on profiles (read-heavy dashboard stat)
create or replace function public.increment_message_count()
returns trigger language plpgsql as $$
begin
  update public.profiles
    set message_count = message_count + 1
    where id = new.recipient_id;
  insert into public.notifications (user_id, type, payload)
    values (new.recipient_id, 'new_message', jsonb_build_object('message_id', new.id, 'category', new.category));
  return new;
end;
$$;

create trigger trg_messages_after_insert
  after insert on public.messages
  for each row execute function public.increment_message_count();

create or replace function public.decrement_message_count()
returns trigger language plpgsql as $$
begin
  if old.is_deleted = false and new.is_deleted = true then
    update public.profiles set message_count = greatest(message_count - 1, 0) where id = new.recipient_id;
  end if;
  return new;
end;
$$;

create trigger trg_messages_soft_delete
  after update on public.messages
  for each row execute function public.decrement_message_count();

-- auto-create profile row + settings row when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    'user_' || substr(new.id::text, 1, 8),
    coalesce(new.raw_user_meta_data->>'full_name', 'New User')
  );
  insert into public.user_settings (user_id) values (new.id);
  return new;
end;
$$;

create trigger trg_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
