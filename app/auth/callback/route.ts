// /auth/callback — magic-link return URL.
//
// When a visitor clicks the magic link in their email, Supabase appends a
// `code` query parameter and points the browser at this route. We exchange
// that code for a session (which sets the auth cookies), then redirect.
//
// Route handlers run on the server and CAN set cookies, so this is the right
// place for the exchange — not a Server Component.

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Optional ?next= for deep-linking after sign-in (e.g. ?next=/listings).
  // Default to /profile so the first sign-in feels like a real destination.
  const next = searchParams.get("next") ?? "/profile";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing-code`);
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // Route handlers CAN write cookies; no try/catch needed here.
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  return NextResponse.redirect(`${origin}${next}`);
}
