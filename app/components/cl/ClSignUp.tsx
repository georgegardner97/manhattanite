"use client";

// Create an account, in the Classifieds system — the right-hand card on
// /signup.
//
// A restyle of the editorial /signup, not a reimplementation: the same
// supabase.auth.signUp behind the same Cloudflare Turnstile challenge, the same
// eight-character floor, the same error rewriting. Only the chrome is new.
//
// TURNSTILE IS NOT OPTIONAL. Sign-up against prod is captcha-gated at the
// Supabase project level: signUp without a token is rejected before an account
// is ever created. The widget renders with the form so the token is usually
// ready by the time someone finishes typing, and it is reset after every
// failure because the token is single-use.
//
// ?email= PREFILL, carried over from the editorial page: the landing's
// membership block submits a plain GET here, so an address typed out there
// arrives in the query string. Read from window.location in an effect rather
// than useSearchParams — the latter forces the whole route into a Suspense
// boundary at build time, and an effect avoids a hydration mismatch (the server
// has no query string to render). Prefill only: the value is still typed into a
// normal editable field and still has to pass Turnstile and Supabase.
//
// WHERE IT LANDS. The editorial page pushed to /profile. This one pushes to
// /apply, because the card beside it numbers the path — create an account, tell
// us who you are, a person reads it — and dropping someone on their account
// settings after step 1 contradicts the screen that just promised step 2. No
// gate moves: /apply is Tier-1-reachable by design and the membership wall is
// still the approval at the end of it.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Turnstile, { type TurnstileHandle } from "@/app/components/Turnstile";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string };

const MIN_PASSWORD = 8;

export default function ClSignUp() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [captchaToken, setCaptchaToken] = useState("");
  const turnstileRef = useRef<TurnstileHandle>(null);

  // Runs once, after mount, and never overwrites anything already typed.
  useEffect(() => {
    const fromQuery = new URLSearchParams(window.location.search).get("email");
    if (fromQuery) setEmail((current) => current || fromQuery.trim());
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim() || !password || !captchaToken) return;

    if (password.length < MIN_PASSWORD) {
      setStatus({
        kind: "error",
        message: `Use at least ${MIN_PASSWORD} characters for your password.`,
      });
      return;
    }

    setStatus({ kind: "submitting" });

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { captchaToken },
    });

    if (error) {
      // The token is spent either way — fresh challenge before any retry.
      turnstileRef.current?.reset();
      setCaptchaToken("");

      const lower = error.message.toLowerCase();
      let friendly = error.message;
      if (lower.includes("already")) {
        friendly =
          "An account with that email already exists. Try signing in instead.";
      } else if (lower.includes("captcha")) {
        friendly = "Couldn’t verify you’re human — please try again.";
      }
      setStatus({ kind: "error", message: friendly });
      return;
    }

    // Email confirmation is off in Supabase Auth, so signUp returns a session
    // immediately and the 0001 trigger has already created the accounts row.
    router.push("/apply");
    router.refresh();
  }

  const submitting = status.kind === "submitting";
  const blocked = submitting || !email.trim() || !password || !captchaToken;

  return (
    <form onSubmit={onSubmit} className="w-full text-left">
      <div>
        <label htmlFor="cl-signup-email" className="cl-fieldlabel">
          Email
        </label>
        <input
          id="cl-signup-email"
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
        <label htmlFor="cl-signup-password" className="cl-fieldlabel">
          Password{" "}
          <span style={{ color: "var(--cl-faint)" }}>
            {MIN_PASSWORD} characters or more
          </span>
        </label>
        <input
          id="cl-signup-password"
          name="password"
          type="password"
          required
          minLength={MIN_PASSWORD}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={submitting}
          className="cl-input"
          placeholder="••••••••"
        />
      </div>

      {/* Cloudflare renders its own chrome inside an iframe that CSS cannot
          reach; `theme` is the only lever, and this card is light. */}
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
        // aria-live so the message is announced when it replaces nothing — a
        // screen reader has no other way to know the submit failed.
        <p className="cl-fielderror mt-3" role="alert">
          {status.message}
        </p>
      )}

      <button
        type="submit"
        disabled={blocked}
        className={blocked ? "cl-pill-disabled mt-4 w-full" : "cl-pill mt-4 w-full"}
      >
        {submitting ? "Creating…" : "Create an account"}
      </button>
    </form>
  );
}
