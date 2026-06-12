// Shared route gate for the /admin surface.
//
// Every admin page calls requireAdmin() first:
//   - no session        → redirect to /login
//   - signed in, not an admin → notFound() — the admin surface doesn't exist
//     for non-admins; a 404 leaks nothing (vs. a redirect that confirms there
//     is something here).
//
// This is the UX layer of defense in depth. The real walls are underneath:
// the admin RLS policies (accounts 0002, applications 0007, listings 0015)
// and the admin guard inside the review functions (0015). Never rely on this
// check alone.

import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // RLS "read own row" covers this — everyone can read their own role.
  const { data: account } = await supabase
    .from("accounts")
    .select("role")
    .eq("id", user.id)
    .single<{ role: "account" | "member" | "admin" }>();

  if (account?.role !== "admin") {
    notFound();
  }

  return { supabase, user };
}
