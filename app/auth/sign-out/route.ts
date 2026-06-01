// POST /auth/sign-out — clears the session and redirects to the home page.
//
// Signed-out endpoint is a POST (not a GET link) so that nothing — a stray
// link prefetch, a third-party preview tool, an accidental bot — can sign a
// user out without an explicit form submit.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/`, {
    // Browsers default to GET on a 302 from a POST, which is what we want.
    status: 303,
  });
}
