// /signup — kept as a redirect, not deleted.
//
// THE SELF-SERVE DOOR IS CLOSED (George, 2026-09-04). The tiers are scrapped:
// you are a member brought in by someone else, or you are not. There is no
// longer an account a stranger can create for themselves, so this route no
// longer renders a form. The only account-creating path in the product is
// ClJoinForm on /join/[token], which calls supabase.auth.signUp directly and
// does not touch this route — closing this door does not touch the invite
// chain.
//
// IT REDIRECTS RATHER THAN 404s, because the address is in the wild: the
// waitlist-era emails, the design system's own links, bookmarks, and anything
// sent before today. Those people should land on the screen that explains the
// new shape rather than on an error. /apply is that screen — one door, one
// explanation, in this system's furniture.
//
// ClAccess still carries its `pane="signup"` branch. It is unreachable while
// this redirect stands, and it is left in place deliberately so reopening the
// door is one file, not a rebuild.

import { redirect } from "next/navigation";

export default function SignupPage() {
  redirect("/apply");
}
