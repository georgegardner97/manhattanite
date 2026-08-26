"use client";

// The contact mechanic's body — the part the modal and the /listings/[id]/contact
// page BOTH render.
//
// WHY IT IS EXTRACTED. The design's answer to "get in touch" is a popup on the
// detail page, and that popup stays. But the route has to be a real page too: it
// is linked directly, it is where an old link lands, and a contact mechanic that
// only exists inside JavaScript is not a contact mechanic. Two implementations
// of the same thing is two places for the gate, the copy or the closing note to
// drift apart — so there is one body, rendered in two frames.
//
// TWO THINGS THE DESIGN GOT WRONG ABOUT CONTACT, settled and not up for revision:
//
//   1. MEMBER EMAIL ADDRESSES ARE NEVER SHOWN. The mockup puts the lister's
//      address in a box with "Open email" and "Copy address" under it.
//      Manhattanite does not publish member addresses — contact is a form that
//      posts to log_listing_contact() and is forwarded by Resend, so the
//      lister's address never reaches the sender and the contact is logged for
//      moderation. Handing out addresses would be a privacy change dressed as a
//      visual port, and it would take the moderation record with it.
//
//   2. THE CLOSING NOTE SAYS WHAT THE EMAIL ACTUALLY CARRIES. The mockup
//      promised the lister sees "your name and who vouched for you". The email
//      the action really sends carries the sender's name, neighborhood and
//      reply-to address, so that is what this says.
//
// THE TIER-1 GATE COPY IS VERBATIM from COMPANY/voice-and-copy.md ("Interaction
// gate — account holder tries to contact a member"). It was paraphrased while
// this lived in the modal only; it is restored here. Restyle it, don't rewrite
// it — the wording is the product's, not this screen's.

import { useActionState } from "react";
import Link from "next/link";
import { sendContact, type ContactState } from "@/lib/listings/contact";

const INITIAL: ContactState = { status: "idle" };

export type ClContactBodyProps =
  | {
      mode: "form";
      listingId: string;
      listerName: string;
      senderName: string | null;
      senderEmail: string;
      /** Present only in the modal frame. */
      onClose?: () => void;
    }
  | { mode: "gate"; listerName: string; onClose?: () => void };

export default function ClContactBody(props: ClContactBodyProps) {
  if (props.mode === "gate") {
    return <GateBody listerName={props.listerName} onClose={props.onClose} />;
  }
  return <ContactBody {...props} />;
}

export function CardHead({
  title,
  onClose,
}: {
  title: string;
  onClose?: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="text-[16.5px] leading-[1.3]">{title}</div>
      {onClose && (
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="cl-quiet shrink-0 text-[16px] leading-none"
          style={{ color: "var(--cl-faint)" }}
        >
          &times;
        </button>
      )}
    </div>
  );
}

function ContactBody({
  listingId,
  listerName,
  senderName,
  senderEmail,
  onClose,
}: {
  listingId: string;
  listerName: string;
  senderName: string | null;
  senderEmail: string;
  onClose?: () => void;
}) {
  const [state, formAction, isPending] = useActionState(sendContact, INITIAL);

  // ---------- Sent ----------
  if (state.status === "sent") {
    return (
      <>
        <CardHead title="Your message is on its way." onClose={onClose} />
        <p
          className="mt-3 text-[13px] leading-[1.55]"
          style={{ color: "var(--cl-muted)" }}
        >
          {listerName} has it. If it&rsquo;s a fit, they&rsquo;ll reply to you
          directly.
        </p>
        {onClose ? (
          <button type="button" onClick={onClose} className="cl-ghost mt-4">
            Close
          </button>
        ) : (
          <Link href="/listings" className="cl-ghost mt-4 inline-block">
            Back to listings
          </Link>
        )}
      </>
    );
  }

  // ---------- Gate, reached mid-session ----------
  // Defense in depth: the frame already gated on tier at render. If a membership
  // lapses between page load and submit, the action returns "gate" and the same
  // wall renders here rather than a generic failure.
  if (state.status === "gate") {
    return <GateBody listerName={listerName} onClose={onClose} />;
  }

  // ---------- Compose ----------
  return (
    <form action={formAction}>
      <input type="hidden" name="listing_id" value={listingId} />

      <CardHead title={`Contact ${listerName}`} onClose={onClose} />

      <p
        className="mt-3 text-[13px] leading-[1.55]"
        style={{ color: "var(--cl-muted)" }}
      >
        Your note goes straight to their inbox. There is no messaging in the app
        yet.
      </p>

      <label htmlFor="cl-contact-message" className="sr-only">
        Your message
      </label>
      <textarea
        id="cl-contact-message"
        name="message"
        required
        maxLength={2000}
        placeholder="Introduce yourself and say what you're interested in."
        className="cl-textarea mt-4"
      />

      {state.status === "error" && (
        <p className="cl-fielderror mt-2">{state.message}</p>
      )}

      <div className="mt-4 flex items-center gap-2.5">
        <button
          type="submit"
          disabled={isPending}
          className={isPending ? "cl-pill-disabled" : "cl-pill"}
          style={{ padding: "11px 18px", fontSize: "13px" }}
        >
          {isPending ? "Sending…" : "Send"}
        </button>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="cl-ghost"
            style={{ padding: "10px 18px", fontSize: "13px" }}
          >
            Cancel
          </button>
        ) : (
          <Link
            href={`/listings/${listingId}`}
            className="cl-ghost"
            style={{ padding: "10px 18px", fontSize: "13px" }}
          >
            Cancel
          </Link>
        )}
      </div>

      {/* What the email actually carries. See note 2 at the top. */}
      <p
        className="mt-3.5 text-[12px] leading-[1.5]"
        style={{ color: "var(--cl-faint)" }}
      >
        {listerName} sees your name{senderName ? ` — ${senderName}` : ""}, your
        neighborhood and {senderEmail}, and replies to you directly.
      </p>
    </form>
  );
}

function GateBody({
  listerName,
  onClose,
}: {
  listerName: string;
  onClose?: () => void;
}) {
  return (
    <>
      <CardHead title="Members only" onClose={onClose} />

      {/* VERBATIM, COMPANY/voice-and-copy.md → "Interaction gate — account
          holder tries to contact a member". Do not reword. */}
      <p
        className="mt-3 max-w-[46ch] text-[13.5px] leading-[1.55]"
        style={{ color: "var(--cl-body)" }}
      >
        To message {listerName}, you need a member account. Members are sponsored
        by an existing member or approved through application.
      </p>

      {/* The library's second CTA is "I have an invite →". /invite exists but is
          still an editorial screen — Slice 3 owns it — and pointing at it from
          here would walk someone straight out of this design system at the exact
          moment the slice was written to keep them inside it. It goes back when
          /invite is migrated, not before. */}
      <Link href="/apply" className="cl-pill mt-5 inline-block">
        Apply for membership
      </Link>
    </>
  );
}
