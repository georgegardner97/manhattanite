"use client";

// ClContactModal — screen 03's "Get in touch" popup, in the Classifieds system.
//
// The design's shape: a small centered card, a title, a line of explanation, one
// field, a filled action beside a quiet one, and a closing note about what the
// other person sees. The field is the message rather than the lister's address,
// and everything below the surface is the live path.
//
// THE BODY IS NOT DEFINED HERE ANY MORE (Slice 2). /listings/[id]/contact is a
// real page as well as a popup — it is linked directly, and a contact mechanic
// that exists only in JavaScript is not a contact mechanic. Both frames render
// ClContactBody, so a change to one cannot make the two disagree about the gate,
// the copy, or what the email carries.
//
// Two modes, decided by the page from the viewer's tier:
//   "form" (member)          → the real compose box.
//   "gate" (Tier-1 account)  → the members-only explainer and the way through.
//   Guests never reach either; the page renders a sign-in link instead.

import { useEffect, useState } from "react";
import ClContactBody from "@/app/components/cl/ClContactBody";

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
            <ClContactBody {...props} onClose={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
