"use client";

// JoinForm — the invited person sets a password to create their account, then
// the invite is claimed (accept_invite) so they're linked to their inviter as
// sponsor. Email is fixed to the invited address (read-only). Email
// confirmation is off in Supabase Auth, so signUp returns a session
// immediately and the rpc that follows runs authenticated. Then on to /apply to
// fill in their details; submit.ts attaches the inviter as the sponsor.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string };

export default function JoinForm({
  token,
  email,
}: {
  token: string;
  email: string;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

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
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      const friendly = signUpError.message.toLowerCase().includes("already")
        ? "You already have an account with that email. Sign in, then open this invitation again to accept it."
        : signUpError.message;
      setStatus({ kind: "error", message: friendly });
      return;
    }

    // Claim the invite — links this new account as the invitee so the inviter
    // becomes their sponsor on approval. If it fails, the account still exists,
    // so send them on to apply rather than trapping them.
    const { error: acceptError } = await supabase.rpc("accept_invite", {
      p_token: token,
    });
    if (acceptError) {
      console.error("accept_invite failed:", acceptError);
    }

    router.push("/apply");
    router.refresh();
  }

  return (
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
          type="email"
          value={email}
          readOnly
          className="w-full bg-transparent border-0 border-b border-ink/20 px-0 py-2 text-slate cursor-not-allowed"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-[11px] tracking-[0.22em] uppercase text-slate mb-3"
        >
          Choose a password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          autoFocus
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={status.kind === "submitting"}
          placeholder="At least 8 characters"
          className="w-full bg-transparent border-0 border-b border-ink/30 px-0 py-2 text-ink placeholder-slate/60 focus:border-ink focus:outline-none transition-colors disabled:opacity-50"
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
        {status.kind === "submitting" ? "Claiming your spot…" : "Claim your spot"}
      </button>
    </form>
  );
}
