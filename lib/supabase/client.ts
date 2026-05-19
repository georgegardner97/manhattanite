// Supabase client for use in Client Components (anything with "use client").
//
// Uses the public anon (publishable) key, which is safe to expose in the browser.
// Row-Level Security policies on the database enforce who can read/write what.
//
// Server-side code should use the createClient() helper in ./server.ts instead,
// which handles cookies for Supabase Auth.

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
