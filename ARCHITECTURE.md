# Qoulha — Architecture

## Anonymity model (the core guarantee)
The recipient must never learn who sent a message. This is enforced in three
layers, not just in the UI:

1. **Column-level revoke in Postgres** — `sender_user_id` and
   `sender_fingerprint` on `messages` are revoked from `anon`/`authenticated`
   roles at the grant level (`0002_rls_policies.sql`). Even a bug in application
   code or a hand-crafted API call cannot leak these columns to a browser.
2. **`sender_fingerprint` is a one-way hash** (IP + user-agent + optional user id),
   never the raw values, used only by server-side abuse detection.
3. **Type-level mirroring** — `InboxMessage` in `src/types/domain.ts` simply has
   no sender field, so a developer extending the dashboard can't "accidentally"
   destructure a value that was never queryable in the first place.

## Route groups
- `(marketing)` — public landing page, SSG/ISR.
- `(auth)` — login/register/forgot/reset/verify, redirects if already logged in.
- `(onboarding)` — forced profile setup, gated by `profiles.onboarding_completed`.
- `(protected)` — dashboard/settings/inbox, gated by middleware.
- `u/[username]` — public profile + send-message page, no auth required.
- `wall` — public wall of published messages.
- `admin` — gated by `profiles.is_admin`, checked in middleware AND in RLS.

## Data flow
- **Reads** on Server Components use `src/lib/supabase/server.ts` (RLS-bound,
  respects the logged-in user's session).
- **Realtime** (inbox counters, new-message toasts) subscribes via the browser
  client to `postgres_changes` on `messages` filtered by `recipient_id=eq.<id>`.
- **Mutations** go through Server Actions in `src/actions/*`, which validate
  with Zod before touching Supabase — never trust client input twice.
- **Rate limiting / spam / profanity filtering** happens server-side in the
  `sendMessage` action, before the insert, using Upstash Redis + a profanity
  word-list — never client-side only.

## Why denormalized `message_count` / `visitor_count`
Dashboard stat cards are read far more often than messages are written, so we
maintain running counters via triggers (`increment_message_count`) instead of
`count(*)` on every dashboard load. This is the standard tradeoff for
read-heavy analytics at "thousands of users" scale.

## Build phases
1. ✅ Architecture, DB schema + RLS, folder structure, typed data/validation layer (this delivery)
2. Landing page + design system (tokens, shared UI primitives)
3. Auth + onboarding flows
4. Public profile + send-message page (captcha, category/mood picker)
5. Dashboard + realtime inbox + message cards
6. Public wall (infinite scroll, reactions, search)
7. Analytics charts + settings + export/delete account
8. Admin panel (users, reports, moderation, logs)
9. SEO, deployment guide, final polish pass
