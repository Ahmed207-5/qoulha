# Inbox disappearing after the 0025 migration — diagnosis & fix

## What I checked
I diffed both project versions file by file — every file that differs, and
also the files that *don't* differ but sit on the `/inbox` render path
(`inbox/page.tsx` → `InboxList` → `getInboxMessagesAction` → `inbox-query.ts`),
to be sure nothing upstream was silently broken too.

**Result: the application code is correct for the new schema.**

- `inbox-query.ts` was correctly updated to drop the `replies(...)` embedded
  join (the `replies` table no longer exists after `0025`) and select the
  plain `messages` columns instead. It still filters on
  `recipient_id = auth.uid()` and `is_deleted = false`, exactly like the
  old working version.
- `0025_conversation_messages.sql` never touches the `messages` table itself
  — no `ALTER`, no `UPDATE`, no `DELETE`. It only creates
  `conversation_messages`, backfills it from the old `replies` table, then
  drops `replies`. Your messages were never in the blast radius.
- Every other file that references the old `Reply`/`replies` model
  (`message-detail-service.ts`, `wall-service.ts`, `search-service.ts`,
  `trending-service.ts`, `profile-activity-service.ts`,
  `notification-item.tsx`, `message-card.tsx`) was updated consistently, and
  I confirmed there are zero remaining references to `replies` anywhere in
  the codebase (checked with a full-project grep).

So the code cannot explain rows silently vanishing — which points at the one
thing outside the code: **Supabase/PostgREST's schema cache.**

## Why this happens
`DROP TABLE public.replies CASCADE` doesn't just drop `replies` — it cascades
to every policy, trigger, and relationship PostgREST had cached that touched
it. PostgREST keeps its own introspected copy of your schema for
performance, and after DDL like this (especially when run by hand in the SQL
editor rather than through the Supabase CLI's migration flow, which
auto-notifies), that cache can go stale. The symptom is exactly what you
saw: the data is untouched in Postgres, the migration itself succeeded, but
queries against `messages` come back looking empty until the cache catches
up.

This is *not* a schema change, a new migration, or a restore — it's telling
PostgREST to re-read the schema it already has.

## The fix (no schema/migration changes)
Run one of these (either is sufficient, pick whichever is easier for you):

**Option A — SQL editor:**
```sql
NOTIFY pgrst, 'reload schema';
```

**Option B — Dashboard:**
Project Settings → API → click **"Reload schema"**.

Give it a few seconds, then reload your app's `/inbox` page.

## What I changed in the code (and why)
Independent of the above, I found that every read path in this app
(`inbox-query.ts`, `message-detail-service.ts`, `conversation-service.ts`,
etc.) swallowed Supabase errors silently:

```ts
if (error || !data) return { messages: [], totalCount: 0 };
```

This is *why the failure was invisible to you* — a real database error and
"this user has zero messages" render identically. I patched the three files
most relevant to this task (`inbox-query.ts`, `message-detail-service.ts`,
`conversation-service.ts`) to log the actual Supabase error to the server
console before falling back to an empty result, e.g.:

```ts
if (error) {
  console.error('[getInboxMessagesAction] Supabase query failed:', error);
  return { messages: [], totalCount: 0 };
}
```

Behavior for end users is unchanged (still a graceful empty state, never a
crash) — but now if this ever happens again, your server logs will tell you
exactly what Postgres/PostgREST said, instead of leaving you to diff two
codebases to rule out a code bug.

I did not touch the dozens of other `if (error) ...` spots elsewhere in the
app (settings, follows, reactions, etc.) — those are outside this task's
scope and already working, so I left them alone rather than introduce
unrelated changes.

## Everything else in this package
- The 10-messages-per-side conversation system is intact and unchanged from
  what you built (`conversation-service.ts`, `actions/conversation.ts`,
  `conversation-thread.tsx`, the `/m/[messageId]` page).
- Opening a message from the inbox (`MessageCard`) links to `/m/[id]`, which
  renders the new conversation thread — confirmed this wiring is correct.
- No database schema changes, no new migrations, nothing destructive.
