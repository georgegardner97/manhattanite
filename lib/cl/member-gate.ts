// The one gate: a signed-in account that is not a member sees nothing of the
// product.
//
// WHY (George, 2026-09-15): "They shouldn't be able to see anything until their
// account has been approved. It ads the mystery. I know this goes against what
// I've said before. Nothing should be visible or accessible until they are
// approved." That reverses the 2026-06-09 three-layer model, in which a Tier 1
// account could browse everything and act on nothing.
//
// WHAT IT DOES. A logged-out visitor passes straight through (for now the guest
// teaser is a separate, open decision). A member passes. Anyone else holding a
// session is sent to /apply, where the only things on screen are their profile
// form or the review card, and a way to sign out.
//
// WHY A HELPER CALLED FROM EACH PAGE, NOT ONE PLACE. The honest answer is that
// these routes share nothing that can hold it:
//   - proxy.ts runs on every request including prefetches, and the Next 16
//     guidance is explicit that it must only read the cookie, never query the
//     database — and membership is a database fact, not a cookie one;
//   - the (cl) layout wraps /apply, /login and /join as well, and a layout is
//     not re-run on client navigation between the pages beneath it, so a gate
//     there can be walked past;
//   - moving the product routes into their own route group would move a dozen
//     files for a one-line check.
// So the rule lives here, once, and every product page calls it as its first
// line. A new product screen that does not call it is wrong, the same way a new
// listings read that bypasses listings-read.ts is wrong.
//
// THIS IS NOT THE WRITE WALL. Posting, editing, archiving and contacting are
// refused to non-members by RLS and by each server action, as before. This
// decides what a non-member can SEE, which RLS cannot do on its own: the
// published listings a signed-in account can read are the same rows the guest
// teaser policy (0010) hands to anyone. See 0033 for the one read that a
// database change could close completely.
//
// COST. A guest pays nothing (no cookie, no network). A signed-in visitor pays
// one auth check and one read of their own accounts row per page view.

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function keepNonMembersOut(): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data: account } = await supabase
    .from("accounts")
    .select("is_member")
    .eq("id", user.id)
    .maybeSingle<{ is_member: boolean }>();

  if (!account?.is_member) redirect("/apply");
}
