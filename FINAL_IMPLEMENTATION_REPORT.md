# Qoulha — Final Implementation Report

## Scope of this delivery

Two prior deliveries are assumed complete and unmodified in their core
architecture: the original production-ready app (auth, anonymous
messages, wall, admin dashboard, basic public profiles) and Milestone 1
(replies, comments, reactions, reposts, sharing). This report covers
everything built since: **Phase 1 (Notifications + Follow System)** and
**Phase 2 (Tags, XP/Levels, Badges, Trending, Leaderboard, Advanced
Search, full Profile System, Profile Sharing, Profile Link Analytics,
Moderation Queue enhancements, Confession of the Day, Random Message)**,
plus a full production review pass in between that found and fixed 4
critical pre-existing bugs (documented in `CHANGELOG.md`, summarized
again below since they materially affect production readiness).

## Database changes

**19 migrations total (`0001`–`0019`)**, applied in strict numeric order.
`0001`–`0016` predate this report (original schema through Milestone 1
and Phase 1 notifications); `0017`–`0019` were added in this delivery:

| Migration | Purpose |
|---|---|
| `0017_tags.sql` | `tags`, `message_tags` tables + RLS |
| `0018_xp_badges_analytics_schema.sql` | `profiles.xp`, `xp_events`, `badges`, `user_badges`, `visits.source`, `featured_messages` |
| `0019_functions_xp_badges_tags.sql` | XP-awarding + badge-checking triggers on 6 tables, tag attachment, random message, daily feature functions |

**New tables:** `tags`, `message_tags`, `xp_events`, `badges`,
`user_badges`, `featured_messages`, plus (from Phase 1) `follows`.
**Altered tables:** `profiles` (+`xp`), `visits` (+`source`).
**New enum:** `xp_event_type`. **Extended enum:** `notification_type`
(from Phase 1).

Every new table has RLS enabled with explicit policies; every
write-heavy path (`notifications`, `user_badges`, `tags`,
`message_tags`, `featured_messages`) is deliberately **not** given a
direct client-facing `INSERT` policy — writes go through
`SECURITY DEFINER` functions instead. This is a repeated architectural
choice, not an oversight: it's the same pattern that fixed the critical
notification-trigger bug found in the production review, applied
proactively everywhere it's relevant in this phase, specifically to
avoid reintroducing that bug class.

## Architecture decisions worth knowing about

1. **Client-generated message IDs.** `sendMessageAction` now generates
   the message's UUID in application code (`crypto.randomUUID()`)
   instead of reading it back from the database after insert. This was
   forced by a real regression: requesting the inserted row back
   (`.select()`) triggers a Postgres RLS check requiring the new row to
   satisfy a `SELECT` policy, which an anonymous, unpublished, non-owned
   message never does. Verified directly — this would have silently
   broken anonymous sending again if shipped.
2. **XP and badges are ledgered, not just counted.** `xp_events` records
   every award with its source event and reference id, so XP can always
   be audited or recomputed, not just trusted blindly.
3. **Badge checking is intentionally asymmetric.** Most events run a
   full 8-badge recheck; the `visits` trigger (by far the highest-volume
   table) only checks the one badge that depends on visit count. This
   was a deliberate performance tradeoff, not an inconsistency.
4. **Engagement-sorted views (Trending, Search "most reacted/commented/
   reposted") sort in application code, not SQL**, because PostgREST
   can't order by a related table's aggregate count without a
   materialized view — not yet justified at this app's scale.
5. **The public profile page's layout changed from a centered single
   card to a scrollable page.** This was necessary, not a redesign
   choice: a profile page with tabs, stats, badges, and a share card
   structurally cannot be vertically centered. The `ProfileHeader` card
   component itself is unchanged.

## Testing performed

This delivery was verified the same way as the production review before
it — against a real, locally-installed Postgres instance, not just read
for correctness:

- **All 19 migrations** applied cleanly, in order, from a fresh database,
  confirmed twice (once mid-build, once as the final pass).
- **A 12-scenario end-to-end regression** covering: anonymous send with a
  logged-in sender (XP awarded), publish, tag attachment (including a
  bug found and fixed on the spot — see CHANGELOG), reply (XP to owner,
  notification to original sender), comment (XP to commenter,
  notification to owner), reaction (XP + badge check, confirmed
  `first_message` badge awarded correctly), repost, follow (XP +
  notification), a tracked profile visit (`source=qr`), random message,
  daily feature selection, admin moderation (unpublish), **and two
  explicit regression checks**: sender identity still fully unreadable
  via RLS, and a non-owner still cannot delete someone else's comment.
- **`npx tsc --noEmit`** — zero errors, checked after every major
  addition (not just at the end).
- **`npx eslint .`** — zero errors, zero warnings.
- **`npx next build`** — succeeds; final build has **26 routes** (up
  from 22 before this phase), only the same pre-existing benign Edge
  Runtime notice from `@supabase/supabase-js` (present since the
  original scaffold).

## Carried-forward critical fixes (from the production review, still in effect)

These were found and fixed before this phase began, and this phase's
regression suite re-confirmed all four still hold:

1. Sender identity column privacy (`0009`) — table-wide grants were
   silently defeating the original column-level revoke.
2. Comment deletion (`0010`) — soft-delete was completely non-functional
   for everyone, author and admin alike.
3. Sending a message end-to-end (`0011`, `0012`) — the app's core
   feature was broken by an RLS subquery blocked by inner-table RLS, and
   separately by a non-`SECURITY DEFINER` trigger writing to
   `notifications`.
4. Admin message moderation (`0013`) — `deleteReportedMessageAction`
   always silently matched zero rows.

## What's genuinely new for users

Notifications (with realtime bell), following other users, tags on
messages, XP/levels/badges (a real gamification layer), a full tabbed
profile page, profile sharing (PNG card + 4 platforms + QR), profile
link analytics, advanced search, trending, a leaderboard, a moderation
queue with search/filter/ban, random message discovery, and a daily
featured confession. All of it uses the existing Qoulha visual language
— no new design system, no generic components.

## Honest gaps

See `ROADMAP.md`'s "Known Gaps" section for the specific sub-items not
fully built (followers/following list pages, mutual-followers,
tag-filter-in-search, related-tags, date-range search filters, a
featured-message archive page, and full pagination on the three newest
list pages). Each is small, independent, and additive — none of them
compromise the correctness or security of what has been delivered.
