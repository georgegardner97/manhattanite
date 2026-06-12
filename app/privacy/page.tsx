// /privacy — Privacy Policy. Plain-English working draft (Phase 1.5).
//
// Grounded in COMPANY/legal-and-policy.md: what's collected at account
// creation and application, member-visible profile data (full name +
// neighborhood + sponsor, by design), moderation logs, analytics; how it's
// used; retention; deletion rights (NY SHIELD Act, CCPA/GDPR for out-of-state
// and EU members). No payments are processed in the seed phase.
//
// IMPORTANT: working draft, NOT reviewed by counsel. Per the legal file a
// privacy policy must be live and finalized by an attorney before real users.
// The draft notice renders at the top of the page, on purpose.

import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Manhattanite",
};

const LABEL = "text-[11px] tracking-[0.26em] uppercase text-slate";
const H2 = "font-serif font-light text-2xl md:text-[28px] tracking-tight text-ink mt-14 mb-3";
const P = "text-slate leading-[1.85] mb-4";

export default function PrivacyPage() {
  return (
    <main className="px-6 py-20">
      <article className="max-w-[680px] mx-auto">
        <header className="text-center mb-14">
          <p className={`${LABEL} mb-5`}>Privacy Policy</p>
          <h1 className="font-serif font-extralight text-5xl md:text-6xl tracking-tight text-ink">
            What we hold, and why.
          </h1>
          <p className="mt-6 text-[13px] text-slate">Last updated June 12, 2026</p>
        </header>

        <div className="border border-ink/15 px-6 py-5 mb-12">
          <p className="text-[13px] leading-[1.7] text-slate">
            This is an early version of our privacy policy, written in plain
            English while Manhattanite is in its private, seed phase. We&apos;ll
            publish a final version, reviewed by counsel, before the network opens
            to the public. Questions? Write to{" "}
            <a href="mailto:info@manhattanite.com" className="text-ink underline underline-offset-2">
              info@manhattanite.com
            </a>
            .
          </p>
        </div>

        <p className={P}>
          Manhattanite is built on trust, and that includes how we handle your
          information. We collect only what the network needs to work, we
          don&apos;t sell it, and we keep it inside the network.
        </p>

        <h2 className={H2}>What we collect</h2>
        <p className={P}>
          When you create an account, we collect your email address and a
          password. When you apply for membership, we collect your name, your
          neighborhood, what you do, a short note about yourself, and the name of
          whoever referred you. When you post a listing, we store its details and
          photos. When you message another member, we store that message so it can
          be delivered and reviewed if needed. We also keep moderation records and
          basic, privacy-respecting analytics about how the site is used.
        </p>

        <h2 className={H2}>How we use it</h2>
        <p className={P}>
          We use your information to run the network: to create and secure your
          account, review membership applications, check listings before they go
          live, connect members who want to reach each other, and keep the place
          trustworthy. We don&apos;t process payments — Manhattanite takes no
          money through the platform during this phase.
        </p>

        <h2 className={H2}>What other members can see</h2>
        <p className={P}>
          Trust on Manhattanite is visible on purpose. Other members can see your
          first and last name, your neighborhood, and the name of the member who
          sponsored you. Your listings show this byline too. Your email address,
          password, and application details are not shown to other members. If
          you&apos;d rather not be named, Manhattanite isn&apos;t the right fit —
          being vouched for, and named, is the point.
        </p>

        <h2 className={H2}>Who else can access it</h2>
        <p className={P}>
          A small number of people who run Manhattanite can access account and
          application data to review members and moderate listings. We use a few
          trusted service providers to operate the site — for hosting, database,
          and sending email — and they only handle data on our behalf. We do not
          sell your information, and we don&apos;t share it for advertising.
        </p>

        <h2 className={H2}>Cookies and analytics</h2>
        <p className={P}>
          We use the cookies needed to keep you signed in, and lightweight
          analytics to understand how the site is used. We don&apos;t use
          advertising trackers.
        </p>

        <h2 className={H2}>How long we keep it</h2>
        <p className={P}>
          We keep your information for as long as you have an account, and for a
          reasonable period afterward where we need it for safety, legal, or
          record-keeping reasons. When you ask us to delete your account, we
          delete or anonymize your personal data rather than simply hiding it.
        </p>

        <h2 className={H2}>Your choices</h2>
        <p className={P}>
          You can ask to see the information we hold about you, correct it, or have
          it deleted. Depending on where you live — including under New York&apos;s
          SHIELD Act, and laws such as the CCPA in California or the GDPR in Europe
          — you may have additional rights. To make any request, write to{" "}
          <a href="mailto:info@manhattanite.com" className="text-ink underline underline-offset-2">
            info@manhattanite.com
          </a>{" "}
          and we&apos;ll take care of it.
        </p>

        <h2 className={H2}>Security</h2>
        <p className={P}>
          We take reasonable measures to protect your information, including
          database-level access controls and short-lived, signed links for the
          photos you upload. No system is perfectly secure, but we treat your data
          as something to be careful with.
        </p>

        <h2 className={H2}>Children</h2>
        <p className={P}>
          Manhattanite is for adults. You must be at least 18 to use it, and
          it&apos;s not directed at anyone younger.
        </p>

        <h2 className={H2}>Changes</h2>
        <p className={P}>
          We may update this policy as Manhattanite grows. If we make a material
          change, we&apos;ll let members know.
        </p>

        <h2 className={H2}>Contact</h2>
        <p className={P}>
          Questions about your privacy? Write to{" "}
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
