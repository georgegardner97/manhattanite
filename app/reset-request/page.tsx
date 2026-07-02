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

"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Turnstile, { type TurnstileHandle } from "@/app/components/Turnstile";

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

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-20">
      <div className="w-full max-w-md">
        {/* Wordmark — links back to home. */}
        <div className="text-center mb-16">
          <Link
            href="/"
            className="font-serif font-extralight text-5xl md:text-6xl tracking-tighter leading-none text-ink"
          >
            Manhattan<span className="italic">ite</span>
          </Link>
        </div>

        <div className="text-center mb-12">
          <p className="text-[14px] tracking-[0.22em] uppercase text-slate mb-5">
            Reset password
          </p>
          <h1 className="font-serif font-light text-3xl md:text-4xl tracking-tight">
            {status.kind === "sent" ? "Check your inbox." : "Forgotten it?"}
          </h1>
          <span className="block w-8 h-px bg-ink/30 mx-auto mt-8" />
        </div>

        {status.kind === "sent" ? (
          <div className="text-center">
            <p className="font-serif text-lg text-slate leading-relaxed">
              If there&apos;s an account with that email, we&apos;ve sent a link
              to set a new password. It&apos;s good for one use.
            </p>
            <p className="mt-12 text-sm text-slate">
              <Link href="/login" className="mh-link text-ink">
                Back to sign in
              </Link>
            </p>
          </div>
        ) : (
          <>
            <p className="font-serif text-lg text-slate leading-relaxed text-center mb-12">
              Enter your email and we&apos;ll send you a link to set a new one.
            </p>

            <form onSubmit={onSubmit} className="space-y-8">
              <div>
                <label
                  htmlFor="email"
                  className="block text-[11px] tracking-[0.22em] uppercase text-slate mb-3"
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
                  className="w-full bg-transparent border-0 border-b border-ink/30 px-0 py-2 text-ink placeholder-slate/60 focus:border-ink focus:outline-none transition-colors disabled:opacity-50"
                  placeholder="you@example.com"
                />
              </div>

              {/* Turnstile — proves a human, not a bot, before we send a link. */}
              <Turnstile
                ref={turnstileRef}
                onVerify={setCaptchaToken}
                onExpire={() => setCaptchaToken("")}
                onError={() => setCaptchaToken("")}
              />

              {status.kind === "error" && (
                <p className="text-sm text-red-700">{status.message}</p>
              )}

              <button
                type="submit"
                disabled={
                  status.kind === "submitting" || !email.trim() || !captchaToken
                }
                className="w-full mh-link text-[14px] tracking-[0.22em] uppercase text-ink cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-left"
              >
                {status.kind === "submitting" ? "Sending…" : "Send the link"}
              </button>
            </form>

            <p className="mt-16 text-sm text-slate text-center leading-relaxed">
              Remembered it?{" "}
              <Link href="/login" className="mh-link text-ink">
                Sign in
              </Link>
              .
            </p>
          </>
        )}
      </div>
    </main>
  );
}
