// Client form for contacting a lister — Phase 2, the contact slice.
//
// Mirrors ApplicationForm. The member writes a single message; their own name +
// email are shown read-only (so the lister knows who's reaching out — those
// values come from the session inside the action, not from these props, which
// are display-only). On success the action returns { status: "sent" } and we
// swap the form for the confirmation copy.
//
// The "gate" state is defense-in-depth: the /contact page already shows Tier-1
// accounts the interaction gate and never renders this form for them. If a
// membership somehow lapses between page load and submit, the action returns
// "gate" and we render the same gate copy inline.
//
// Style classes match ApplicationForm exactly.

"use client";

import Link from "next/link";
import { useActionState } from "react";
import { sendContact, type ContactState } from "@/lib/listings/contact";

const FIELD_BASE =
  "w-full bg-transparent border-b border-ink/20 pb-3 text-base text-ink placeholder:text-slate/50 focus:border-ink focus:outline-none transition-colors duration-200";
const LABEL = "block text-[13px] tracking-[0.22em] uppercase text-slate mb-5";

const INITIAL: ContactState = { status: "idle" };

type ContactFormProps = {
  listingId: string;
  listerName: string;
  senderName: string | null;
  senderEmail: string;
};

export default function ContactForm({
  listingId,
  listerName,
  senderName,
  senderEmail,
}: ContactFormProps) {
  const [state, formAction, isPending] = useActionState(sendContact, INITIAL);

  // ---------- Confirmation state ----------
  if (state.status === "sent") {
    return (
      <div className="max-w-md mx-auto text-center space-y-6">
        <p className="font-serif text-2xl text-ink">Your message is on its way.</p>
        <p className="font-serif text-lg leading-relaxed text-slate">
          We&apos;ve passed your note to {listerName}. If it&apos;s a fit,
          they&apos;ll reply to you directly.
        </p>
      </div>
    );
  }

  // ---------- Gate state (defense-in-depth) ----------
  if (state.status === "gate") {
    return (
      <div className="max-w-md mx-auto text-center space-y-8">
        <p className="font-serif text-lg leading-relaxed text-ink">
          To message {listerName}, you need a member account. Members are
          sponsored by an existing member or approved through application.
        </p>
        <div className="space-y-4">
          <Link
            href="/apply"
            className="mh-link block text-[14px] tracking-[0.22em] uppercase text-ink"
          >
            Apply for membership &rarr;
          </Link>
          {/* "I have an invite →" stays commented out per the dead-link rule —
              no /invite route exists yet (same as the gating page). */}
        </div>
      </div>
    );
  }

  // ---------- Form ----------
  return (
    <form action={formAction} className="max-w-md mx-auto space-y-12">
      <input type="hidden" name="listing_id" value={listingId} />

      {/* From — read-only, so the member sees what the lister will see. */}
      <div>
        <p className={LABEL}>From</p>
        <p className="font-serif text-lg text-ink">
          {senderName ?? "You"}
          <span className="text-slate"> · {senderEmail}</span>
        </p>
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" className={LABEL}>
          Your message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          maxLength={2000}
          placeholder="Introduce yourself and say what you're interested in."
          className={`${FIELD_BASE} resize-none`}
        />
      </div>

      {state.status === "error" && (
        <p className="text-sm text-red-700">{state.message}</p>
      )}

      <div className="pt-4 text-center">
        <button
          type="submit"
          disabled={isPending}
          className="group inline-block bg-park text-bone px-12 py-4 text-[11px] tracking-[0.32em] uppercase transition-colors duration-300 hover:bg-ink disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {isPending ? "Sending…" : "Send message"}
        </button>
      </div>
    </form>
  );
}
