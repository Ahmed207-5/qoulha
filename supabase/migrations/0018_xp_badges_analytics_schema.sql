-- XP & Levels: denormalized `profiles.xp` (read-heavy, same tradeoff as
-- message_count/visitor_count) backed by an auditable ledger table so we
-- can always explain/recompute where XP came from and never double-award.

alter table public.profiles add column xp integer not null default 0;
create index idx_profiles_xp on public.profiles (xp desc);

create type xp_event_type as enum (
  'message_sent', 'reply_posted', 'comment_posted',
  'reaction_received', 'repost_received', 'follower_gained', 'profile_visited'
);

create table public.xp_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_type xp_event_type not null,
  amount integer not null,
  -- Free-form reference to the row that caused this (message id, follow
  -- id, etc.) — kept as text since it can point at different tables;
  -- purely for audit/debugging, never queried by FK.
  reference_id uuid,
  created_at timestamptz not null default now()
);

create index idx_xp_events_user on public.xp_events (user_id, created_at desc);

alter table public.xp_events enable row level security;

create policy "Users can view their own XP history"
  on public.xp_events for select
  using (user_id = auth.uid() or public.is_admin());

-- No INSERT policy: all XP is awarded via award_xp(), a SECURITY DEFINER
-- function (0018_functions_xp_badges_tags.sql) — never directly by clients.

-- ---------- Badges ----------

create table public.badges (
  id uuid primary key default uuid_generate_v4(),
  code text not null unique,
  name text not null,
  description text not null,
  icon text not null,
  created_at timestamptz not null default now()
);

create table public.user_badges (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  earned_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

create index idx_user_badges_user on public.user_badges (user_id);

alter table public.badges enable row level security;
alter table public.user_badges enable row level security;

create policy "Anyone can view the badge catalog"
  on public.badges for select
  using (true);

create policy "Anyone can view earned badges"
  on public.user_badges for select
  using (true);

-- No INSERT policy on user_badges: awarded only via
-- check_and_award_badges() (SECURITY DEFINER), never directly by clients.

insert into public.badges (code, name, description, icon) values
  ('first_message',       'أول رسالة',        'استقبلت أول رسالة ليك',              'MessageCircleHeart'),
  ('hundred_reactions',    '100 إعجاب',        'رسايلك جمعت 100 تفاعل',               'Heart'),
  ('hundred_comments',     '100 تعليق',        'رسايلك جمعت 100 تعليق',               'MessageCircle'),
  ('popular_author',       'كاتب مشهور',       'وصلت لـ 500 تفاعل على رسايلك',        'Sparkles'),
  ('top_contributor',      'مساهم متميز',       'علّقت على 50 رسالة',                  'Award'),
  ('trend_creator',        'صانع ترند',        'رسالة ليك اتعملها 20 ريبوست',          'TrendingUp'),
  ('hundred_followers',    '100 متابع',        'وصلت لـ 100 متابع',                    'Users'),
  ('thousand_views',       '1000 زيارة',       'صفحتك اتشافت 1000 مرة',               'Eye');

-- ---------- Analytics: distinguish visit sources (QR / share / direct) ----------
alter table public.visits add column source text not null default 'direct'
  check (source in ('direct', 'qr', 'share', 'whatsapp', 'telegram', 'facebook', 'x'));
create index idx_visits_source on public.visits (profile_id, source);

-- ---------- Confession of the Day ----------
create table public.featured_messages (
  id uuid primary key default uuid_generate_v4(),
  message_id uuid not null references public.messages(id) on delete cascade,
  featured_date date not null unique,
  created_at timestamptz not null default now()
);

create index idx_featured_messages_date on public.featured_messages (featured_date desc);

alter table public.featured_messages enable row level security;

create policy "Anyone can view featured messages"
  on public.featured_messages for select
  using (true);

-- No INSERT policy: rows are created only via get_or_create_daily_feature()
-- (SECURITY DEFINER), never directly by clients.
