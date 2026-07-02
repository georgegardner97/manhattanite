// /login — email + password sign-in.
//
// Client Component: calls supabase.auth.signInWithPassword from the browser,
// then router.push to /profile on success. Middleware refreshes the session
// cookie on each subsequent request.
//
// Copy mechanics are pulled from COMPANY/voice-and-copy.md. American
// spelling throughout (Manhattanite is a New York brand).

"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Turnstile, { type TurnstileHandle } from "@/app/components/Turnstile";

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
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-20">
      <div className="w-full max-w-md">
        {/* Wordmark — links back to home. Matches the landing page. */}
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
            Sign in
          </p>
          <h1 className="font-serif font-light text-3xl md:text-4xl tracking-tight">
            Welcome back.
          </h1>
          <span className="block w-8 h-px bg-ink/30 mx-auto mt-8" />
        </div>

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

          <div>
            <label
              htmlFor="password"
              className="block text-[11px] tracking-[0.22em] uppercase text-slate mb-3"
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
              className="w-full bg-transparent border-0 border-b border-ink/30 px-0 py-2 text-ink placeholder-slate/60 focus:border-ink focus:outline-none transition-colors disabled:opacity-50"
              placeholder="••••••••"
            />
          </div>

          {/* Turnstile — proves a human, not a bot, before we let sign-in run. */}
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
              status.kind === "submitting" ||
              !email.trim() ||
              !password ||
              !captchaToken
            }
            className="w-full mh-link text-[14px] tracking-[0.22em] uppercase text-ink cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-left"
          >
            {status.kind === "submitting" ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {/* Forgot password? → /reset-request (the forgot-password flow). */}
        <div className="mt-10 text-center">
          <Link
            href="/reset-request"
            className="mh-link text-sm text-slate hover:text-ink"
          >
            Forgot password?
          </Link>
        </div>

        <p className="mt-16 text-sm text-slate text-center leading-relaxed">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="mh-link text-ink">
            Create an account
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
