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

import { useEffect, useState } from "react";
import ContactForm from "@/app/components/ContactForm";
import { boxButtonClass } from "@/app/components/BoxButton";
import ArrowLink from "@/app/components/ArrowLink";

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
      {/* The detail page's single primary action. It needs an onClick, which a
          Server Component can't hand to <BoxButton> — so it borrows the class
          instead and stays visually identical to every other boxed action. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={boxButtonClass("light")}
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
          {/* mh-vh-modal: 90svh with a vh fallback, so the card never runs
              under the iOS toolbar (vh ignores it; svh doesn't). */}
          <div className="relative w-full max-w-lg mh-vh-modal overflow-y-auto bg-bone border border-ink/15 shadow-xl px-8 py-10 sm:px-12 sm:py-12">
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="mh-tap absolute top-5 right-6 text-2xl leading-none text-slate hover:text-ink cursor-pointer"
            >
              &times;
            </button>

            {/* Left-aligned under a hairline, matching the /contact route and
                the rest of the system — the centered stack with a dash under
                it was the last survivor of the pre-Slice-1 header. */}
            <div className="mb-8">
              <p className="mh-label text-slate mb-3.5">
                {props.mode === "form" ? "Contact" : "Members only"}
              </p>
              <h2 className="font-serif font-normal text-[32px] leading-[1.1] text-ink border-b border-ink/16 pb-6">
                {props.mode === "form"
                  ? `Message ${props.listerName}.`
                  : `Message ${props.listerName}`}
              </h2>
            </div>

            {props.mode === "form" ? (
              <>
                <p className="mb-8 leading-relaxed text-slate">
                  Your note goes straight to their inbox. They&rsquo;ll see your
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
              <div className="space-y-7">
                <p className="font-serif text-lg leading-relaxed text-ink">
                  To message {props.listerName}, you need a member account.
                  Members are sponsored by an existing member or approved through
                  application.
                </p>
                <ArrowLink href="/apply">Apply for membership</ArrowLink>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
