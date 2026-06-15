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

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string };

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim() || !password) return;
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
    });

    if (error) {
      const friendly = error.message.toLowerCase().includes("already")
        ? "An account with that email already exists. Try signing in instead."
        : error.message;
      setStatus({ kind: "error", message: friendly });
      return;
    }

    router.push("/listings");
    router.refresh();
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
            Account
          </p>
          <h1 className="font-serif font-light text-3xl md:text-4xl tracking-tight">
            Join the network.
          </h1>
          <span className="block w-8 h-px bg-ink/30 mx-auto mt-8" />
          <p className="font-serif text-lg text-slate leading-relaxed mt-10">
            Manhattanite is a private marketplace for New Yorkers. Create a
            free account to browse the network. To post a listing or contact a
            member, you&apos;ll need to be approved.
          </p>
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
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={status.kind === "submitting"}
              className="w-full bg-transparent border-0 border-b border-ink/30 px-0 py-2 text-ink placeholder-slate/60 focus:border-ink focus:outline-none transition-colors disabled:opacity-50"
              placeholder="At least 8 characters"
            />
          </div>

          {status.kind === "error" && (
            <p className="text-sm text-red-700">{status.message}</p>
          )}

          <button
            type="submit"
            disabled={
              status.kind === "submitting" || !email.trim() || !password
            }
            className="w-full mh-link text-[14px] tracking-[0.22em] uppercase text-ink cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-left"
          >
            {status.kind === "submitting"
              ? "Creating account…"
              : "Create an account"}
          </button>
        </form>

        <p className="mt-16 text-sm text-slate text-center leading-relaxed">
          Already have an account?{" "}
          <Link href="/login" className="mh-link text-ink">
            Sign in
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
