// /reset-password — finish the forgot-password flow, in the Classifieds system.
//
// Second half of the same journey as /reset-request, so it migrates with it:
// arriving here in the light system and then meeting the dark editorial one, or
// the reverse, would put a seam in the middle of a two-screen flow.
//
// The behavior is the editorial page's, unchanged. A valid visit always has an
// active recovery session — the emailed link goes to /auth/callback, which
// exchanges the code and sends the reader on here — so the page checks for one
// on mount and, finding none, returns to the start rather than showing a form
// that cannot work. Then updateUser({ password }) and on to sign in fresh, with
// the same eight-character floor as signup.

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AppHeader from "@/app/components/cl/AppHeader";
import ClAuthCard from "@/app/components/cl/ClAuthCard";

type Status =
  | { kind: "checking" }
  | { kind: "ready" }
  | { kind: "submitting" }
  | { kind: "error"; message: string };

const MIN_PASSWORD = 8;

export default function ClassifiedsResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "checking" });

  // Gate on an active session. The recovery link creates one via
  // /auth/callback; a direct visit has none and gets sent back to the start.
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
    if (password.length < MIN_PASSWORD) {
      setStatus({
        kind: "error",
        message: `Use at least ${MIN_PASSWORD} characters for your password.`,
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

    // Password is set. Sign in with it.
    router.push("/login");
    router.refresh();
  }

  const submitting = status.kind === "submitting";

  if (status.kind === "checking") {
    return (
      <>
        <AppHeader active="none" />
        <ClAuthCard title="One moment…" note="Checking your link." />
      </>
    );
  }

  return (
    <>
      <AppHeader active="none" />

      <ClAuthCard
        title="Set a new one."
        note="Then sign in with it — you’ll only have to do this once."
      >
        <form onSubmit={onSubmit}>
          <div>
            <label htmlFor="cl-new-password" className="cl-fieldlabel">
              New password{" "}
              <span style={{ color: "var(--cl-faint)" }}>
                {MIN_PASSWORD} characters or more
              </span>
            </label>
            <input
              id="cl-new-password"
              name="password"
              type="password"
              required
              minLength={MIN_PASSWORD}
              autoComplete="new-password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              className="cl-input"
              placeholder="••••••••"
            />
          </div>

          {status.kind === "error" && (
            <p className="cl-fielderror mt-3" role="alert">
              {status.message}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !password}
            className={
              submitting || !password
                ? "cl-pill-disabled mt-4 w-full"
                : "cl-pill mt-4 w-full"
            }
          >
            {submitting ? "Saving…" : "Save new password"}
          </button>
        </form>
      </ClAuthCard>
    </>
  );
}
