// Next.js middleware — runs on every matched request before the route loads.
//
// Purpose: refresh the Supabase Auth session. Magic-link tokens expire after
// a while; without a refresh on each request, a logged-in user would silently
// be logged out partway through a session. The @supabase/ssr cookie adapter
// reads the auth cookie on the request, calls Supabase Auth to refresh if
// needed, and writes the new cookie onto the response.
//
// Reference pattern: Supabase Next.js App Router SSR docs.

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  // Start with a response that mirrors the incoming request. We'll attach
  // any new auth cookies to this response below.
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write to the request (so downstream Server Components see the
          // fresh cookie) and to the response (so the browser receives it).
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Calling getUser() forces a token refresh if needed. Result is discarded;
  // the side effect (cookie refresh) is what we want.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Run on every path EXCEPT static assets and the favicon. Adjust if we add
  // truly public routes that should skip middleware.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
