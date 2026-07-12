-- =========================================================
-- CRITICAL FIX — sending an anonymous message never actually worked
--
-- 0002_rls_policies.sql's INSERT policy on `messages` was:
--
--   with check (
--     exists (
--       select 1 from public.profiles p
--       join public.user_settings s on s.user_id = p.id
--       where p.id = recipient_id and p.is_public = true
--         and s.allow_messages = true and p.is_suspended = false
--     )
--   )
--
-- This subquery is evaluated under the CALLER's role (anon or
-- authenticated), and `user_settings` has its own RLS policy scoping
-- SELECT to `user_id = auth.uid()`. For anyone other than the recipient
-- themselves, that join against user_settings returns zero rows —
-- Postgres RLS applies to a table everywhere it's referenced, including
-- inside another table's policy expression, not just top-level queries
-- against it directly.
--
-- Verified locally: evaluating this exact predicate as `anon` for a
-- real public, message-accepting profile returned false. The INSERT
-- would have been rejected for every sender except the recipient —
-- i.e. nobody could ever actually send someone else a message.
--
-- Fix: move the cross-table check into a SECURITY DEFINER function,
-- the same pattern already used by is_admin() elsewhere in this schema,
-- so the check runs with the function owner's privileges and isn't
-- subject to the caller's RLS view of `user_settings`.
-- =========================================================

create or replace function public.recipient_accepts_messages(p_recipient_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles p
    join public.user_settings s on s.user_id = p.id
    where p.id = p_recipient_id
      and p.is_public = true
      and s.allow_messages = true
      and p.is_suspended = false
  );
$$;

grant execute on function public.recipient_accepts_messages(uuid) to anon, authenticated;

drop policy "Anyone can send a message to a public, message-accepting profile" on public.messages;

create policy "Anyone can send a message to a public, message-accepting profile"
  on public.messages for insert
  with check (public.recipient_accepts_messages(recipient_id));
