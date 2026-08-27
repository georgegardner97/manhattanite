// /signup — create an account. Screen 09, sign-up pane.
//
// The one route where screen 09 could not be promoted as drawn: the design's
// guest card links to /signup, so rendering the unchanged screen here would
// point that link at the page it is already on. The right-hand card carries the
// real create-account form instead, and the numbered steps beside it stay put.

import type { Metadata } from "next";
import ClAccess from "@/app/components/cl/ClAccess";

export const dynamic = "force-dynamic"; // session state varies per request.

export const metadata: Metadata = {
  title: "Create an account · Manhattanite",
};

export default function SignupPage() {
  return <ClAccess pane="signup" />;
}
