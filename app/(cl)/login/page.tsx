// /login — sign in. Screen 09, sign-in pane.
//
// Promoted from the preview 2026-08-26. The URL is unchanged; what changed is
// that ClGate's "Sign in" now lands inside the design system instead of dropping
// onto the editorial threshold mid-journey.

import type { Metadata } from "next";
import ClAccess from "@/app/components/cl/ClAccess";

export const dynamic = "force-dynamic"; // session state varies per request.

export const metadata: Metadata = {
  title: "Sign in · Manhattanite",
};

export default function LoginPage() {
  return <ClAccess pane="signin" />;
}
