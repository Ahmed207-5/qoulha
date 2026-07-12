-- =========================================================
-- CRITICAL FIX — sender identity column privacy
--
-- 0002_rls_policies.sql attempted to hide messages.sender_user_id and
-- messages.sender_fingerprint from anon/authenticated with:
--
--   revoke select (sender_user_id, sender_fingerprint) on public.messages
--     from anon, authenticated;
--
-- This does NOT work. Supabase grants anon/authenticated table-wide
-- SELECT on every table in `public` by default (via ALTER DEFAULT
-- PRIVILEGES, applied automatically when each table is created). In
-- Postgres's privilege model, a table-wide SELECT grant authorizes
-- reading every column; revoking SELECT on specific columns afterward
-- does NOT retract that table-wide authorization for those columns —
-- the two grants exist independently, and the broader one still wins.
--
-- Verified locally: with `grant select on messages to authenticated`
-- already in place (Supabase's default), running
-- `revoke select (sender_user_id) on messages from authenticated`
-- leaves `select sender_user_id from messages` fully readable as
-- `authenticated`. The only way to actually block column access is to
-- revoke the table-wide grant entirely, then grant SELECT on just the
-- allowed column list — which is what this migration does.
--
-- In practice this was a latent gap rather than an active leak: every
-- application query path (dashboard, inbox, wall, message detail,
-- admin) already used explicit safe column lists and never selected
-- sender_user_id/sender_fingerprint. But it meant the guarantee lived
-- entirely in application code discipline, not in the database — so a
-- direct PostgREST call with `?select=sender_user_id` using the public
-- anon/authenticated API key would have returned it. This migration
-- makes the database itself the enforcement point, as originally
-- intended.
-- =========================================================

revoke select on public.messages from anon, authenticated;

grant select (
  id, recipient_id, content, category, mood,
  is_read, is_favorited, is_published, published_at,
  is_flagged, is_deleted, created_at
) on public.messages to anon, authenticated;

-- service_role (trusted server-only code, e.g. rate-limit/abuse checks)
-- keeps full column access, unchanged from 0002.
grant select (sender_user_id, sender_fingerprint) on public.messages to service_role;
