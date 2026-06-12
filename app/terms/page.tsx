// /terms — Terms of Use. Plain-English working draft (Phase 1.5).
//
// Grounded in COMPANY/legal-and-policy.md: the platform-is-not-a-party
// principle, sponsorship-is-a-vouch-not-a-guarantee, fair-housing /
// non-discriminatory listing standards, the two-tier eligibility model,
// account termination, IP, and New York governing law.
//
// IMPORTANT: this is a working draft, NOT reviewed by counsel. Per the legal
// file it must be finalized by a NY attorney before Manhattanite opens to the
// public. The draft notice is rendered at the top of the page, on purpose.

import Link from "next/link";

export const metadata = {
  title: "Terms of Use — Manhattanite",
};

const LABEL = "text-[11px] tracking-[0.26em] uppercase text-slate";
const H2 = "font-serif font-light text-2xl md:text-[28px] tracking-tight text-ink mt-14 mb-3";
const P = "text-slate leading-[1.85] mb-4";

export default function TermsPage() {
  return (
    <main className="px-6 py-20">
      <article className="max-w-[680px] mx-auto">
        <header className="text-center mb-14">
          <p className={`${LABEL} mb-5`}>Terms of Use</p>
          <h1 className="font-serif font-extralight text-5xl md:text-6xl tracking-tight text-ink">
            The agreement.
          </h1>
          <p className="mt-6 text-[13px] text-slate">Last updated June 12, 2026</p>
        </header>

        <div className="border border-ink/15 px-6 py-5 mb-12">
          <p className="text-[13px] leading-[1.7] text-slate">
            This is an early version of our terms, written in plain English while
            Manhattanite is in its private, seed phase. We&apos;ll publish a final
            version, reviewed by counsel, before the network opens to the public.
            If anything here is unclear, write to us at{" "}
            <a href="mailto:info@manhattanite.com" className="text-ink underline underline-offset-2">
              info@manhattanite.com
            </a>
            .
          </p>
        </div>

        <p className={P}>
          Manhattanite is a private, invitation-based marketplace for New York
          residents. By creating an account or using the site, you agree to these
          terms. If you don&apos;t agree, please don&apos;t use Manhattanite.
        </p>

        <h2 className={H2}>Who can use Manhattanite</h2>
        <p className={P}>
          There are two ways to be here. An <span className="text-ink">account</span> is
          free and open to anyone with an email address — it lets you browse the
          network. <span className="text-ink">Membership</span> is by application and
          manual approval, and it&apos;s what lets you post listings, contact other
          members, and bring people in. You must be at least 18 years old to hold
          either.
        </p>

        <h2 className={H2}>Membership and sponsorship</h2>
        <p className={P}>
          Members are brought in by other members who vouch for them. Sponsorship
          is a social act of trust, not a legal guarantee: a sponsor is not
          responsible for, and does not warrant, the conduct of the people they
          bring in. We may approve, decline, or revoke membership at our
          discretion to protect the network.
        </p>

        <h2 className={H2}>Listing standards</h2>
        <p className={P}>
          Listings must be honest, accurate, and your own to post. Describe what
          you&apos;re offering plainly, including its flaws. Every listing is
          reviewed by a person before it goes live.
        </p>
        <p className={P}>
          Housing listings must comply with fair-housing law. You may not include
          language that discriminates against, or expresses a preference based on,
          any protected class — including race, religion, national origin, sex,
          gender, sexual orientation, disability, family or marital status, age,
          or lawful source of income. New York&apos;s protections are broad, and we
          enforce them. Listings that cross this line will be removed, and
          repeat violations end membership.
        </p>
        <p className={P}>
          You also may not post anything illegal, fraudulent, misleading, or that
          isn&apos;t yours to sell or offer.
        </p>

        <h2 className={H2}>Manhattanite is not a party to your transactions</h2>
        <p className={P}>
          We connect members; we don&apos;t broker. Any arrangement, sale, lease,
          or exchange between members is strictly between those members.
          Manhattanite is not a party to it, does not handle payment, and is not
          responsible for the quality, safety, legality, or outcome of anything
          listed or exchanged. Use your judgment, and meet sensibly.
        </p>

        <h2 className={H2}>Your content</h2>
        <p className={P}>
          You keep ownership of the listings, photos, and messages you create. By
          posting them, you give Manhattanite permission to display and share them
          within the network so the service can work. You&apos;re responsible for
          having the rights to anything you post.
        </p>

        <h2 className={H2}>Your privacy</h2>
        <p className={P}>
          Our{" "}
          <Link href="/privacy" className="text-ink underline underline-offset-2">
            Privacy Policy
          </Link>{" "}
          explains what we collect and how we use it. Worth knowing up front: to
          make trust visible, your first and last name, your neighborhood, and the
          name of the member who sponsored you are shown to other members.
        </p>

        <h2 className={H2}>Suspending or closing accounts</h2>
        <p className={P}>
          You can close your account at any time. We may suspend or remove an
          account that breaks these terms, harms other members, or puts the
          network at risk. Where it&apos;s reasonable, we&apos;ll tell you why.
        </p>

        <h2 className={H2}>Disclaimers and liability</h2>
        <p className={P}>
          Manhattanite is provided as-is, without warranties of any kind. To the
          fullest extent the law allows, we&apos;re not liable for losses arising
          from your use of the site or from your dealings with other members. This
          doesn&apos;t limit any rights that can&apos;t be limited under applicable
          law.
        </p>

        <h2 className={H2}>Changes</h2>
        <p className={P}>
          We may update these terms as Manhattanite grows. If we make a material
          change, we&apos;ll let members know. Continuing to use the site after a
          change means you accept the updated terms.
        </p>

        <h2 className={H2}>Governing law</h2>
        <p className={P}>
          These terms are governed by the laws of the State of New York, and any
          dispute will be handled in the courts located in New York County.
        </p>

        <h2 className={H2}>Contact</h2>
        <p className={P}>
          Questions about these terms? Write to{" "}
          <a href="mailto:info@manhattanite.com" className="text-ink underline underline-offset-2">
            info@manhattanite.com
          </a>
          .
        </p>

        <div className="mt-16 pt-8 border-t border-ink/10 text-center">
          <Link href="/" className="mh-link text-[12px] tracking-[0.22em] uppercase text-slate">
            &larr; Back to Manhattanite
          </Link>
        </div>
      </article>
    </main>
  );
}
