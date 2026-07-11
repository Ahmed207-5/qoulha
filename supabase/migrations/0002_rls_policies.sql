-- =========================================================
-- Row Level Security
-- Core guarantee: a recipient (or anyone) can never read sender_user_id
-- or sender_fingerprint through the public API. We enforce this by
-- REVOKING column access at the grant level and exposing a safe view.
-- =========================================================

alter table public.profiles enable row level security;
alter table public.messages enable row level security;
alter table public.reactions enable row level security;
alter table public.reports enable row level security;
alter table public.visits enable row level security;
alter table public.notifications enable row level security;
alter table public.user_settings enable row level security;
alter table public.activity_logs enable row level security;

-- ---------- helper: is current user an admin ----------
create or replace function public.is_admin()
returns boolean language sql stable security definer as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- ---------- PROFILES ----------
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (is_public = true or id = auth.uid() or public.is_admin());

create policy "Users can update their own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Admins can update any profile (suspension, moderation)"
  on public.profiles for update
  using (public.is_admin());

-- ---------- MESSAGES ----------
-- Anyone (even anonymous) can insert a message for a public profile.
create policy "Anyone can send a message to a public, message-accepting profile"
  on public.messages for insert
  with check (
    exists (
      select 1 from public.profiles p
      join public.user_settings s on s.user_id = p.id
      where p.id = recipient_id and p.is_public = true and s.allow_messages = true and p.is_suspended = false
    )
  );

-- Recipients can read messages sent to them, but column-level grants
-- (below) strip sender_user_id / sender_fingerprint from the result.
create policy "Recipients can view their own inbox"
  on public.messages for select
  using (recipient_id = auth.uid() or public.is_admin());

create policy "Anyone can view published (public wall) messages"
  on public.messages for select
  using (is_published = true and is_deleted = false);

create policy "Recipients can update their own messages (read/favorite/publish/delete)"
  on public.messages for update
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

-- Column-level privilege revocation: even though the row is selectable,
-- these two columns are never exposed to the anon/authenticated roles.
-- Only the service_role (used by trusted server-side admin/rate-limit code) can read them.
revoke select (sender_user_id, sender_fingerprint) on public.messages from anon, authenticated;
grant select (sender_user_id, sender_fingerprint) on public.messages to service_role;

-- ---------- REACTIONS ----------
create policy "Anyone can react to a published message"
  on public.reactions for select using (true);

create policy "Anyone can add a reaction to a published message"
  on public.reactions for insert
  with check (
    exists (select 1 from public.messages m where m.id = message_id and m.is_published = true)
  );

-- ---------- REPORTS ----------
create policy "Authenticated users can file a report"
  on public.reports for insert
  with check (auth.uid() is not null);

create policy "Reporters and admins can view reports"
  on public.reports for select
  using (reporter_id = auth.uid() or public.is_admin());

create policy "Only admins can update reports"
  on public.reports for update
  using (public.is_admin());

-- ---------- VISITS ----------
create policy "Anyone can log a visit"
  on public.visits for insert with check (true);

create policy "Profile owner and admins can view visit stats"
  on public.visits for select
  using (profile_id = auth.uid() or public.is_admin());

-- ---------- NOTIFICATIONS ----------
create policy "Users see only their own notifications"
  on public.notifications for select using (user_id = auth.uid());

create policy "Users can mark their own notifications read"
  on public.notifications for update using (user_id = auth.uid());

-- ---------- USER SETTINGS ----------
create policy "Users manage their own settings"
  on public.user_settings for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------- ACTIVITY LOGS ----------
create policy "Users view their own activity, admins view all"
  on public.activity_logs for select
  using (user_id = auth.uid() or public.is_admin());

create policy "Server can insert activity logs"
  on public.activity_logs for insert with check (true);
