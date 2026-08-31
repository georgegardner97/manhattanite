// /privacy — Privacy Policy. Plain-English working draft (Phase 1.5).
//
// Grounded in COMPANY/legal-and-policy.md: what's collected at account creation
// and application, member-visible profile data (full name + neighborhood +
// sponsor, by design), moderation logs; how it's used; retention; deletion
// rights (NY SHIELD Act, CCPA/GDPR for out-of-state and EU members). No
// payments are processed in the seed phase.
//
// IMPORTANT: working draft, NOT reviewed by counsel. Per the legal file a
// privacy policy must be live and finalized by an attorney before real users.
// The draft notice renders at the top of the page, on purpose, and stays until
// counsel has actually read these pages.
//
// ---------------------------------------------------------------------------
// TWO CHANGES ON MIGRATION, 2026-08-26. The first is the design system. The
// second is a correction, and it is the more important one:
//
// THE ANALYTICS CLAIM CAME OUT, BECAUSE THERE ARE NO ANALYTICS. This page used
// to say we keep "basic, privacy-respecting analytics" and use "lightweight
// analytics to understand how the site is used". The site runs none — no
// Plausible, no Google, no Vercel Analytics, no tag of any kind, which the repo
// will confirm in one grep. Plausible is planned, not shipped.
//
// A privacy policy that overclaims is worse than a thin one. It is the document
// a reader uses to decide whether to trust the rest, it is about to be read by
// a lawyer, and "we collect less than we said" is the only kind of correction
// that costs nothing to make and something real to leave. The line goes back
// when analytics actually land — and the day it does, the honest version is
// specific about which tool and what it stores.
// ---------------------------------------------------------------------------

import Link from "next/link";
import ClDocument from "@/app/components/cl/ClDocument";

export const metadata = {
  title: "Privacy Policy — Manhattanite",
};

export default function ClassifiedsPrivacyPage() {
  return (
    <ClDocument
      eyebrow="Privacy policy"
      title="What we hold, and why."
      updated="August 26, 2026"
      notice={
        <>
          This is an early version of our privacy policy, written in plain
          English while Manhattanite is in its private, seed phase. We&rsquo;ll
          publish a final version, reviewed by counsel, before the network opens
          to the public. Questions? Write to{" "}
          <a href="mailto:info@manhattanite.com">info@manhattanite.com</a>.
        </>
      }
    >
      <p>
        Manhattanite is built on trust, and that includes how we handle your
        information. We collect only what the network needs to work, we
        don&rsquo;t sell it, and we keep it inside the network.
      </p>

      <h2>What we collect</h2>
      <p>
        When you create an account, we collect your email address and a password.
        When you apply for membership, we collect your name, your neighborhood,
        what you do, a short note about yourself, and the name of whoever
        referred you. When you post a listing, we store its details and photos.
        When you message another member, we store that message so it can be
        delivered and reviewed if needed. We also keep moderation records: what
        was reviewed, and what was decided.
      </p>

      <h2>How we use it</h2>
      <p>
        We use your information to run the network: to create and secure your
        account, review membership applications, check listings before they go
        live, connect members who want to reach each other, and keep the place
        trustworthy. We don&rsquo;t process payments — Manhattanite takes no
        money through the platform during this phase.
      </p>

      <h2>What other members can see</h2>
      <p>
        Trust on Manhattanite is visible on purpose. Other members can see your
        first and last name, your neighborhood, and the name of the member who
        vouched for you. Your listings show this byline too. Your email address,
        password, and application details are not shown to other members. If
        you&rsquo;d rather not be named, Manhattanite isn&rsquo;t the right fit —
        being vouched for, and named, is the point.
      </p>
      {/* The 2026-08-26 rule, on the page that has to say so: names are for
          people inside the network. It belongs here rather than only in Terms,
          because "who can see my name" is a privacy question first. */}
      <p>
        Members are named to members. A logged-out visitor can read the most
        recent few listings, but sees no member names at all — not the
        lister&rsquo;s, and not the name of whoever vouched for them. Listings
        are public, the people behind them are not.
      </p>

      <h2>Who else can access it</h2>
      <p>
        A small number of people who run Manhattanite can access account and
        application data to review members and moderate listings. We use a few
        trusted service providers to operate the site — for hosting, database,
        and sending email — and they only handle data on our behalf. We do not
        sell your information, and we don&rsquo;t share it for advertising.
      </p>

      <h2>Cookies</h2>
      <p>
        We use the cookies needed to keep you signed in, and a challenge from
        Cloudflare on our sign-in and sign-up forms to keep bots out. We
        don&rsquo;t run analytics, and we don&rsquo;t use advertising trackers.
        If we add analytics later we&rsquo;ll name the tool here and say what it
        stores.
      </p>

      <h2>How long we keep it</h2>
      <p>
        We keep your information for as long as you have an account, and for a
        reasonable period afterward where we need it for safety, legal, or
        record-keeping reasons. When you ask us to delete your account, we delete
        or anonymize your personal data rather than simply hiding it.
      </p>

      <h2>Your choices</h2>
      <p>
        You can ask to see the information we hold about you, correct it, or have
        it deleted. Depending on where you live — including under New
        York&rsquo;s SHIELD Act, and laws such as the CCPA in California or the
        GDPR in Europe — you may have additional rights. To make any request,
        write to <a href="mailto:info@manhattanite.com">info@manhattanite.com</a>{" "}
        and we&rsquo;ll take care of it.
      </p>

      <h2>Security</h2>
      <p>
        We take reasonable measures to protect your information, including
        database-level access controls and short-lived, signed links for the
        photos you upload. No system is perfectly secure, but we treat your data
        as something to be careful with.
      </p>

      <h2>Children</h2>
      <p>
        Manhattanite is for adults. You must be at least 18 to use it, and
        it&rsquo;s not directed at anyone younger.
      </p>

      <h2>Changes</h2>
      <p>
        We may update this policy as Manhattanite grows. If we make a material
        change, we&rsquo;ll let members know.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about your privacy? Write to{" "}
        <a href="mailto:info@manhattanite.com">info@manhattanite.com</a>. Our{" "}
        <Link href="/terms">Terms of Use</Link> cover the rest of how the network
        works.
      </p>
    </ClDocument>
  );
}
