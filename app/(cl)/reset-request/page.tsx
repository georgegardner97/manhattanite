// /reset-request — start the forgot-password flow, in the Classifieds system.
//
// THE ONE EDITORIAL SCREEN A NORMAL PERSON COULD STILL REACH FROM INSIDE THE
// NEW SYSTEM, and the reason it goes first in Slice 3a. Two live entry points
// lead here: ClSignIn's "Forgot your password?", which appears the moment
// credentials are rejected, and the Password → Reset row on /profile. Both are
// Classifieds screens, so until now failing to sign in dropped you through the
// floor into the dark editorial threshold, which is exactly the seam Slice 2
// was written to close.
//
// The behavior is the editorial page's, unchanged: resetPasswordForEmail behind
// Turnstile, a deliberately generic confirmation, and redirectTo built from
// window.location.origin so the recovery link comes back to whatever host the
// request came from (localhost in dev, manhattanite.com in prod — both are in
// Supabase Auth's redirect allowlist). Only the chrome is new.
//
// THE CONFIRMATION SAYS THE SAME THING WHETHER OR NOT THE EMAIL EXISTS. That is
// not politeness: this form is otherwise a way to ask "is this person on
// Manhattanite?", which on a network whose whole product is who is in it, is
// the most valuable question an outsider can ask. Genuine transport failures
// (rate limit, network) still surface, because those are about the request, not
// about the person.

"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Turnstile, { type TurnstileHandle } from "@/app/components/Turnstile";
import AppHeader from "@/app/components/cl/AppHeader";
import ClAuthCard from "@/app/components/cl/ClAuthCard";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "sent" }
  | { kind: "error"; message: string };

export default function ClassifiedsResetRequestPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  // The single-use Turnstile token. Held until resetPasswordForEmail; the
  // button stays gated until a token is present, and the widget is reset after
  // any failure so a retry gets a fresh one.
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

    if (error) {
      // The token is spent either way — fresh challenge before any retry.
      turnstileRef.current?.reset();
      setCaptchaToken("");

      const friendly = error.message.toLowerCase().includes("captcha")
        ? "Couldn’t verify you’re human — please try again."
        : error.message;
      setStatus({ kind: "error", message: friendly });
      return;
    }

    setStatus({ kind: "sent" });
  }

  const sent = status.kind === "sent";
  const submitting = status.kind === "submitting";
  const blocked = submitting || !email.trim() || !captchaToken;

  return (
    <>
      <AppHeader active="none" />

      <ClAuthCard
        title={sent ? "Check your inbox." : "Forgotten it?"}
        note={
          sent
            ? "If there’s an account with that email, we’ve sent a link to set a new password. It’s good for one use."
            : "Enter your email and we’ll send you a link to set a new one."
        }
        footer={
          <>
            {sent ? "Nothing arrived? " : "Remembered it? "}
            <Link href="/login" style={{ color: "var(--cl-ink)" }}>
              {sent ? "Try again" : "Sign in"}
            </Link>
          </>
        }
      >
        {/* On success the form is gone entirely — the note above carries the
            whole message, and the only move left is back to sign in. */}
        {!sent && (
          <form onSubmit={onSubmit}>
            <div>
              <label htmlFor="cl-reset-email" className="cl-fieldlabel">
                Email
              </label>
              <input
                id="cl-reset-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                className="cl-input"
                placeholder="you@example.com"
              />
            </div>

            {/* Cloudflare renders its own chrome inside an iframe CSS cannot
                reach; `theme` is the only lever, and this system is light. */}
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
              // aria-live: a screen reader has no other way to know the submit
              // failed, since the message replaces nothing.
              <p className="cl-fielderror mt-3" role="alert">
                {status.message}
              </p>
            )}

            <button
              type="submit"
              disabled={blocked}
              className={
                blocked ? "cl-pill-disabled mt-4 w-full" : "cl-pill mt-4 w-full"
              }
            >
              {submitting ? "Sending…" : "Send the link"}
            </button>
          </form>
        )}
      </ClAuthCard>
    </>
  );
}
