-- =========================================================
-- CRITICAL FIX — comment deletion was completely non-functional
--
-- 0006_comments.sql gave `comments` exactly one SELECT policy:
--
--   using (is_deleted = false and <message is published>)
--
-- Soft-deleting a comment (author or admin sets is_deleted = true via
-- UPDATE) silently failed for EVERYONE, always, with "new row violates
-- row-level security policy for table comments". Verified locally:
--
--   - Comment author attempting to delete their own comment: rejected.
--   - Admin attempting to delete any comment: rejected.
--   - Even a temporary `using (true) with check (true)` UPDATE policy
--     still rejected the same UPDATE.
--
-- Root cause: Postgres's RLS model requires the UPDATED row to remain
-- visible under at least one permissive SELECT policy for the acting
-- role, IN ADDITION to satisfying the UPDATE policy's own WITH CHECK.
-- Since the only SELECT policy on `comments` explicitly excludes
-- is_deleted = true rows, setting is_deleted = true made the new row
-- invisible under every SELECT policy — so the UPDATE was rejected
-- regardless of the UPDATE policy passing.
--
-- The original `messages` table's own soft-delete (is_deleted flag,
-- same pattern) happens to avoid this because it has a SECOND SELECT
-- policy ("Recipients can view their own inbox") that is NOT gated on
-- is_deleted — so the recipient's own messages always remain visible
-- to them regardless of deletion state, satisfying Postgres's check.
-- `comments` never had an equivalent fallback policy. This migration
-- adds one, mirroring that existing, working pattern.
-- =========================================================

create policy "Authors and admins can always see their own comments"
  on public.comments for select
  using (author_id = auth.uid() or public.is_admin());
