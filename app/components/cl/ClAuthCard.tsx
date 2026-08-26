// One card, centered — the Classifieds system's shape for a screen that asks
// for a single thing and has nowhere else to send you.
//
// SCREEN 09 IS THE GRAMMAR, HALVED. ClAccess draws two panels side by side
// because it has two doors to offer: the way in on the left, the way back on
// the right. The reset screens have one field and one action, and there is no
// second door — a "create an account" card beside a password reset would be
// answering a question nobody on that page is asking. So the card is the same
// object (panel, wordmark, title, note, one filled pill) with the grid taken
// away, which is how these screens stay recognisably part of the same set
// without pretending to a choice they do not have.
//
// THE CARD CARRIES THE WORDMARK, THE PAGE CARRIES THE HEADER. The editorial
// system stood its nav down on the threshold screens (AuthShell + NavGate),
// because the dark auth page was a room of its own. The Classifieds system does
// not work that way: /login, /signup and /apply all render AppHeader, and
// browse is readable to a logged-out visitor anyway, so hiding the nav here
// would make the reset screens the odd ones out. The mark inside the card is
// still the way home, and on a threshold screen that matters — it is the one
// link that means "leave this and go back to the front".

import Link from "next/link";
import Wordmark from "@/app/components/Wordmark";

export default function ClAuthCard({
  title,
  note,
  footer,
  children,
}: {
  title: string;
  note?: string;
  /** The quiet line under the card — usually the way back to sign in. */
  footer?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-[1100px] px-[clamp(16px,2.4vw,28px)] pt-[clamp(28px,5vw,64px)] pb-[clamp(32px,4vw,56px)]">
      <div className="mx-auto w-full max-w-[440px]">
        <section className="cl-panel p-[clamp(24px,3vw,40px)]">
          {/* Home, because on a threshold screen the mark is the only
              navigation there is. */}
          <Link href="/" style={{ color: "var(--cl-ink)" }}>
            <Wordmark className="text-[18px] leading-none" />
          </Link>

          <h1 className="mt-[26px] text-[clamp(21px,2.2vw,27px)] font-medium tracking-[-0.02em]">
            {title}
          </h1>

          {note && (
            <p
              className="mt-2.5 text-[13.5px] leading-[1.55]"
              style={{ color: "var(--cl-muted)" }}
            >
              {note}
            </p>
          )}

          {children && <div className="mt-6">{children}</div>}
        </section>

        {footer && (
          <div
            className="mt-[18px] text-center text-[12.5px]"
            style={{ color: "var(--cl-muted)" }}
          >
            {footer}
          </div>
        )}
      </div>
    </main>
  );
}
