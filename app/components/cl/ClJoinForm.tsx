"use client";

// Claim your spot — the invited person's sign-up, in the Classifieds system.
//
// Creates the account at the invited address, then claims the invite
// (accept_invite) so the inviter becomes their sponsor, then hands them to
// /apply to finish. Email confirmation is off in Supabase Auth, so signUp
// returns a session immediately and the rpc that follows runs authenticated.
//
// A BUG FIXED ON THE WAY ACROSS: THIS FORM HAD NO CAPTCHA. Sign-up is gated at
// the Supabase project level — signUp without a Turnstile token is rejected
// before an account is ever created, which is why ClSignUp and ClSignIn both
// render the widget. The editorial JoinForm never did, so every invitee who
// reached this screen would have been told their sign-up failed, with no way to
// pass. It has had no in-product entry point, so nobody has hit it; that is
// luck, not design. The widget is here now, wired exactly as it is everywhere
// else: rendered with the form so the token is usually ready before the person
// finishes typing, and reset after any failure because the token is single-use.
//
// IF THE CLAIM FAILS AFTER THE ACCOUNT IS MADE, they still go on to /apply. The
// account exists at that point, so trapping them on this screen would leave a
// real person with a real account and no way forward; they lose the automatic
// sponsor link, which the application form can still collect by name.

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Turnstile, { type TurnstileHandle } from "@/app/components/Turnstile";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string };

const MIN_PASSWORD = 8;

export default function ClJoinForm({
  token,
  email,
}: {
  token: string;
  email: string;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [captchaToken, setCaptchaToken] = useState("");
  const turnstileRef = useRef<TurnstileHandle>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!password || !captchaToken) return;
    if (password.length < MIN_PASSWORD) {
      setStatus({
        kind: "error",
        message: `Use at least ${MIN_PASSWORD} characters for your password.`,
      });
      return;
    }

    setStatus({ kind: "submitting" });

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { captchaToken },
    });

    if (signUpError) {
      // The token is spent either way — fresh challenge before any retry.
      turnstileRef.current?.reset();
      setCaptchaToken("");

      const lower = signUpError.message.toLowerCase();
      let friendly = signUpError.message;
      if (lower.includes("already")) {
        friendly =
          "You already have an account with that email. Sign in, then open this invitation again to accept it.";
      } else if (lower.includes("captcha")) {
        friendly = "Couldn’t verify you’re human — please try again.";
      }
      setStatus({ kind: "error", message: friendly });
      return;
    }

    const { error: acceptError } = await supabase.rpc("accept_invite", {
      p_token: token,
    });
    if (acceptError) {
      console.error("accept_invite failed:", acceptError);
    }

    router.push("/apply");
    router.refresh();
  }

  const submitting = status.kind === "submitting";
  const blocked = submitting || !password || !captchaToken;

  return (
    <form onSubmit={onSubmit}>
      <div>
        <label htmlFor="cl-join-email" className="cl-fieldlabel">
          Email
        </label>
        {/* Read-only: the invitation is to this address, and changing it here
            would silently sign someone up outside the invite. */}
        <input
          id="cl-join-email"
          type="email"
          value={email}
          readOnly
          className="cl-input"
          style={{ color: "var(--cl-muted)" }}
        />
      </div>

      <div className="mt-3.5">
        <label htmlFor="cl-join-password" className="cl-fieldlabel">
          Choose a password{" "}
          <span style={{ color: "var(--cl-faint)" }}>
            {MIN_PASSWORD} characters or more
          </span>
        </label>
        <input
          id="cl-join-password"
          type="password"
          required
          minLength={MIN_PASSWORD}
          autoFocus
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={submitting}
          className="cl-input"
          placeholder="••••••••"
        />
      </div>

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
        <p className="cl-fielderror mt-3" role="alert">
          {status.message}
        </p>
      )}

      <button
        type="submit"
        disabled={blocked}
        className={blocked ? "cl-pill-disabled mt-4 w-full" : "cl-pill mt-4 w-full"}
      >
        {submitting ? "Claiming your spot…" : "Claim your spot"}
      </button>
    </form>
  );
}
