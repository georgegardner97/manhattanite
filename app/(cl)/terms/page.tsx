// /terms — Terms of Use. Plain-English working draft (Phase 1.5).
//
// Grounded in COMPANY/legal-and-policy.md: the platform-is-not-a-party
// principle, sponsorship-is-a-vouch-not-a-guarantee, fair-housing /
// non-discriminatory listing standards, the two-tier eligibility model, account
// termination, IP, and New York governing law.
//
// IMPORTANT: this is a working draft, NOT reviewed by counsel. Per the legal
// file it must be finalized by a NY attorney before Manhattanite opens to the
// public. The draft notice is rendered at the top of the page, on purpose, and
// stays until counsel has actually read it.
//
// MIGRATED 2026-08-26 (Slice 3a). The words are the shipped words, with one
// addition: the "Your privacy" section now states the rule decided that day —
// listings are public, member names are not. That sentence was previously true
// of the landing page only, which is exactly why it needed writing down.

import Link from "next/link";
import ClDocument from "@/app/components/cl/ClDocument";

export const metadata = {
  title: "Terms of Use — Manhattanite",
};

export default function ClassifiedsTermsPage() {
  return (
    <ClDocument
      eyebrow="Terms of use"
      title="The agreement."
      updated="August 26, 2026"
      notice={
        <>
          This is an early version of our terms, written in plain English while
          Manhattanite is in its private, seed phase. We&rsquo;ll publish a
          final version, reviewed by counsel, before the network opens to the
          public. If anything here is unclear, write to us at{" "}
          <a href="mailto:info@manhattanite.com">info@manhattanite.com</a>.
        </>
      }
    >
      <p>
        Manhattanite is a private, invitation-based marketplace for New York
        residents. By creating an account or using the site, you agree to these
        terms. If you don&rsquo;t agree, please don&rsquo;t use Manhattanite.
      </p>

      <h2>Who can use Manhattanite</h2>
      <p>
        There are two ways to be here. An <strong>account</strong> is free and
        open to anyone with an email address — it lets you browse the network.
      </p>
      {/* Two things about this paragraph. It is split from the one above for
          rhythm — and the sentence is built so the <strong> falls MID-LINE.
          JSX drops the space after a closing tag that begins a line, so
          "<strong>Membership</strong> is by" rendered as "Membershipis" both as
          one paragraph and as two; `{" "}` fixes it and Prettier takes it back
          out again. Wording that keeps the tag off the line start is the fix
          that survives a formatter. */}
      <p>
        The second way is <strong>membership</strong>: by application and manual
        approval, and it&rsquo;s what lets you post listings, contact other
        members, and bring people in. You must be at least 18 years old to hold
        either.
      </p>

      <h2>Membership and sponsorship</h2>
      <p>
        Members are brought in by other members who vouch for them. Sponsorship
        is a social act of trust, not a legal guarantee: a sponsor is not
        responsible for, and does not warrant, the conduct of the people they
        bring in. We may approve, decline, or revoke membership at our
        discretion to protect the network.
      </p>

      <h2>Listing standards</h2>
      <p>
        Listings must be honest, accurate, and your own to post. Describe what
        you&rsquo;re offering plainly, including its flaws. Every listing is
        reviewed by a person before it goes live.
      </p>
      <p>
        Housing listings must comply with fair-housing law. You may not include
        language that discriminates against, or expresses a preference based on,
        any protected class — including race, religion, national origin, sex,
        gender, sexual orientation, disability, family or marital status, age,
        or lawful source of income. New York&rsquo;s protections are broad, and
        we enforce them. Listings that cross this line will be removed, and
        repeat violations end membership.
      </p>
      <p>
        You also may not post anything illegal, fraudulent, misleading, or that
        isn&rsquo;t yours to sell or offer.
      </p>

      <h2>Manhattanite is not a party to your transactions</h2>
      <p>
        We connect members; we don&rsquo;t broker. Any arrangement, sale, lease,
        or exchange between members is strictly between those members.
        Manhattanite is not a party to it, does not handle payment, and is not
        responsible for the quality, safety, legality, or outcome of anything
        listed or exchanged. Use your judgment, and meet sensibly.
      </p>

      <h2>Your content</h2>
      <p>
        You keep ownership of the listings, photos, and messages you create. By
        posting them, you give Manhattanite permission to display and share them
        within the network so the service can work. You&rsquo;re responsible for
        having the rights to anything you post.
      </p>

      <h2>Your privacy</h2>
      <p>
        Our <Link href="/privacy">Privacy Policy</Link> explains what we collect
        and how we use it. Worth knowing up front: to make trust visible, your
        first and last name, your neighborhood, and the name of the member who
        sponsored you are shown to other members.
      </p>
      <p>
        To people outside the network, they are not. Listings are public —
        anyone can read the most recent few — but member names and sponsor names
        are shown only to people who are signed in.
      </p>

      <h2>Suspending or closing accounts</h2>
      <p>
        You can close your account at any time. We may suspend or remove an
        account that breaks these terms, harms other members, or puts the
        network at risk. Where it&rsquo;s reasonable, we&rsquo;ll tell you why.
      </p>

      <h2>Disclaimers and liability</h2>
      <p>
        Manhattanite is provided as-is, without warranties of any kind. To the
        fullest extent the law allows, we&rsquo;re not liable for losses arising
        from your use of the site or from your dealings with other members. This
        doesn&rsquo;t limit any rights that can&rsquo;t be limited under
        applicable law.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms as Manhattanite grows. If we make a material
        change, we&rsquo;ll let members know. Continuing to use the site after a
        change means you accept the updated terms.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of the State of New York, and any
        dispute will be handled in the courts located in New York County.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms? Write to{" "}
        <a href="mailto:info@manhattanite.com">info@manhattanite.com</a>.
      </p>
    </ClDocument>
  );
}
