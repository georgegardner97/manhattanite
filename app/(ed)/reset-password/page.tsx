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

// Visual (design foundation, Slice 2): the dark threshold, via AuthShell.

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AuthShell from "@/app/components/AuthShell";
import BoxButton from "@/app/components/BoxButton";

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
      <main className="mh-dark min-h-screen flex items-center justify-center px-6">
        <p className="font-serif text-lg text-bone/60">One moment…</p>
      </main>
    );
  }

  return (
    <AuthShell kicker="Reset password" headline="Set a new one.">
      <form onSubmit={onSubmit} className="space-y-[22px]">
        <div>
          <label
            htmlFor="password"
            className="mh-label block text-bone/60 mb-2.5"
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
            className="mh-input"
            placeholder="At least 8 characters"
          />
        </div>

        {status.kind === "error" && (
          <p className="text-sm text-red-300">{status.message}</p>
        )}

        <BoxButton
          type="submit"
          surface="dark"
          className="w-full text-center"
          disabled={status.kind === "submitting" || !password}
        >
          {status.kind === "submitting" ? "Saving…" : "Save new password"}
        </BoxButton>
      </form>
    </AuthShell>
  );
}
