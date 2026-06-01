// /reset-password — finish the forgot-password flow.
//
// The user arrives here after clicking the recovery link in their email:
// /auth/callback exchanged the code for a session, then redirected here. So a
// valid visit always has an active (recovery) session. We verify that on mount
// — if there's no session (someone navigated here directly), we send them back
// to /reset-request rather than show a form that can't work.
//
// On submit we call supabase.auth.updateUser({ password }), which sets the new
// password on the now-authenticated user, then send them to /login to sign in
// fresh. Same 8-character minimum as signup. American spelling throughout.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Status =
  | { kind: "checking" }
  | { kind: "ready" }
  | { kind: "submitting" }
  | { kind: "error"; message: string };

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "checking" });

  // Gate the page on an active session. The recovery link creates one via
  // /auth/callback; a direct visit has none and gets bounced to the start.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/reset-request");
        return;
      }
      setStatus({ kind: "ready" });
    });
  }, [router]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!password) return;
    if (password.length < 8) {
      setStatus({
        kind: "error",
        message: "Use at least 8 characters for your password.",
      });
      return;
    }

    setStatus({ kind: "submitting" });

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setStatus({ kind: "error", message: error.message });
      return;
    }

    // Password is set. Send them to sign in with it.
    router.push("/login");
    router.refresh();
  }

  if (status.kind === "checking") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 py-20">
        <p className="font-serif text-lg text-slate">One moment…</p>
      </main>
    );
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
            Set a new one.
          </h1>
          <span className="block w-8 h-px bg-ink/30 mx-auto mt-8" />
        </div>

        <form onSubmit={onSubmit} className="space-y-8">
          <div>
            <label
              htmlFor="password"
              className="block text-[11px] tracking-[0.22em] uppercase text-slate mb-3"
            >
              New password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              autoFocus
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
            disabled={status.kind === "submitting" || !password}
            className="w-full mh-link text-[14px] tracking-[0.22em] uppercase text-ink cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-left"
          >
            {status.kind === "submitting" ? "Saving…" : "Save new password"}
          </button>
        </form>
      </div>
    </main>
  );
}
