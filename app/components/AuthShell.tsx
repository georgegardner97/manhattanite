// AuthShell — the dark "threshold" chrome shared by every screen between the
// outside and the inside: /login, /signup, /reset-request, /reset-password and
// /apply. (Design foundation, Slice 2.)
//
// The dark-outside / light-inside model puts these screens on the LANDING's
// side of the door, not the product's: park ground, bone type, the serif
// wordmark centered up top. Signing in is the moment you cross over, and the
// bone product surface on the far side is what the crossing feels like — which
// is why nothing here animates or transitions. The redirect does the work.
//
// The global SiteNav stands down on all five routes (see NavGate): the wordmark
// below is the only chrome, exactly as on the landing. A tier-aware product nav
// on a page whose whole job is "you are not inside yet" was the mismatch.
//
// Structure, from the v9 mockup: centered column, kicker label, serif headline,
// optional sub-line, then the caller's form. `width` widens the column for
// /apply, which has five fields rather than two.

import Link from "next/link";
import type { ReactNode } from "react";
import Wordmark from "@/app/components/Wordmark";

export default function AuthShell({
  kicker,
  headline,
  sub,
  children,
  footer,
  width = "narrow",
}: {
  /** Small-caps label above the headline, e.g. "Sign in". */
  kicker: string;
  /** The serif statement line, e.g. "Welcome back." */
  headline: string;
  /** Optional reassurance line under the headline. */
  sub?: ReactNode;
  children: ReactNode;
  /** Secondary paths under the form — sign-in / create-account / forgotten. */
  footer?: ReactNode;
  width?: "narrow" | "wide";
}) {
  return (
    <main className="mh-dark min-h-screen flex flex-col">
      {/* Wordmark — the way back "outside". Matches the landing's mark. */}
      <div className="mh-gutter py-[34px] text-center">
        <Link href="/" className="text-bone">
          <Wordmark className="text-[28px] leading-none" />
        </Link>
      </div>

      <div className="flex-1 flex flex-col items-center px-6 pt-10 pb-20 max-[860px]:px-[22px]">
        <div
          className={`w-full ${width === "wide" ? "max-w-[520px]" : "max-w-[420px]"}`}
        >
          <p className="mh-label text-center text-bone/60 mb-3.5">{kicker}</p>

          <h1 className="font-serif font-normal text-[42px] max-[860px]:text-[34px] leading-[1.1] text-center text-bone">
            {headline}
          </h1>

          {sub && (
            // 38ch is the comfortable measure for the one-line reassurances on
            // the auth screens; /apply's opening is a full paragraph and needs
            // the whole column, or it sets as a narrow ribbon.
            <p
              className={`text-center text-bone/60 leading-relaxed mx-auto mt-2.5 ${
                width === "wide" ? "" : "max-w-[38ch]"
              }`}
            >
              {sub}
            </p>
          )}

          <div className="mt-[42px]">{children}</div>

          {footer && (
            <div className="mt-[26px] text-center text-[13.5px] text-bone/60">
              {footer}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

// The underlined bone text link used for secondary paths in the footer slot.
// Not an ArrowLink: these are lateral moves ("no account? create one"), not
// forward motion, and a row of arrows under the primary action would compete
// with it.
export function AuthLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-cream hover:underline underline-offset-4"
    >
      {children}
    </Link>
  );
}

// The hairline dot between two footer links.
export function AuthSep() {
  return <span className="mx-2.5 opacity-40">&middot;</span>;
}
