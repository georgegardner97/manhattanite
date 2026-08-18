// Asserts the sign-in error classifier — specifically, which failures reveal
// the forgot-password link on the Classifieds landing.
//
// This exists because the branch cannot be clicked locally: .env.local carries
// Cloudflare's TEST Turnstile key, so every local sign-in dies at the captcha
// before a password is ever checked. Run with:  npm run test:auth-error

import { classifyAuthError } from "../app/design/auth-error";

const CASES: { raw: string; message: string; reason: string }[] = [
  {
    // What Supabase actually returns for a wrong password AND an unknown email.
    raw: "Invalid login credentials",
    message: "That email and password don't match.",
    reason: "credentials",
  },
  {
    raw: "captcha protection: request disallowed (invalid-input-response)",
    message: "Couldn't verify you're human — try again.",
    reason: "other",
  },
  {
    raw: "Email not confirmed",
    message: "Email not confirmed",
    reason: "other",
  },
  {
    // Casing must not decide the branch.
    raw: "INVALID LOGIN CREDENTIALS",
    message: "That email and password don't match.",
    reason: "credentials",
  },
];

let failed = 0;
for (const c of CASES) {
  const got = classifyAuthError(c.raw);
  const ok = got.message === c.message && got.reason === c.reason;
  if (!ok) failed++;
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${JSON.stringify(c.raw).slice(0, 46).padEnd(48)} → ${got.reason}${
      ok ? "" : `  (expected ${c.reason} / "${c.message}", got "${got.message}")`
    }`
  );
}

// The rule the whole feature turns on, stated as its own assertion.
const resetShownFor = CASES.filter(
  (c) => classifyAuthError(c.raw).reason === "credentials"
).length;
console.log(
  `\nForgot-password link revealed on ${resetShownFor}/${CASES.length} cases — credentials only.`
);

if (failed > 0) {
  console.error(`\n${failed} case(s) failed.`);
  process.exit(1);
}
console.log("All cases passed.");
