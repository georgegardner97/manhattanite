// The frame every long-form page in the Classifieds system sits in: terms,
// privacy, and — next — the standards page trust-and-moderation.md wants.
//
// BUILT ONCE ON PURPOSE. Two documents that each invent their own header,
// measure and draft notice drift within a month, and the drift shows: a reader
// who opens Terms and then Privacy is comparing them whether they mean to or
// not. So the eyebrow, the title, the date line, the notice and the reading
// column are decided here, and a page supplies its words.
//
// THE DRAFT NOTICE IS NOT DECORATION AND DOES NOT GET A PROP TO TURN IT OFF
// WITHOUT SAYING SO. COMPANY/legal-and-policy.md is explicit that both documents
// must be reviewed by a New York attorney before Manhattanite opens to the
// public, and until that happens saying so on the page is the honest thing —
// and cheap insurance besides. `notice` takes the text rather than a boolean so
// the day counsel signs off, a page passes its own line instead of silently
// dropping the box.

import Link from "next/link";
import AppHeader from "@/app/components/cl/AppHeader";
import Wordmark from "@/app/components/Wordmark";

export default function ClDocument({
  eyebrow,
  title,
  updated,
  notice,
  children,
}: {
  eyebrow: string;
  title: string;
  /** Rendered as-is: "June 12, 2026". */
  updated: string;
  notice?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <>
      <AppHeader active="none" />

      <main className="mx-auto w-full max-w-[900px] px-[clamp(16px,2.4vw,28px)] pt-[clamp(26px,3vw,44px)] pb-[clamp(40px,5vw,72px)]">
        <article className="cl-doc mx-auto">
          <header
            className="border-b pb-[clamp(20px,2.4vw,28px)]"
            style={{ borderColor: "var(--cl-hairline)" }}
          >
            <div className="cl-eyebrow">{eyebrow}</div>
            <h1 className="mt-3 text-[clamp(26px,3vw,36px)] font-medium leading-[1.12] tracking-[-0.02em]">
              {title}
            </h1>
            <p className="mt-3.5 text-[12.5px]" style={{ color: "var(--cl-faint)" }}>
              Last updated {updated}
            </p>
          </header>

          {notice && <div className="cl-note mt-[clamp(20px,2.4vw,28px)]">{notice}</div>}

          <div className="mt-[clamp(24px,3vw,34px)]">{children}</div>

          <footer
            className="mt-[clamp(36px,4vw,56px)] flex flex-wrap items-center justify-between gap-4 border-t pt-6 text-[12.5px]"
            style={{ borderColor: "var(--cl-hairline)", color: "var(--cl-faint)" }}
          >
            {/* The other document, always — someone reading one of these
                usually wants both, and the alternative is going back to the
                landing footer to find it. */}
            <Link href="/" style={{ color: "var(--cl-ink)" }}>
              <Wordmark className="text-[15px] leading-none" />
            </Link>
            <div className="flex gap-5">
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
              <a href="mailto:info@manhattanite.com">info@manhattanite.com</a>
            </div>
          </footer>
        </article>
      </main>
    </>
  );
}
