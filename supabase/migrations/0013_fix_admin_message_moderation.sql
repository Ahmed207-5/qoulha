-- =========================================================
-- CRITICAL FIX — admin message moderation silently did nothing
--
-- 0002_rls_policies.sql's only UPDATE policy on `messages` is:
--
--   using (recipient_id = auth.uid()) with check (recipient_id = auth.uid())
--
-- There is no admin bypass — unlike `profiles` (which has a separate
-- "Admins can update any profile" policy) and `comments`/`reports`
-- (whose own policies already include `or public.is_admin()`).
--
-- deleteReportedMessageAction (src/actions/admin.ts) calls:
--
--   supabase.from('messages').update({ is_deleted: true, is_published: false })
--     .eq('id', messageId)
--
-- for a message that is virtually always NOT the admin's own — so this
-- update matched zero rows every time, silently. The action doesn't check
-- the result, so it always reported success while the reported message
-- stayed exactly as it was: still published, still visible on the wall.
-- Only the report's own status ever actually changed to "actioned".
--
-- Verified locally: an admin attempting this exact update against another
-- user's message returned "UPDATE 0" — no error, no effect.
--
-- Fix: add a second permissive UPDATE policy for admins, mirroring the
-- existing pattern already used on `profiles`.
-- =========================================================

create policy "Admins can update any message (moderation)"
  on public.messages for update
  using (public.is_admin())
  with check (public.is_admin());
