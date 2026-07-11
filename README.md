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
   This applies `supabase/migrations/0001_init_schema.sql` (tables, enums,
   triggers) and `0002_rls_policies.sql` (row-level security).
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
