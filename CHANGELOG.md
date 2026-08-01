# Changelog

## [Fix] — Mentions and @all were broken; restored

Root-caused with an actual local Postgres instance (applied all 29
migrations against it and exercised every path as the real `authenticated`
role, not a superuser bypass) rather than guessing. Two real bugs, both
purely database-side — no TypeScript changed:

- **The actual cause**: `admin_create_daily_post()`, `admin_archive_daily_post()`
  (0026) and `broadcast_admin_announcement()` (0028) were each missing the
  `grant execute ... to authenticated` that every other RPC-callable
  function in this project has right next to its definition (see 0004,
  0011, 0019, 0020, 0024 — this project does not rely on Postgres's
  default PUBLIC-execute grant for functions). Without it, calling any of
  the three failed with "permission denied for function...". Concretely:
  admins couldn't create a Today's Space post at all, so there was never
  an active post to mention anyone *in* — making Today's Space's
  @username mentions and @all both look broken. Wall-post @all failed the
  same way. Wall comments and Today's Space replies were never affected
  by this one — they insert directly into a table and their mention
  trigger fires implicitly, which never needed an execute grant. Fixed by
  adding the three missing grants (`0029_fix_mention_grants_and_broadcast.sql`).
- **A related fragility, hardened defensively**: `notify_on_mention()`
  and `notify_on_daily_space_mention()` already verify the row's author
  is an admin with a direct check before broadcasting — calling through
  `broadcast_admin_announcement()`, which *also* independently re-derives
  admin status and raises on any mismatch, meant a divergence there would
  abort the whole trigger — rolling back the entire insert, including any
  ordinary @username mentions bundled in the same comment/reply. Split
  into an internal, no-recheck function (used by the triggers, which
  already did the real check) and the original public, self-checking
  wrapper (kept only for the one legitimate client-facing caller — Wall
  post publishing).
- Verified end-to-end against a real Postgres instance, as the
  `authenticated` role with RLS enforced (not a superuser bypass): normal
  @username mentions (comments, Today's Space replies), @all by an admin
  in all four surfaces (Wall posts, Wall comments, Today's Space posts,
  Today's Space replies) broadcasting correctly, @all by a regular user
  doing nothing and raising no error, and a non-admin directly calling
  `broadcast_admin_announcement`/`admin_create_daily_post` still
  correctly rejected.

## [@all] — Admin-only broadcast mention

Added one special, reserved mention token — `@all` — usable only by
admins, across every place @mentions already exist: Wall posts, Wall
comments, Today's Space, and Today's Space replies. Publishing it
notifies every user with one `admin_broadcast` notification
(💜 إعلان جديد من Qoulha / افتح وشوف الجديد.) linking back to wherever it
was published.

- **Reused, not rebuilt** (`0028_admin_all_mention.sql`): the exact same
  `@username` token loop already inside `notify_on_mention()` (wall
  comments, 0021) and `notify_on_daily_space_mention()` (Today's Space
  replies, 0026) now special-cases the token `all` — if the row's author
  is an admin, broadcast; otherwise it falls through to the pre-existing
  per-username lookup completely unchanged. For a regular user, `@all`
  behaves exactly as it always would have (i.e. nothing, unless a real
  user is literally named "all") — no new validation, no new UI, no way
  for them to "use" it.
- **Today's Space itself**: `admin_create_daily_post()` is already
  admin-gated, so `@all` in a daily post's own content always qualifies —
  checked with the same token-matching, no author check needed.
- **Wall posts are the one app-code case**: a message's content is
  written by whoever *sent* it (sometimes anonymously — see
  0022/0023_message_mentions.sql), a different person from the recipient
  who later chooses to publish it. So `@all` there is checked against the
  *publisher* at the moment of publishing (`togglePublishAction` in
  `message-mutations.ts`), not the original author — via a new
  `containsAllMention()` helper (`src/lib/mentions.ts`) and an RPC call to
  the new `broadcast_admin_announcement()`, which re-checks `is_admin()`
  itself regardless of what the caller already checked (same defensive
  posture as every other admin-only `SECURITY DEFINER` function here).
  Only fires on the actual unpublished→published transition, not on
  every re-toggle.
- Existing `mention`/`daily_space_mention` notifications, comment/reply
  posting, and message publishing are all otherwise byte-for-byte
  unchanged.

## ["Today's Space"] — Discoverability & daily-engagement redesign

Moved Today's Space off the Wall and into its own dedicated, sidebar-linked
page, and made it something users get pulled back to daily instead of
just stumbling across.

- **Moved, not duplicated**: removed `<TodaySpaceSection/>` from
  `src/app/wall/page.tsx`; it now renders as the body of the new
  `src/app/(protected)/today-space/page.tsx`. Every existing interaction —
  posting the one public reply, liking, replying to replies, @mentions,
  the archive browser — is the exact same component tree, untouched.
- **Sidebar entry**: `💜 مساحة اليوم`, directly below `قد تعرفهم`, in both
  `Sidebar` (desktop) and `MobileNav` (bottom tab bar) — added as one more
  row in each nav list, same markup shape as every other item.
- **Unread dot** (`0027_daily_space_engagement.sql`): a single-row-per-user
  `daily_post_views` table — an *upsert*, not a per-view log — records the
  last daily post a user has seen. `getDailySpaceUnreadStatus()` compares
  that against the current active post to light a small purple dot on the
  sidebar item; opening `/today-space` clears it immediately via
  `markDailySpaceViewedAction()` + `router.refresh()` (`DailySpaceViewMarker`).
- **Publish notification**: `admin_create_daily_post()` now also bulk-inserts
  a `daily_space_published` notification for every non-suspended user in
  the same statement that publishes the post — no per-user loop. Clicking
  it opens `/today-space`, same as a `daily_space_mention` notification
  (previously routed to `/wall`, now updated to match the move).

## ["Today's Space" (مساحة اليوم)] — Platform-managed daily post

A new, self-contained section on the Home/Wall page, sitting above the
Public Wall and deliberately never mixed with it: one admin-authored
daily post (question / discussion / poll / challenge / message) is
active at a time, every user gets one public top-level reply on it, can
like replies, can reply to other users' replies (one level deep), and
can @mention people — which notifies them, same as wall comments do.
Older daily posts are archived (not deleted) and stay browsable from an
in-page archive viewer. No existing feature was touched beyond two
additive, backwards-compatible enum extensions.

### Database (`0026_daily_space.sql`)
- `daily_posts` — admin-authored posts. A partial unique index on
  `status` enforces "only one active at a time" at the database level;
  all writes go through `admin_create_daily_post()` /
  `admin_archive_daily_post()` (`SECURITY DEFINER`, both re-check
  `is_admin()` themselves) — there is no client-facing insert/update
  policy at all.
- `daily_post_replies` — one level of nesting via `parent_reply_id`. A
  second partial unique index caps top-level replies at one per user per
  post (excluding soft-deleted rows), while nested replies-to-replies are
  uncapped. Insert policy only accepts new replies on the currently
  active post and only allows nesting one level deep.
- `daily_post_reply_likes` — plain like join table, same shape as
  `message_reactions`.
- `notify_on_daily_space_mention()` — @mention detection, notification
  dedupe/self-mention/max-5 rules copied exactly from
  `notify_on_mention()` (`0021_comment_mentions.sql`), just retargeted at
  replies and a new `daily_space_mention` notification type so it
  deep-links to `/wall` instead of a wall message.
- Extends (never replaces) `notification_type` and `activity_action`,
  following the precedent set in `0015_extend_notification_types.sql`.

### App
- `src/services/daily-space-service.ts` / `src/actions/daily-space.ts` —
  reads and mutations, mirroring the batched-count-query pattern in
  `wall-service.ts` and the rate-limit/profanity/mention-cap pipeline in
  `comments.ts` (new `checkDailySpaceReplyRateLimit`, reusing
  `checkReactionRateLimit` for likes).
- `src/components/daily-space/*` — `TodaySpaceSection` (server entry,
  renders nothing if there's nothing to show), `TodaySpaceCard`,
  `DailySpaceReplyItem`/`DailySpaceReplyForm` (reusing the existing
  `useMentionInput` hook and `MentionAutocomplete`/`MentionText`
  components as-is), `DailySpaceLikeButton`, `DailySpaceArchive`.
- `src/app/admin/daily-space/` + `AdminDailySpaceManager` — publish a new
  daily post (auto-archives the current one) or end it early, following
  the existing `admin/reports` page's layout and action conventions.

## [Phase 2] — Growth & Discovery: Tags, XP/Levels, Badges, Trending, Leaderboard, Search, Full Profile System, Sharing

The largest single addition to Qoulha: turns the social layer built in
Milestone 1 into a full growth/discovery platform. No existing feature
was redesigned; every addition follows the established glass/brand-*
visual language and existing architectural patterns.

### Database (migrations 0017–0019)
- **`0017_tags.sql`** — `tags` + `message_tags` tables. Freeform tags set
  by the sender at compose time, normalized (lowercased, slugified,
  supports Arabic), capped at 3 per message.
- **`0018_xp_badges_analytics_schema.sql`** — `profiles.xp` column +
  `xp_events` audit ledger; `badges` catalog (8 seeded badges) +
  `user_badges`; `visits.source` column (direct/qr/share/whatsapp/
  telegram/facebook/x) for link analytics; `featured_messages` table for
  Confession of the Day.
- **`0019_functions_xp_badges_tags.sql`** — `award_xp()` and
  `check_and_award_badges()` (both `SECURITY DEFINER`, following the
  pattern established in `0012`); per-table triggers awarding XP and
  checking badges on every message/reply/comment/reaction/repost/follow/
  visit event; `attach_tags_to_message()`, `get_random_message()`,
  `get_or_create_daily_feature()`.

**Bug found and fixed during this same batch** (never shipped, so fixed
in place rather than as a corrective migration): `attach_tags_to_message`
initially counted duplicate tag names within one submission against the
3-tag cap and over-incremented `usage_count` on duplicates — verified via
direct testing (an Arabic tag was silently dropped because two English
duplicates consumed the cap first). Fixed to only count/increment on
genuinely new attachments.

**Regression discovered while wiring tags into `sendMessageAction`**:
adding `.select().single()` to read back the new message's id broke
anonymous sending entirely — Postgres requires an `INSERT ... RETURNING`
row to satisfy a `SELECT` policy, which an unpublished message sent by a
non-recipient never does. Fixed by generating the message id client-side
(`crypto.randomUUID()`) instead of reading it back, avoiding `RETURNING`
entirely. Verified directly against Postgres before and after.

### New features
- **XP & Levels** — Beginner → Active → Influencer → Legend, computed
  from `profiles.xp` (pure function, no DB round-trip). XP awarded for
  sending, replying, commenting (to the actor) and for reactions/reposts/
  followers/profile-visits received (to the recipient).
- **Badges** — 8 badges, auto-awarded via trigger-driven threshold checks;
  displayed on the profile as an earned/locked grid.
- **Full Profile System** — Messages/Replies/Comments/Activity/Saved
  tabs on `/u/[username]`; Saved is an explicit "coming soon" placeholder
  per spec ("future ready"). Stats: total messages, comments posted,
  reactions received, reposts received, join date.
- **Follow-aware Public Profile Card** — follower/following counts,
  follow/unfollow button, level progress, badges — added to the existing
  `ProfileHeader` card, not a redesign of it.
- **Share Profile** — copy link (existing), WhatsApp/Telegram/Facebook/X
  invite buttons with the specified "send me an anonymous message" copy,
  and a downloadable PNG share card (`html-to-image`, new dependency).
- **Profile Link Analytics** — visits, unique visitors, QR scans, and
  share-opens, each broken down by today/week/month/all-time, plus
  messages received through the profile link. Tracked via a `source`
  query param (`?src=qr`, `?src=whatsapp`, etc.) on the profile URL.
- **Tags** — compose-time tag picker with autocomplete, tag chips on
  every message card, dedicated `/tag/[slug]` pages, trending tags bar.
- **Advanced Search** (`/search`) — messages by content/category/mood
  with newest/oldest/most-reacted/most-commented/most-reposted sort, plus
  username search.
- **Trending** (`/trending`) — daily/weekly/monthly trending messages
  (engagement-scored: reactions + comments×2 + reposts×3), trending tags,
  trending authors.
- **Leaderboard** (`/leaderboard`) — XP/reactions/comments/followers/
  reposts/visits, each rankable by week/month/all-time.
- **Random Message** ("فاجئني برسالة") and **Confession of the Day** —
  both backed by dedicated, race-safe SQL functions.
- **Moderation Queue enhancements** — search and reason filters on the
  admin reports list; one-click "ban publisher" (suspends the message's
  recipient) directly from a report, reusing the existing
  `suspendUserAction`.
- **Profile URL customization enhancement** — username availability
  already existed (Milestone 1); added automatic alternative-username
  suggestions when the requested one is taken, shown as tappable chips
  in onboarding.

### Notification System (this phase's foundation, built first since
several other features depend on it)
- New `follows` table (public read, self-follow blocked by a `CHECK`
  constraint).
- Extended `notification_type` enum with `new_reply`, `new_comment`,
  `new_repost`, `new_follower` (reusing existing `reaction`/`moderation`
  where they already fit).
- Every notification is created via a shared `SECURITY DEFINER` helper —
  deliberately no direct `INSERT` policy on `notifications`, avoiding the
  exact bug class fixed in the previous review's `0012` migration.
- **Design decision, stated up front and unchanged**: "someone replies to
  their message" notifies the **original sender** (if logged in when they
  sent it), not the recipient — only the recipient can create a reply in
  this app's model, so the recipient can never be the notification target
  for their own action.
- Bell + badge + realtime dropdown wired into the marketing navbar, wall,
  message detail page, dashboard sidebar, and a new mobile topbar.

### Verification performed for this entire phase
- All 19 migrations applied in order against a real local Postgres
  instance, from a fresh database, twice (once before wiring the app
  layer, once as the final end-to-end pass).
- A 12-scenario end-to-end regression covering every new trigger (message
  → XP, reply → XP + notification, comment → XP + notification + badge
  check, reaction → XP + badge, repost → XP, follow → XP + notification,
  visit with source tracking, random message, daily feature, admin
  moderation) plus explicit regression checks that sender identity is
  still fully protected and that a non-owner still cannot delete someone
  else's comment.
- `npx tsc --noEmit`, `npx eslint .`, and `npx next build` all clean
  after every major addition, not just at the end — each checkpoint is
  recorded in this conversation's history.
- Final build: 26 routes (up from 22), zero errors, zero warnings beyond
  the pre-existing benign Edge Runtime notice from `@supabase/supabase-js`
  (present since the original project scaffold, not introduced by this
  phase).

---

## [Production Review] — Milestone 1 stabilization

A full production review of Milestone 1 (replies, comments, reactions,
reposts, sharing). No new features were added. Scope: code cleanup,
verification, and fixing every issue found.

### Verification performed
- `npx tsc --noEmit` — zero errors
- `npx eslint .` — zero errors, zero warnings
- `npx next build` — succeeds, all 22 routes build correctly
- All 13 SQL migrations applied in order against a real local Postgres
  instance (not just reviewed by eye), seeded with real users, and
  exercised end-to-end for every feature this milestone touches
- RLS policies tested behaviorally (as `anon`/`authenticated`, switching
  simulated identities), not just inspected as text

### Removed
- `addReactionAction` in `src/actions/message-mutations.ts` — dead code,
  superseded by `src/actions/reactions.ts`'s `setReactionAction`; the old
  anonymous `reactions` table it wrote to has no remaining callers.

### Fixed — code quality
- `tailwind.config.ts`: replaced `require('tailwindcss-animate')` with an
  ESM import (ESLint `no-require-imports` error).
- `.eslintrc.json`: excluded `next-env.d.ts` (auto-generated by Next.js,
  shouldn't be linted or hand-edited).

### Fixed — critical, found during this review (all pre-existing, none
introduced by Milestone 1; all confirmed via direct Postgres testing)

1. **Sender identity was not actually protected at the database level**
   (`0009_fix_sender_column_privacy.sql`). The original column-level
   `REVOKE SELECT (sender_user_id, sender_fingerprint) ... FROM anon,
   authenticated` never took effect, because Supabase's default
   project-level grants already give those roles table-wide `SELECT` —
   and a table-wide grant fully authorizes reading every column
   regardless of a later column-specific `REVOKE`. Verified directly:
   before this fix, `select sender_user_id from messages` succeeded for
   `authenticated`, including for the message's own recipient. The fix
   revokes table-wide `SELECT` entirely and grants it back only for the
   safe column list. In practice this had been a latent gap rather than
   an active leak, since the application never selected those columns —
   but a direct API call with the public anon key could have.

2. **Comments could never actually be deleted** — not by their author,
   not by an admin (`0010_fix_comment_deletion.sql`). Soft-deleting a
   comment (`UPDATE ... SET is_deleted = true`) always failed with a
   row-level security error. Postgres requires an updated row to remain
   visible under some permissive `SELECT` policy for the acting role;
   `comments` only had one `SELECT` policy, gated on `is_deleted = false`,
   so the very act of hiding a comment made it fail its own visibility
   check. Fixed by adding a second `SELECT` policy so authors/admins can
   always see their own comments regardless of deletion state — the same
   pattern `messages` already used, which is why this bug was specific to
   the new `comments` table.

3. **Sending a message has never worked end-to-end** against a real
   Supabase project (`0011_fix_send_message_policy.sql` and
   `0012_fix_notification_trigger_privacy.sql`) — this is the app's core
   feature.
   - The `messages` `INSERT` policy's `EXISTS` subquery joined
     `user_settings`, which has its own strict RLS (`user_id =
     auth.uid()`). That inner-table RLS applies even when the table is
     only referenced inside another table's policy expression, so the
     join returned nothing for anyone except the recipient themselves —
     meaning no one could actually send someone else a message. Fixed by
     moving the check into a `SECURITY DEFINER` function
     (`recipient_accepts_messages`), matching the existing `is_admin()`
     pattern.
   - Separately, the `increment_message_count()` trigger (which fires
     after every message insert) writes to `notifications`, but
     `notifications` has no `INSERT` policy for any role, and the trigger
     ran as `SECURITY INVOKER`. Every message send failed at this step,
     regardless of the policy fix above. Fixed by marking the trigger
     `SECURITY DEFINER`.
   - Verified: anonymous send, authenticated send, resulting
     `profiles.message_count` increment, and the resulting notification
     row all now work correctly end-to-end.

4. **Admin message moderation silently did nothing**
   (`0013_fix_admin_message_moderation.sql`). `deleteReportedMessageAction`
   updates a reported message's `is_deleted`/`is_published` — but the
   `messages` `UPDATE` policy only ever allowed `recipient_id =
   auth.uid()`, with no admin bypass (unlike `profiles`, `comments`, and
   `reports`, which all correctly include `OR is_admin()`). The update
   always matched zero rows; the action didn't check this, so it reported
   success while the reported message stayed exactly as it was. Fixed
   with an additional admin `UPDATE` policy, and hardened the action
   itself (`src/actions/admin.ts`) to check the update actually affected
   a row.

### Fixed — silent false-success in delete actions
Several new Milestone 1 actions deleted/soft-deleted rows without
checking whether anything was actually affected. If RLS silently blocked
an unauthorized attempt (zero rows, no error), the action still returned
`{ success: true }`, which would show a misleading success toast and an
optimistic UI update that reverts on next load. Fixed by adding
`.select()` and checking the returned row count in:
- `src/actions/comments.ts` (`deleteCommentAction`)
- `src/actions/replies.ts` (`deleteReplyAction`)
- `src/actions/reposts.ts` (`toggleRepostAction`'s un-repost path,
  `deleteRepostAdminAction`)
- `src/actions/admin.ts` (`deleteReportedMessageAction`)

### Confirmed working (regression-tested, no changes needed)
Send message → publish → reply → comment (create/delete
own/admin-delete) → react (set/change/clear) → repost (create/admin
remove) → favorite/unfavorite → unpublish → soft-delete own message →
admin suspend user → public wall visibility → sender identity blocked
throughout. Dashboard, settings, profile pages, and authentication flows
are untouched by this milestone and were not affected by any of the
above fixes.

---

## [Milestone 1] — Social features

Turned Qoulha from an anonymous-messaging app into a social anonymous
communication platform (ASK.fm-inspired): replies, comments, reactions,
reposts, and multi-platform sharing. See the Milestone 1 delivery message
for full feature details. Summary:

- **Replies** — one official owner reply per published message, editable,
  deletable.
- **Comments** — authenticated users can comment on published messages;
  newest-first, paginated; author or admin can delete.
- **Reactions** — five emoji (❤️😂🥺👏🔥), one per user, changeable, on a
  new `message_reactions` table (the original anonymous `reactions` table
  was left untouched and is no longer used).
- **Repost** — reference-only repost to one's own profile; original
  authorship always resolves live, never duplicated.
- **Share** — WhatsApp/Facebook/X/Telegram/Copy Link menu; new
  `/m/[messageId]` page with real per-message OpenGraph/Twitter metadata.
