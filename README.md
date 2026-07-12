# Qoulha (قولها)

> في حاجات بنعرف نكتبها... ومبنعرفش نقولها.

Anonymous messaging platform — Next.js 15, Supabase, TypeScript.

**Status:** foundation phase complete (schema, RLS, folder structure, typed
data layer). See `ARCHITECTURE.md` for the full build roadmap.

## Stack
Next.js 15 (App Router) · React 19 · TypeScript (strict) · TailwindCSS ·
Framer Motion · shadcn/ui · Supabase (Auth, Postgres, Realtime, Storage) ·
React Hook Form · Zod · React Query

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in Supabase + Turnstile + Upstash keys
```

### Supabase project setup
1. Create a project at supabase.com.
2. Run the migrations in order via the SQL editor or CLI:
   ```bash
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```
   This applies all files in `supabase/migrations/` in numeric order — core
   schema and RLS (`0001`–`0004`), Milestone 1 social features (`0005`–`0008`),
   and four corrective fixes found during production review (`0009`–`0013`,
   see `CHANGELOG.md`). Migrations must run in numeric order; each depends
   on objects created by earlier ones.
3. In Authentication settings, enable Email and Google providers.
4. Generate types after any schema change:
   ```bash
   npm run db:types
   ```

### Run dev server
```bash
npm run dev
```

## Deployment (Vercel)
1. Push this repo to GitHub.
2. Import into Vercel, set the same env vars from `.env.example` in
   Project Settings → Environment Variables (all three environments).
3. Add your production domain to Supabase Auth → URL Configuration
   (Site URL + Redirect URLs) or OAuth callbacks will fail.
4. Deploy — Vercel builds with `next build` automatically.

## Security notes
- `SUPABASE_SERVICE_ROLE_KEY` must never be exposed client-side — it's only
  read in `src/lib/supabase/server.ts`'s `createServiceRoleClient`, which is
  never imported from a Client Component.
- Sender identity columns are revoked at the Postgres grant level, not just
  filtered in application code — see `ARCHITECTURE.md`.
- Turnstile captcha is bypassed automatically when `NODE_ENV=development`
  (both the widget and the server-side check in `src/lib/captcha.ts` skip
  verification), so local development needs no captcha keys at all. In any
  other environment, a missing `TURNSTILE_SECRET_KEY` fails closed — messages
  are rejected rather than silently allowed through unverified. Rate
  limiting and the profanity filter are unaffected by this and stay active
  in development too.
