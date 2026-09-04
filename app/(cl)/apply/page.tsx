// /apply — request access. Screen 09, request pane.
//
// The left card is the destination here, and it is the state-aware one: a guest
// reads the three steps and is sent to create an account, a Tier-1 account gets
// the real application form, an applicant gets the confirmation, a member is
// told there is nothing to request.
//
// The editorial /apply redirected a guest to /login and a member to /profile.
// Neither redirect survives, and no gate moved with them: the application INSERT
// policy (0007, "own row + not already a member") is the wall, and it is
// untouched. What changed is that both cases are now answered on the page
// instead of bounced off it.

import type { Metadata } from "next";
import ClAccess from "@/app/components/cl/ClAccess";

export const dynamic = "force-dynamic"; // session state varies per request.

export const metadata: Metadata = {
  title: "Invitation only · Manhattanite",
};

export default function ApplyPage() {
  return <ClAccess pane="signin" />;
}
