"use client";

// The landing's sign-in — a real one, opening in place.
//
// Collapsed it is a single filled pill, the page's primary action. Pressed, the
// form grows out of the same spot: no navigation, no modal, the hero simply
// reflows around it. Pressed again (or Escape) it closes.
//
// THIS IS WIRED, NOT DRAWN, AND IT HAD TO BE. A sign-in form is the one screen
// that cannot be mocked up — people type real passwords into anything shaped
// like this, and a form that swallows a password and does nothing is worse than
// no form. So it calls the same supabase.auth.signInWithPassword the live
// /login calls, behind the same Cloudflare Turnstile challenge, and rewrites
// Supabase's errors with the same wording. If it looks like a sign-in form, it
// signs you in.
//
// TURNSTILE IS NOT OPTIONAL. Sign-in against prod is captcha-gated at the
// Supabase project level: signInWithPassword without a token is rejected before
// the password is ever checked. The widget is rendered as soon as the form
// opens so the token is usually ready by the time someone finishes typing, and
// it is reset after every failure because the token is single-use.
//
// FORGOT PASSWORD IS EARNED, NOT DISPLAYED. It appears only after credentials
// have actually been rejected — which is the moment the question "did I get my
// password wrong?" occurs to anyone, and before that it is a fourth thing to
// read on a page whose whole argument is that there are only two.
//
//   Deliberately NOT shown on a captcha failure. "Couldn't verify you're human"
//   has nothing to do with the password, and offering a reset link there sends
//   people to change a password that was never wrong.

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { classifyAuthError } from "@/app/design/auth-error";
import Turnstile, { type TurnstileHandle } from "@/app/components/Turnstile";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  /** `credentials` drives the forgot-password reveal; `other` does not. */
  | { kind: "error"; message: string; reason: "credentials" | "other" };

/**
 * "reveal"  — the landing: a pill that opens the form in place (the default).
 * "inline"  — screen 09: the form is the card's content and is always open, so
 *             there is no toggle and no collapsing wrapper.
 */
export type ClSignInVariant = "reveal" | "inline";

export default function ClSignIn({
  variant = "reveal",
}: {
  variant?: ClSignInVariant;
}) {
  const router = useRouter();
  const inline = variant === "inline";
  // Inline starts open and never closes; the reveal starts closed.
  const [open, setOpen] = useState(inline);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [captchaToken, setCaptchaToken] = useState("");
  const turnstileRef = useRef<TurnstileHandle>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const close = useCallback(() => {
    // The inline form has nowhere to close to — Escape should not blank the
    // one thing on the card.
    if (inline) return;
    setOpen(false);
    // The password does not survive a close. Leaving it in state means it sits
    // in memory — and in React DevTools — for the rest of the session on a page
    // someone may well walk away from.
    setPassword("");
    setStatus({ kind: "idle" });
  }, [inline]);

  // Focus the first field once the panel is open. Deferred a frame: focusing an
  // element inside a collapsed grid row scrolls the page to it mid-animation.
  useEffect(() => {
    if (!open || inline) return;
    const id = requestAnimationFrame(() => emailRef.current?.focus());
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(id);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, inline, close]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim() || !password || !captchaToken) return;

    setStatus({ kind: "submitting" });

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
      options: { captchaToken },
    });

    if (error) {
      // The token is spent either way — fresh challenge before any retry.
      turnstileRef.current?.reset();
      setCaptchaToken("");

      const { message, reason } = classifyAuthError(error.message);
      setStatus({ kind: "error", message, reason });
      return;
    }

    // Into the Classifieds browse, so signing in from this page keeps you in
    // the system you signed in from. The live /login sends people to /listings;
    // promoting this landing means changing this one line to match.
    router.push("/design/browse");
    router.refresh();
  }

  const submitting = status.kind === "submitting";
  const showReset = status.kind === "error" && status.reason === "credentials";

  return (
    <div className="w-full">
      {/* The pill stays put and becomes the panel's toggle, so the control
          never moves out from under the pointer that just pressed it. */}
      {!inline && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => (open ? close() : setOpen(true))}
            aria-expanded={open}
            aria-controls="cl-signin-panel"
            className="cl-pill"
            style={{ padding: "13px 24px" }}
          >
            Sign in
          </button>
        </div>
      )}

      <div
        id="cl-signin-panel"
        className={inline ? "" : `cl-reveal${open ? " cl-reveal-open" : ""}`}
        // Collapsed content stays in the DOM so the height can animate, so it
        // must be hidden from assistive tech and taken out of the tab order.
        // `inert` does both in one attribute.
        inert={inline ? undefined : !open || undefined}
      >
        <div>
          <form
            onSubmit={onSubmit}
            className={`w-full text-left${inline ? "" : " mx-auto mt-7 max-w-[340px]"}`}
          >
            <div>
              <label htmlFor="cl-email" className="cl-fieldlabel">
                Email
              </label>
              <input
                ref={emailRef}
                id="cl-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                className="cl-input"
                placeholder="you@example.com"
              />
            </div>

            <div className="mt-3.5">
              <label htmlFor="cl-password" className="cl-fieldlabel">
                Password
              </label>
              <input
                id="cl-password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                className="cl-input"
                placeholder="••••••••"
              />
            </div>

            {/* Cloudflare renders its own chrome inside an iframe that CSS
                cannot reach; `theme` is the only lever, and this page is
                light. */}
            <div className="mt-3.5">
              <Turnstile
                ref={turnstileRef}
                theme="light"
                onVerify={setCaptchaToken}
                onExpire={() => setCaptchaToken("")}
                onError={() => setCaptchaToken("")}
              />
            </div>

            {status.kind === "error" && (
              // aria-live so the message is announced when it replaces nothing
              // — a screen reader has no other way to know the submit failed.
              <p className="cl-fielderror mt-3" role="alert">
                {status.message}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || !email.trim() || !password || !captchaToken}
              className={
                submitting || !email.trim() || !password || !captchaToken
                  ? "cl-pill-disabled mt-4 w-full"
                  : "cl-pill mt-4 w-full"
              }
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>

            {/* Earned, not displayed. See the note at the top. */}
            {showReset && (
              <div className="mt-3.5 text-center">
                <Link
                  href="/reset-request"
                  className="cl-quiet text-[13px] underline underline-offset-4"
                >
                  Forgot your password?
                </Link>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
