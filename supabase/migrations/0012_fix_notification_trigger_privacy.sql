-- =========================================================
-- CRITICAL FIX — every message send failed at the notification trigger
--
-- increment_message_count() (0001_init_schema.sql) runs AFTER INSERT on
-- `messages` and does:
--
--   insert into public.notifications (user_id, type, payload) values (...)
--
-- `notifications` (0002_rls_policies.sql) only ever got SELECT and UPDATE
-- policies — there is no INSERT policy for any role. Combined with this
-- trigger function being SECURITY INVOKER (the default), the insert runs
-- as whichever role actually sent the message (anon or authenticated),
-- and is rejected outright: no permissive INSERT policy exists for
-- notifications at all, for anyone.
--
-- Verified locally: sending a message as `anon` succeeded at the
-- `messages` INSERT itself, then failed with "new row violates row-level
-- security policy for table notifications" from inside this trigger —
-- meaning no message could ever actually be sent end-to-end.
--
-- Fix: mark the trigger function SECURITY DEFINER, matching the pattern
-- already used by is_admin(), handle_new_user(), and
-- increment_visitor_count() for exactly this kind of backend-only
-- automated write that shouldn't be constrained by the calling role's
-- RLS view of a different table.
-- =========================================================

create or replace function public.increment_message_count()
returns trigger language plpgsql security definer as $$
begin
  update public.profiles
    set message_count = message_count + 1
    where id = new.recipient_id;
  insert into public.notifications (user_id, type, payload)
    values (new.recipient_id, 'new_message', jsonb_build_object('message_id', new.id, 'category', new.category));
  return new;
end;
$$;
