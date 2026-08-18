"use client";

// ClContactModal — screen 03's "Get in touch" popup, in the Classifieds system.
//
// The design's popup and the product's contact mechanic disagree on one point,
// and the product wins:
//
//   THE DESIGN SHOWS THE LISTER'S EMAIL ADDRESS. "omar.t@example.com" sits in a
//   box with "Open email" and "Copy address" under it. Manhattanite does not
//   publish member email addresses — contact is a form that posts to
//   log_listing_contact() and is forwarded by Resend, so the lister's address
//   is never handed to the sender and the contact is logged for moderation.
//   Handing out addresses instead would be a privacy change dressed as a visual
//   port, and it would take the moderation record with it.
//
// So the popup keeps the design's SHAPE — a small centered card, title, a line
// of explanation, one field, a filled action beside a quiet one, a closing note
// about what the other person sees — and the field is the message rather than
// the address. Everything below the surface is the live path: the same
// sendContact action, the same states, the same server-side gate.
//
// Three modes, decided by the page from the viewer's tier:
//   "form" (member)          → the real compose box.
//   "gate" (Tier-1 account)  → the members-only explainer and the way through.
//   Guests never reach either; the page renders a sign-in link instead.

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { sendContact, type ContactState } from "@/lib/listings/contact";

const INITIAL: ContactState = { status: "idle" };

type ClContactModalProps =
  | {
      mode: "form";
      listingId: string;
      listerName: string;
      senderName: string | null;
      senderEmail: string;
    }
  | { mode: "gate"; listerName: string };

export default function ClContactModal(props: ClContactModalProps) {
  const [open, setOpen] = useState(false);

  // Escape closes, and the page behind stops scrolling while the card is up.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cl-pill w-full"
      >
        Get in touch
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Contact ${props.listerName}`}
          className="cl-modal-backdrop"
        >
          {/* Backdrop. A real button so Escape is not the only way out for a
              keyboard, and so the click target is announced rather than being
              an inert div with a handler. */}
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="absolute inset-0 cursor-default"
          />

          <div className="cl-modal-card">
            {props.mode === "form" ? (
              <ContactBody {...props} onClose={() => setOpen(false)} />
            ) : (
              <GateBody
                listerName={props.listerName}
                onClose={() => setOpen(false)}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}

function CardHead({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="text-[16.5px] leading-[1.3]">{title}</div>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="cl-quiet shrink-0 text-[16px] leading-none"
        style={{ color: "var(--cl-faint)" }}
      >
        &times;
      </button>
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
  onClose: () => void;
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
        <button type="button" onClick={onClose} className="cl-ghost mt-4">
          Close
        </button>
      </>
    );
  }

  // ---------- Gate, reached mid-session ----------
  // Defense in depth: the page already gated on tier at render. If a membership
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
        <button
          type="button"
          onClick={onClose}
          className="cl-ghost"
          style={{ padding: "10px 18px", fontSize: "13px" }}
        >
          Cancel
        </button>
      </div>

      {/* The design's closing note, made accurate. It promised the lister sees
          "your name and who vouched for you"; the email the action actually
          sends carries the sender's name, neighborhood and reply-to address,
          so that is what this says. */}
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
  onClose: () => void;
}) {
  return (
    <>
      <CardHead title={`Contact ${listerName}`} onClose={onClose} />
      <p
        className="mt-3 text-[13px] leading-[1.55]"
        style={{ color: "var(--cl-muted)" }}
      >
        Messaging a lister is for members. Members are sponsored by an existing
        member, or approved on application.
      </p>
      <Link href="/apply" className="cl-pill mt-4 inline-block">
        Apply for membership
      </Link>
    </>
  );
}
