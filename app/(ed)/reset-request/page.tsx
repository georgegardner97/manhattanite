// /reset-request — start the forgot-password flow.
//
// Client Component: collects an email and calls
// supabase.auth.resetPasswordForEmail. Supabase sends a recovery link that
// returns the user to /auth/callback (which exchanges the code for a session),
// then on to /reset-password where they set a new password.
//
// redirectTo uses window.location.origin so the recovery link points back at
// whatever host the request came from — localhost in dev, manhattanite.com in
// prod — without a separate env var. Both origins must be in Supabase Auth's
// redirect-URL allowlist.
//
// The success message is intentionally generic: it never reveals whether the
// email is actually registered. Copy follows COMPANY/voice-and-copy.md, in
// American spelling.

// Visual (design foundation, Slice 2): the dark threshold, via AuthShell.

"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Turnstile, { type TurnstileHandle } from "@/app/components/Turnstile";
import AuthShell, { AuthLink } from "@/app/components/AuthShell";
import BoxButton from "@/app/components/BoxButton";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "sent" }
  | { kind: "error"; message: string };

export default function ResetRequestPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  // The single-use Turnstile token. Held until resetPasswordForEmail; the
  // button stays gated until a token is present, and we reset the widget after
  // any failed request so a retry gets a fresh token.
  const [captchaToken, setCaptchaToken] = useState("");
  const turnstileRef = useRef<TurnstileHandle>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim() || !captchaToken) return;

    setStatus({ kind: "submitting" });

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      captchaToken,
    });

    // Show the same generic confirmation whether or not the email exists, so
    // the page can't be used to probe who's in the network. Genuine transport
    // errors (rate limit, network) still surface.
    if (error) {
      // The token is now spent — reset the widget and clear it so the user can
      // get a fresh challenge and retry.
      turnstileRef.current?.reset();
      setCaptchaToken("");

      const friendly = error.message.toLowerCase().includes("captcha")
        ? "Couldn't verify you're human — please try again."
        : error.message;
      setStatus({ kind: "error", message: friendly });
      return;
    }

    setStatus({ kind: "sent" });
  }

  const sent = status.kind === "sent";

  return (
    <AuthShell
      kicker="Reset password"
      headline={sent ? "Check your inbox." : "Forgotten it?"}
      sub={
        sent
          ? "If there's an account with that email, we've sent a link to set a new password. It's good for one use."
          : "Enter your email and we'll send you a link to set a new one."
      }
      footer={
        <AuthLink href="/login">
          {sent ? "Back to sign in" : "Remembered it? Sign in"}
        </AuthLink>
      }
    >
      {/* On success the form is gone entirely — the sub-line above carries the
          whole message, and the only move left is back to sign in. */}
      {!sent && (
        <form onSubmit={onSubmit} className="space-y-[22px]">
          <div>
            <label
              htmlFor="email"
              className="mh-label block text-bone/60 mb-2.5"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status.kind === "submitting"}
              className="mh-input"
              placeholder="you@example.com"
            />
          </div>

          {/* Turnstile — proves a human, not a bot, before we send a link. */}
          <div className="pt-1">
            <Turnstile
              ref={turnstileRef}
              theme="dark"
              onVerify={setCaptchaToken}
              onExpire={() => setCaptchaToken("")}
              onError={() => setCaptchaToken("")}
            />
          </div>

          {status.kind === "error" && (
            <p className="text-sm text-red-300">{status.message}</p>
          )}

          <BoxButton
            type="submit"
            surface="dark"
            className="w-full text-center"
            disabled={
              status.kind === "submitting" || !email.trim() || !captchaToken
            }
          >
            {status.kind === "submitting" ? "Sending…" : "Send the link"}
          </BoxButton>
        </form>
      )}
    </AuthShell>
  );
}
