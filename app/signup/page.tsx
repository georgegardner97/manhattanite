// /signup — email + password sign-up.
//
// Client Component: calls supabase.auth.signUp from the browser. Email
// confirmation is OFF in Supabase Auth settings, so signUp returns a session
// immediately and we router.push to /profile.
//
// The auth trigger in migration 0001 creates the matching public.accounts
// row on the auth.users insert, so /profile can read it on first arrival.
//
// Copy framing pulled from COMPANY/voice-and-copy.md (public-facing gating
// page). American spelling throughout. CTA is "Create an account" — never
// "Sign up" or "Register" — even though the route is /signup.
//
// Visual (design foundation, Slice 2): the dark threshold, via AuthShell.
//
// ?email= prefill: the landing page's membership block submits a plain GET to
// this route, so an address typed out there arrives here in the query string.
// Reading it back is what makes that form feel like the first step of one
// action rather than a field that threw the answer away. It is read from
// window.location in an effect rather than via useSearchParams — the latter
// forces this whole page into a Suspense boundary at build time, and an effect
// avoids a hydration mismatch (the server has no query string to render).
// Prefill only: the value is still typed into a normal, editable field and
// still has to pass Turnstile and Supabase. No new capability.

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Turnstile, { type TurnstileHandle } from "@/app/components/Turnstile";
import AuthShell, { AuthLink } from "@/app/components/AuthShell";
import BoxButton from "@/app/components/BoxButton";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string };

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  // The single-use Turnstile token. Held until signUp; the button stays gated
  // until a token is present, and we reset the widget after any failed signUp.
  const [captchaToken, setCaptchaToken] = useState("");
  const turnstileRef = useRef<TurnstileHandle>(null);

  // Prefill from ?email=, if the visitor came through the landing's membership
  // block. Runs once, after mount, and never overwrites anything the visitor
  // has already typed.
  useEffect(() => {
    const fromQuery = new URLSearchParams(window.location.search).get("email");
    if (fromQuery) setEmail((current) => current || fromQuery.trim());
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim() || !password || !captchaToken) return;
    if (password.length < 8) {
      setStatus({
        kind: "error",
        message: "Use at least 8 characters for your password.",
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
      // The token is now spent — reset the widget and clear it so the user can
      // get a fresh challenge and retry.
      turnstileRef.current?.reset();
      setCaptchaToken("");

      const lower = error.message.toLowerCase();
      let friendly = error.message;
      if (lower.includes("already")) {
        friendly =
          "An account with that email already exists. Try signing in instead.";
      } else if (lower.includes("captcha")) {
        friendly = "Couldn't verify you're human — please try again.";
      }
      setStatus({ kind: "error", message: friendly });
      return;
    }

    router.push("/listings");
    router.refresh();
  }

  return (
    <AuthShell
      kicker="Account"
      headline="Join the network."
      sub="Manhattanite is a private marketplace for New Yorkers. Create an account to browse the network. To post a listing or contact a member, you'll need to be approved."
      footer={<AuthLink href="/login">Already a member? Sign in</AuthLink>}
    >
      <form onSubmit={onSubmit} className="space-y-[22px]">
        <div>
          <label htmlFor="email" className="mh-label block text-bone/60 mb-2.5">
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

        <div>
          <label
            htmlFor="password"
            className="mh-label block text-bone/60 mb-2.5"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={status.kind === "submitting"}
            className="mh-input"
            placeholder="At least 8 characters"
          />
        </div>

        {/* Turnstile — proves a human, not a bot, before we let signup run. */}
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
            status.kind === "submitting" ||
            !email.trim() ||
            !password ||
            !captchaToken
          }
        >
          {status.kind === "submitting"
            ? "Creating account…"
            : "Create an account"}
        </BoxButton>
      </form>
    </AuthShell>
  );
}
