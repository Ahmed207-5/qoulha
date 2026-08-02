-- =========================================================
-- Push notifications — Database Webhook
--
-- Every notification-creating path in this schema (new message, reply,
-- comment, reaction, repost, follow, mention, daily space post/mention,
-- admin broadcast, moderation — see 0016, 0021, 0022, 0025, 0026, 0027,
-- 0028, 0029) ends the same way: a row lands in public.notifications,
-- either via create_notification() or a direct bulk insert for
-- broadcasts. That single table is therefore the one choke point that
-- guarantees every notification type gets a push, without having to hook
-- each of the ~10 trigger functions individually and without touching
-- any of them.
--
-- `supabase_functions.http_request` is the same trigger function the
-- Supabase Dashboard's "Database Webhooks" UI generates under the hood
-- (built on pg_net, pre-installed on every Supabase project) — this
-- migration just declares it in code instead of via the dashboard, to
-- stay consistent with how every other piece of this schema is managed.
--
-- IMPORTANT — two placeholders below must be filled in for your project:
--   1. '<YOUR_DEPLOYED_APP_URL>' -> your deployed app's origin, e.g.
--      'https://qoulha.vercel.app' (no trailing slash). For local
--      development against the Supabase CLI, use
--      'http://host.docker.internal:3000' instead (see Supabase's local
--      Database Webhooks docs) and swap it back before deploying.
--   2. '<YOUR_PUSH_WEBHOOK_SECRET>' -> any random string, must exactly
--      match the PUSH_WEBHOOK_SECRET environment variable set on your
--      Next.js deployment (src/app/api/push/send/route.ts checks this
--      header before doing anything, since this URL is reachable by
--      anyone on the internet).
--
-- If you'd rather manage this through the dashboard instead (Database ->
-- Webhooks), skip this file and create the equivalent webhook there
-- pointing at POST /api/push/send with the same header — either path
-- produces the same trigger.
-- =========================================================

drop trigger if exists push_notification_webhook on public.notifications;

create trigger push_notification_webhook
  after insert on public.notifications
  for each row execute function supabase_functions.http_request(
    'https://qoulha.vercel.app/api/push/send',
    'POST',
    '{"Content-Type":"application/json","x-webhook-secret":"Qoulha_2026@Push_9X8L2"}',
    '{}',
    '5000'
  );
