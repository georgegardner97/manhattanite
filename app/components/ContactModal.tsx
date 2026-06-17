// ContactModal — the "Message the lister" action as an on-page pop-up rather
// than a separate route (Contact Modal slice, 2026-06-16).
//
// Why a modal: bouncing to /listings/[id]/contact and back was a full page
// turn for a one-line message. This keeps the member on the listing — a small
// compose window, like a marketplace inbox — while the mechanic underneath is
// unchanged: it's still the existing ContactForm → sendContact action → Resend
// email. No real-time chat (deliberately out of MVP scope, mvp-spec.md).
//
// Two modes, decided server-side by the viewer's tier:
//   - "form" (member)        → the real ContactForm inside the modal.
//   - "gate" (Tier-1 account) → the members-only explainer + Apply link, the
//     same copy the /contact page shows, so the wall reads identically.
// Guests never get here — the detail page sends them to /login instead.
//
// The /listings/[id]/contact route stays live as a fallback (direct links,
// no-JS), so this is additive, not a replacement.

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ContactForm from "@/app/components/ContactForm";

type ContactModalProps =
  | {
      mode: "form";
      listingId: string;
      listerName: string;
      senderName: string | null;
      senderEmail: string;
    }
  | { mode: "gate"; listerName: string };

export default function ContactModal(props: ContactModalProps) {
  const [open, setOpen] = useState(false);

  // Close on Escape, and lock background scroll while the modal is open.
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
        className="mh-link inline-block mt-10 text-[14px] tracking-[0.22em] uppercase text-ink cursor-pointer"
      >
        Message the lister
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Message ${props.listerName}`}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop — click to dismiss. */}
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/40 cursor-default"
          />

          {/* Card */}
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-bone border border-ink/15 shadow-xl px-8 py-10 sm:px-12 sm:py-12">
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="absolute top-5 right-6 text-2xl leading-none text-slate hover:text-ink cursor-pointer"
            >
              &times;
            </button>

            <div className="text-center mb-10">
              <p className="text-[11px] tracking-[0.22em] uppercase text-slate mb-4">
                {props.mode === "form" ? "Contact" : "Members only"}
              </p>
              <h2 className="font-serif font-light text-3xl tracking-tight text-ink">
                {props.mode === "form"
                  ? `Message ${props.listerName}.`
                  : `Message ${props.listerName}`}
              </h2>
              <span className="block w-8 h-px bg-ink/30 mx-auto mt-7" />
            </div>

            {props.mode === "form" ? (
              <>
                <p className="max-w-md mx-auto mb-10 text-center font-serif text-base leading-relaxed text-slate">
                  Your note goes straight to their inbox. They&apos;ll see your
                  name and can reply to you directly.
                </p>
                <ContactForm
                  listingId={props.listingId}
                  listerName={props.listerName}
                  senderName={props.senderName}
                  senderEmail={props.senderEmail}
                />
              </>
            ) : (
              <div className="max-w-md mx-auto text-center space-y-8">
                <p className="font-serif text-lg leading-relaxed text-ink">
                  To message {props.listerName}, you need a member account.
                  Members are sponsored by an existing member or approved through
                  application.
                </p>
                <Link
                  href="/apply"
                  className="mh-link block text-[14px] tracking-[0.22em] uppercase text-ink"
                >
                  Apply for membership &rarr;
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
