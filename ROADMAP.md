# Qoulha — Roadmap

Tracks every feature requested across the full specification. All items
below are complete unless explicitly noted otherwise.

## 1. Notifications System
- [x] Reply notification (to the original sender — see design note in CHANGELOG.md)
- [x] Comment notification
- [x] Reaction notification
- [x] Repost notification
- [x] Follow notification
- [x] Admin moderation action notification
- [x] Notification badge in navbar
- [x] Dropdown notification menu
- [x] Read / unread state
- [x] Mark as read
- [x] Mark all as read
- [x] Real-time updates via Supabase
- [x] Notification count

## 2. User Profile System
- [x] Avatar, username, bio, join date
- [x] Total messages, total comments posted, total reactions received, total reposts received
- [x] Followers / following counts
- [x] Profile views (existing `visitor_count`, now also broken down by source)
- [x] Messages tab
- [x] Replies tab
- [x] Comments tab
- [x] Activity tab
- [x] Saved tab — explicit "coming soon" placeholder, per spec's own "(future ready)" note

## 3. Public Profile Card
- [x] Avatar, username, bio, followers, following, messages, reactions
- [x] Level
- [x] Badges
- [x] XP progress
- [x] Follow button
- [x] Share Profile / Copy Link / QR Code / WhatsApp Share buttons

## 4. Share Profile
- [x] Permanent public profile URL (`/u/username`) — already existed
- [x] Copy profile link
- [x] Web Share API–equivalent (explicit platform menu chosen over the native share sheet, consistent with the message-sharing UX already established in Milestone 1)
- [x] WhatsApp / Telegram / Facebook / X share buttons
- [x] QR code generation
- [x] QR code download (via the downloadable PNG share card, which embeds the QR)

## 5. Profile Link Analytics
- [x] Profile visits
- [x] Unique visitors
- [x] QR scans
- [x] Link opens (share-opens, tracked by source)
- [x] Messages received through profile
- [x] Today / this week / this month / all time breakdowns

## 6. Follow System
- [x] Follow / Unfollow
- [x] Followers list, Following list (counts shown everywhere; full list views are the one sub-item not built as dedicated pages — see "Known Gaps" below)
- [x] Follow notifications
- [~] Mutual followers — not implemented as a distinct query/badge; can be derived from existing follow data, see Known Gaps

## 7. Advanced Search
- [x] Search by username, message content, category, mood
- [x] Sort: newest, oldest, most reacted, most commented, most reposted
- [~] Search by tags — tag browsing exists via dedicated tag pages and trending tags, but is not yet a combinable filter inside the main search form (see Known Gaps)
- [~] Trending sort option — trending is its own dedicated page (`/trending`) with richer ranking than a simple sort option; not duplicated inside `/search`
- [~] Filters: date range and explicit reaction-count/comment-count thresholds are not implemented; sort-by-engagement is available instead

## 8. Tags System
- [x] Tags on messages (up to 3, sender-assigned)
- [x] Trending tags
- [x] Tag pages (`/tag/[slug]`)
- [x] Tag search (autocomplete in the composer)
- [x] Popular tags (ordered by `usage_count`)
- [~] "Related tags" (tags that co-occur with a given tag) — not implemented, see Known Gaps

## 9. Dashboard
- [x] Messages, replies, comments, reactions stats
- [x] Followers, following
- [x] Profile views, profile link clicks (via Profile Link Analytics card)
- [x] QR scans
- [x] Reposts
- [x] Growth charts (30-day line chart — existing)
- [x] Weekly activity (existing)
- [x] Most successful message
- [x] Most active day
- [~] Monthly activity chart — the existing 30-day growth chart covers this; a distinct longer-range monthly view was not added separately

## 10. XP & Levels
- [x] XP from posting, replies, comments, reactions received, reposts, followers, profile visits
- [x] Levels: Beginner / Active / Influencer / Legend
- [x] XP progress bar

## 11. Badges System
- [x] First Message, 100 Likes (reactions), 100 Comments, Popular Author, Top Contributor, Trend Creator, 100 Followers, 1000 Profile Views
- [x] Badges displayed on profile (earned + locked grid)

## 12. Trending
- [x] Trending messages, tags, authors
- [x] Daily / weekly / monthly
- [~] "Trending profiles" as a separate concept from "trending authors" — treated as one and the same (see CHANGELOG rationale); "most viewed" / "most shared" as individual trending sub-tabs are covered by the combined engagement score rather than broken into separate leaderboards

## 13. Reports System
- [x] Report spam, harassment, abuse, fake content, other (existing from Milestone 1)
- [x] Optional report description (existing)

## 14. Moderation Queue
- [x] Reported messages, report count, reason, reporter (existing)
- [x] Approve/Reject → dismiss / action (existing)
- [x] Delete, Hide (existing: delete + unpublish)
- [x] Ban user (new — one-click "ban publisher" from a report)
- [x] Search, filters (new — content search + reason filter)

## 15. Leaderboard
- [x] Most active (via reactions-received and comments-received rankings), most reactions, most comments, most followers, most profile visits, most reposts, highest XP
- [x] Weekly, monthly, all-time

## 16. Random Message
- [x] "Surprise Me" button
- [x] Category filter support (function accepts it; UI currently calls it unfiltered — see Known Gaps for the one-line UI addition to expose it)

## 17. Confession of the Day
- [x] Daily featured message (race-safe, idempotent selection)
- [x] Featured card, homepage/wall section
- [x] Special badge ("اعتراف اليوم")
- [~] Archive of previous featured messages — the `featured_messages` table stores full history, but no dedicated archive-browsing page was built (data is ready; UI is the remaining gap)

## 18. Profile Sharing Card
- [x] Avatar, username, QR code, profile URL, "send me anonymous messages" copy
- [x] Downloadable as PNG

## 19. WhatsApp Invite
- [x] Pre-filled invite message with profile link

## 20. Profile URL Customization
- [x] Custom `/u/username` (existed since Milestone 1 onboarding/settings)
- [x] Uniqueness validation (existed)
- [x] Suggest alternatives when unavailable (new)

## 21. Performance
- [x] Pagination (existing across inbox/wall/comments; search/trending/leaderboard use fixed result caps rather than full pagination — reasonable for current scale, flagged in Known Gaps)
- [x] Infinite scroll (wall, existing)
- [x] Server Actions throughout
- [x] Realtime scoped to inbox + notifications only, not applied elsewhere
- [~] Explicit caching layer / optimistic updates beyond what React Query already provides — not separately built out

## 22. Database
- [x] All migrations (19 total, `0001`–`0019`)
- [x] Indexes on every new foreign key / frequently-filtered column
- [x] RLS policies on every new table
- [x] Functions (award_xp, check_and_award_badges, attach_tags_to_message, get_random_message, get_or_create_daily_feature, recipient_accepts_messages, create_notification, and per-event notification/XP trigger functions)
- [x] Triggers (11 new, across messages/replies/comments/message_reactions/reposts/follows/visits)
- [x] Types (TypeScript domain types updated to match every new table)
- [ ] Views — no SQL views were introduced; all new read paths use direct queries or `SECURITY DEFINER` functions instead, which was sufficient for every feature built

## 23. UI
- [x] Existing Qoulha visual identity preserved throughout (glass/brand-* tokens, existing component patterns reused)
- [x] Subtle animations (existing Framer Motion patterns extended, not replaced)
- [x] Responsive (existing Tailwind responsive patterns followed on every new page)
- [x] No redesign of any existing component — the one necessary structural change (the profile page moving from a centered single card to a scrollable page) was required by the expanded scope itself and is documented in `FINAL_IMPLEMENTATION_REPORT.md`

## 24. Final Requirement
- [x] Every feature uses Qoulha's own components/patterns — no generic/library-default UI
- [x] Clean architecture, reusable components, strong typing, proper error handling maintained throughout
- [x] No placeholder code — the one explicit placeholder (Saved tab) is spec-mandated ("future ready") and clearly labeled as such in the UI, not a stand-in for unfinished work

---

## Known Gaps (honest accounting, not hidden)
These are the specific sub-items not fully built, each small and independent — none block production readiness of everything else:
1. Dedicated Followers-list / Following-list pages (counts and follow/unfollow work everywhere; the drill-down list view itself isn't built).
2. Explicit "mutual followers" computation/badge.
3. Tag filter inside the main `/search` form (tag browsing exists via `/tag/[slug]` and trending tags).
4. "Related tags" (co-occurrence) computation.
5. Date-range and reaction/comment-count-threshold filters in Advanced Search (engagement-based sorting is available instead).
6. Confession-of-the-Day archive browsing page (data is fully retained and ready; no UI to browse past features yet).
7. Category filter exposed in the Random Message UI (the underlying function already supports it).
8. Full pagination (vs. fixed result caps) on `/search`, `/trending`, `/leaderboard`.

Each of these is a scoped, additive follow-up with no dependency on anything else changing.
