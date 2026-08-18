// Classifying a failed sign-in.
//
// Pulled out of ClSignIn as a pure function for one practical reason: the
// branch it decides cannot be reached from a local machine. `.env.local` holds
// Cloudflare's always-passes TEST site key, so the browser mints a test token
// that the Supabase project — configured with the real secret — rejects. The
// captcha error therefore fires BEFORE any password is checked, and the
// credentials path (and the forgot-password link that hangs off it) can only be
// exercised where the real site key is set.
//
// A branch that cannot be clicked can still be tested. Hence: pure in, pure
// out, and scripts/test-auth-error.ts asserts every case.

export type AuthErrorReason = "credentials" | "other";

export type ClassifiedAuthError = {
  message: string;
  /**
   * Only "credentials" reveals the forgot-password link. A captcha failure or a
   * network error says nothing about whether the password was right, and
   * offering a reset there sends people to change a password that was fine.
   */
  reason: AuthErrorReason;
};

export function classifyAuthError(raw: string): ClassifiedAuthError {
  const lower = raw.toLowerCase();

  if (lower.includes("invalid login")) {
    // Supabase returns one error for both a wrong password and an unknown
    // email, and that is worth preserving: telling them apart would turn the
    // form into a test for whether an address belongs to a member.
    return {
      message: "That email and password don't match.",
      reason: "credentials",
    };
  }

  if (lower.includes("captcha")) {
    return {
      message: "Couldn't verify you're human — try again.",
      reason: "other",
    };
  }

  return { message: raw, reason: "other" };
}
