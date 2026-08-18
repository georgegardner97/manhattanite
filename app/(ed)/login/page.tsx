// /login — email + password sign-in.
//
// Client Component: calls supabase.auth.signInWithPassword from the browser,
// then router.push to /profile on success. Middleware refreshes the session
// cookie on each subsequent request.
//
// Copy mechanics are pulled from COMPANY/voice-and-copy.md. American
// spelling throughout (Manhattanite is a New York brand).
//
// Visual (design foundation, Slice 2): the dark threshold — park ground, bone
// type, AuthShell's centered column. Signing in is the crossing from outside to
// inside; the redirect into the light product surface IS the transition, which
// is why there isn't one here.

"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Turnstile, { type TurnstileHandle } from "@/app/components/Turnstile";
import AuthShell, { AuthLink, AuthSep } from "@/app/components/AuthShell";
import BoxButton from "@/app/components/BoxButton";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string };

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  // The single-use Turnstile token. Held until signInWithPassword; the button
  // stays gated until a token is present, and we reset the widget after any
  // failed sign-in so a retry gets a fresh token.
  const [captchaToken, setCaptchaToken] = useState("");
  const turnstileRef = useRef<TurnstileHandle>(null);

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
      // The token is now spent — reset the widget and clear it so the user can
      // get a fresh challenge and retry.
      turnstileRef.current?.reset();
      setCaptchaToken("");

      // Supabase returns "Invalid login credentials" for both wrong-password
      // and unknown-email. Rewriting so it doesn't leak account existence
      // and reads like Manhattanite, not like Supabase.
      const lower = error.message.toLowerCase();
      let friendly = error.message;
      if (lower.includes("invalid login")) {
        friendly =
          "That email and password don't match. Try again, or reset your password below.";
      } else if (lower.includes("captcha")) {
        friendly = "Couldn't verify you're human — please try again.";
      }
      setStatus({ kind: "error", message: friendly });
      return;
    }

    // Land signed-in users on the network (the listings are the value), not
    // their profile. Hard refresh so the Server Components see the fresh
    // session cookie on first render.
    router.push("/listings");
    router.refresh();
  }

  return (
    <AuthShell
      kicker="Sign in"
      headline="Welcome back."
      footer={
        <>
          {/* → /reset-request, the forgot-password flow. */}
          <AuthLink href="/reset-request">Forgotten it?</AuthLink>
          <AuthSep />
          <AuthLink href="/signup">No account? Create one</AuthLink>
        </>
      }
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
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={status.kind === "submitting"}
            className="mh-input"
            placeholder="••••••••"
          />
        </div>

        {/* Turnstile — proves a human, not a bot, before we let sign-in run.
            Cloudflare renders its own chrome inside an iframe we can't style,
            so `theme` is the only lever; the integration is untouched. */}
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
          {status.kind === "submitting" ? "Signing in…" : "Sign in"}
        </BoxButton>
      </form>
    </AuthShell>
  );
}
