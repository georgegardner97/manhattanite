// Screen 11, second panel — the access wall, in the Classifieds system.
//
// The design's version: the wordmark, one line saying what happened, one line
// saying what to do, and the two ways through side by side.
//
// WHERE IT IS USED, AND A DELIBERATE DEPARTURE FROM THE LIVE PAGE. A guest may
// read the teaser listings and no others (the D1 decision, enforced in the
// detail page's query). The live /listings/[id] answers that case with
// `redirect("/signup")` — the guest asks for a listing and lands, without
// explanation, on a signup form.
//
// This screen renders the wall instead. The permission outcome is identical:
// the listing is not shown, and no part of it — not the title, not the price —
// reaches the page. What changes is that the reader is told why they are being
// stopped and given both doors, which is exactly what the design drew this
// panel for. Worth watching in the preview, because it is a funnel change as
// much as a visual one: the redirect converts harder, the wall explains better.

import Link from "next/link";
import Wordmark from "@/app/components/Wordmark";

export default function ClGate({
  title = "Members only",
  note = "Sign in, or request access.",
}: {
  title?: string;
  note?: string;
}) {
  return (
    <div className="cl-panel mx-auto flex min-h-[280px] max-w-[420px] flex-col justify-center p-[clamp(22px,2.4vw,32px)] text-center">
      <Wordmark className="mb-5 text-[20px] leading-none" />

      <div className="text-[18px]">{title}</div>
      <p
        className="mx-auto mt-2.5 mb-5 max-w-[280px] text-[13.5px] leading-[1.55]"
        style={{ color: "var(--cl-muted)" }}
      >
        {note}
      </p>

      <div className="flex flex-wrap justify-center gap-2.5">
        <Link href="/login" className="cl-pill">
          Sign in
        </Link>
        {/* Relabelled 2026-09-04: with the tiers scrapped there is no access
            to request, so the second control explains the way in rather than
            offering a door that isn't there. Still /apply, which is now the
            invitation-only screen. */}
        <Link href="/apply" className="cl-ghost">
          How to join
        </Link>
      </div>
    </div>
  );
}
