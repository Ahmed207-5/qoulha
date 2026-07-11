import { createBrowserClient } from '@supabase/ssr';

/**
 * Supabase client for use inside Client Components ("use client").
 * Safe to call repeatedly — createBrowserClient caches internally.
 *
 * Note: intentionally untyped against Database here. Run `npm run db:types`
 * after connecting your real Supabase project to generate accurate types,
 * then re-add `<Database>` once the schema is introspected rather than
 * hand-maintained (mismatches between a hand-written Database type and
 * supabase-js's generic constraints produce false `never` errors).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
