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
// Styling (Slice 2): the boxed .mh-input control and a BoxButton submit, so the
// form reads as something you can act on. Renders on the light surface in both
// of its homes — the /contact route and the on-page modal.

"use client";

import { useActionState } from "react";
import { sendContact, type ContactState } from "@/lib/listings/contact";
import BoxButton from "@/app/components/BoxButton";
import ArrowLink from "@/app/components/ArrowLink";

const LABEL = "mh-label block text-slate mb-2.5";

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
      <div className="max-w-[52ch] space-y-5">
        <p className="font-serif text-[26px] leading-[1.2] text-ink">
          Your message is on its way.
        </p>
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
      <div className="max-w-[52ch] space-y-7">
        <p className="font-serif text-lg leading-relaxed text-ink">
          To message {listerName}, you need a member account. Members are
          sponsored by an existing member or approved through application.
        </p>
        <div>
          <ArrowLink href="/apply">Apply for membership</ArrowLink>
          {/* "I have an invite →" stays commented out per the dead-link rule —
              no /invite route exists yet (same as the gating page). */}
        </div>
      </div>
    );
  }

  // ---------- Form ----------
  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="listing_id" value={listingId} />

      {/* From — read-only, so the member sees what the lister will see. */}
      <div>
        <p className={LABEL}>From</p>
        <p className="text-ink">
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
          className="mh-input resize-none"
        />
      </div>

      {state.status === "error" && (
        <p className="text-sm text-red-700">{state.message}</p>
      )}

      <div className="pt-2">
        <BoxButton type="submit" surface="light" disabled={isPending}>
          {isPending ? "Sending…" : "Send"}
        </BoxButton>
      </div>
    </form>
  );
}
