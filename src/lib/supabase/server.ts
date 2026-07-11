import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * Supabase client for Server Components, Server Actions, and Route Handlers.
 * Must be created fresh per-request (reads the request's cookies).
 *
 * Note: intentionally untyped against Database here. Run `npm run db:types`
 * after connecting your real Supabase project to generate accurate types,
 * then re-add `<Database>` once the schema is introspected rather than
 * hand-maintained (mismatches between a hand-written Database type and
 * supabase-js's generic constraints produce false `never` errors).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component (no cookie write access) —
            // safe to ignore because middleware refreshes the session.
          }
        },
      },
    }
  );
}

/**
 * Privileged client for trusted server-only operations (rate limiting,
 * admin moderation, reading sender_fingerprint for abuse detection).
 * NEVER import this into anything that reaches the client bundle.
 */
export function createServiceRoleClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
