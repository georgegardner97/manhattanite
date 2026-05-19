// Supabase client for use in Server Components, Route Handlers, and Server
// Actions. Reads/writes the auth cookies on every request so that a signed-in
// user's session flows through to the database queries (RLS uses the user id).
//
// Client Components should use the createClient() helper in ./client.ts.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  // In Next.js 16, cookies() is async. Await it before passing the store
  // into Supabase's cookie adapter.
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
          // Server Components can't actually write cookies — the try/catch
          // swallows that. Middleware will refresh sessions properly once
          // we add auth in slice 2.
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // No-op in read-only contexts (Server Components).
          }
        },
      },
    }
  );
}
