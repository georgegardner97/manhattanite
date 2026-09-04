// Transactional emails — membership (Phase 2 Slice C), listing contact, and
// listing moderation (Listing Moderation slice). Restyled to the approved v12
// design (Phase 5): WORK AREAS/Product/design-foundation-project/outputs/
// Manhattanite_Mockup_v12_Emails.html is the contract.
//
// All through Resend (domain already verified). Copy follows the mockup
// verbatim for the three v12 emails (typographic apostrophes included) and
// COMPANY/voice-and-copy.md for the rest — American spelling, Soho House
// register, no generic transactional chrome.
//
// The HTML is deliberately email-client-safe: table-based layout, all styles
// inline, no web fonts. Georgia for the wordmark + headlines (the serif email
// clients actually allow), Arial/Helvetica for body. 600px max, bone card,
// hairline rules, one boxed CTA. Dark text on the bone card survives Gmail's
// dark-mode inversion better than anything white-on-dark would.
//
// Every send carries a plain-text alternative (deliverability), built from the
// same render function that builds the HTML.
//
// Every function is best-effort and returns void — callers wrap each call in
// its own try/catch so a mail failure never breaks the underlying action (the
// saved application, the completed approval).

import { Resend } from "resend";

// One client for the module. RESEND_API_KEY is read at import time; in the
// CLI approve path it comes from `node --env-file=.env.local`.
const resend = new Resend(process.env.RESEND_API_KEY);

const APPLICATIONS_FROM = "Manhattanite <info@manhattanite.com>";
const REVIEWER_TO = "info@manhattanite.com";

// ---------------------------------------------------------------------------
// Shared v12 layout. One set of bones for every send: wordmark header,
// hairline, optional kicker + Georgia headline, Arial body, optional boxed
// CTA (bulletproof table button), hairline footer with the tagline.
// ---------------------------------------------------------------------------

// Design tokens, straight from the mockup.
const BONE = "#F5F0E8";
const INK = "#0F0E0C";
const SLATE = "#5A5A5A";
const HAIR = "rgba(15,14,12,.16)";
const BODY_COLOR = "#2c2a25";
const FOOT_COLOR = "#8a857a";

const SERIF = "Georgia,'Times New Roman',serif";
// Headlines and quotes prefer the site's true serif where the client allows
// it (Apple Mail honors @font-face; Gmail strips it and falls back to
// Georgia). The woff2 + retina wordmark PNG live in public/email/ and are
// served from prod — email clients can only load them over https.
const SERIF_STACK = `'Instrument Serif',${SERIF}`;
const SANS = "Arial,Helvetica,sans-serif";
const ASSET_HOST = "https://manhattanite.com";

// Interpolated user data (names, titles, messages, notes) must never be able
// to break out of the markup.
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Body paragraph with the v12 body treatment.
function p(html: string, opts?: { muted?: boolean; last?: boolean }): string {
  const color = opts?.muted ? "#6b665c" : BODY_COLOR;
  const size = opts?.muted ? "13px" : "14.5px";
  const margin = opts?.last ? "0" : "0 0 14px";
  return `<p style="margin:${margin};font-family:${SANS};font-size:${size};line-height:1.65;color:${color};">${html}</p>`;
}

// The serif left-hairline pull-quote (contact forward, moderation notes).
function quote(html: string): string {
  return `<div style="border-left:1px solid rgba(15,14,12,.3);padding:4px 0 4px 18px;margin:18px 0;font-family:${SERIF_STACK};font-size:16px;line-height:1.5;color:${BODY_COLOR};">${html}</div>`;
}

type LayoutOptions = {
  kicker?: string; // already-escaped HTML (may contain &middot;)
  headline?: string; // already-escaped HTML
  bodyHtml: string; // trusted HTML assembled by the render functions below
  cta?: { label: string; href: string };
};

// The bulletproof boxed CTA: a real table cell carries the border so Outlook
// renders the box, the anchor carries the padding so the whole box is a
// click target everywhere else.
function ctaButton(cta: { label: string; href: string }): string {
  return `
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:30px auto 6px;">
          <tr>
            <td style="border:1px solid ${INK};">
              <a href="${cta.href}" style="display:inline-block;padding:13px 30px;font-family:${SANS};font-size:11px;letter-spacing:.14em;text-transform:uppercase;font-weight:bold;color:${INK};text-decoration:none;">${esc(cta.label)}</a>
            </td>
          </tr>
        </table>`;
}

function layout({ kicker, headline, bodyHtml, cta }: LayoutOptions): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<style>
  @font-face {
    font-family: 'Instrument Serif';
    font-style: normal;
    font-weight: 400;
    src: url('${ASSET_HOST}/email/instrument-serif-regular.woff2') format('woff2');
  }
</style>
</head>
<body style="margin:0;padding:0;background:#ffffff;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;">
    <tr>
      <td align="center" style="padding:32px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="${BONE}" style="width:100%;max-width:600px;background:${BONE};color:${INK};">
          <tr>
            <td style="padding:44px 40px 40px;">
              <div style="text-align:center;padding-bottom:28px;">
                <img src="${ASSET_HOST}/email/wordmark.png" width="180" height="28" alt="Manhattanite." style="display:inline-block;width:180px;height:28px;border:0;font-family:${SERIF};font-size:24px;color:${INK};" />
              </div>
              <div style="border-top:1px solid ${HAIR};line-height:1px;font-size:1px;">&nbsp;</div>
              ${
                kicker
                  ? `<div style="font-family:${SANS};font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;font-weight:bold;color:${SLATE};text-align:center;margin:30px 0 12px;">${kicker}</div>`
                  : `<div style="height:30px;line-height:30px;font-size:1px;">&nbsp;</div>`
              }
              ${
                headline
                  ? `<h1 style="font-family:${SERIF_STACK};font-weight:normal;font-size:34px;text-align:center;line-height:1.15;margin:0 0 24px;color:${INK};">${headline}</h1>`
                  : ""
              }
              <div style="max-width:420px;margin:0 auto;">
                ${bodyHtml}
              </div>
              ${cta ? ctaButton(cta) : ""}
              <div style="border-top:1px solid ${HAIR};margin-top:36px;padding-top:22px;text-align:center;font-family:${SANS};font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:${FOOT_COLOR};">
                <div style="letter-spacing:.16em;margin-bottom:6px;">New York&rsquo;s trusted private marketplace</div>
                <div>Manhattanite &middot; New York, NY &middot; <a href="mailto:info@manhattanite.com" style="color:${FOOT_COLOR};">info@manhattanite.com</a></div>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Plain-text alternative, same bones: wordmark, headline, body lines, CTA as
// a bare URL, footer.
function textLayout({
  headline,
  lines,
  cta,
}: {
  headline?: string;
  lines: string[];
  cta?: { label: string; href: string };
}): string {
  const parts = [
    "Manhattanite.",
    "",
    ...(headline ? [headline, ""] : []),
    ...lines.flatMap((line) => [line, ""]),
    ...(cta ? [`${cta.label}: ${cta.href}`, ""] : []),
    "—",
    "New York’s trusted private marketplace",
    "Manhattanite · New York, NY · info@manhattanite.com",
  ];
  return parts.join("\n");
}

type RenderedEmail = { subject: string; html: string; text: string };

// ---------------------------------------------------------------------------
// 1. Applicant confirmation — on submit, to the applicant. No dynamic fields.
//    No CTA button — deliberate; there is nothing for the applicant to do.
// ---------------------------------------------------------------------------
export function renderApplicantConfirmation(): RenderedEmail {
  const bodyHtml =
    p("Your application is in. Every application is read by a person, usually within a few days.") +
    p(
      "There’s nothing you need to do in the meantime. When there’s news, it comes from this address.",
      { last: true }
    );

  return {
    subject: "We’ve got your application.",
    html: layout({
      kicker: "Membership",
      headline: "We’ve got your application.",
      bodyHtml,
    }),
    text: textLayout({
      headline: "We’ve got your application.",
      lines: [
        "Your application is in. Every application is read by a person, usually within a few days.",
        "There’s nothing you need to do in the meantime. When there’s news, it comes from this address.",
      ],
    }),
  };
}

export async function sendApplicantConfirmation({
  to,
}: {
  to: string;
}): Promise<void> {
  const email = renderApplicantConfirmation();
  await resend.emails.send({
    from: APPLICATIONS_FROM,
    to,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
}

// ---------------------------------------------------------------------------
// 2. Reviewer ping — on submit, to info@. Internal + functional, not brand
//    copy. Gets the shared header/footer for consistency, but the action block
//    is load-bearing and stays exactly as it was: the exact commands so review
//    is two clicks. Leads with the script path (which sends the welcome
//    email); raw SQL stays as the no-email fallback.
// ---------------------------------------------------------------------------
export function renderReviewerPing({
  applicantName,
  email,
  neighborhood,
  occupation,
  about,
  sponsorReference,
  applicationId,
}: {
  applicantName: string;
  email: string;
  neighborhood: string;
  occupation: string;
  about: string;
  sponsorReference: string | null;
  applicationId: string;
}): RenderedEmail {
  const aboutHtml = esc(about).replace(/\n/g, "<br/>");
  const mono = `font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;color:${INK};`;
  const label = `margin:0 0 6px;font-family:${SANS};font-size:12px;color:#6b665c;`;

  const bodyHtml = `
    ${p(`<strong>${esc(applicantName)}</strong> just applied for membership.`)}
    ${p(`<strong>Neighborhood:</strong> ${esc(neighborhood)}`)}
    ${p(`<strong>Occupation:</strong> ${esc(occupation)}`)}
    ${p(`<strong>Email:</strong> ${esc(email)}`)}
    ${p(`<strong>Brought in by:</strong> ${sponsorReference ? esc(sponsorReference) : "—"}`)}
    ${p("<strong>In their words:</strong>")}
    ${quote(aboutHtml)}
    <div style="border-top:1px solid ${HAIR};margin:24px 0;line-height:1px;font-size:1px;">&nbsp;</div>
    <p style="${label}">To approve (sends the welcome email):</p>
    <p style="margin:0 0 18px;${mono}">npm run approve -- ${esc(applicationId)}</p>
    <p style="${label}">Or, no email:</p>
    <p style="margin:0 0 18px;${mono}">select public.approve_application('${esc(applicationId)}');</p>
    <p style="${label}">To decline:</p>
    <p style="margin:0;${mono}">select public.decline_application('${esc(applicationId)}', 'optional note');</p>`;

  return {
    subject: `New membership application — ${applicantName}`,
    html: layout({ kicker: "Internal &middot; Application review", bodyHtml }),
    text: textLayout({
      lines: [
        `${applicantName} just applied for membership.`,
        `Neighborhood: ${neighborhood}`,
        `Occupation: ${occupation}`,
        `Email: ${email}`,
        `Brought in by: ${sponsorReference ?? "—"}`,
        `In their words: ${about}`,
        `To approve (sends the welcome email): npm run approve -- ${applicationId}`,
        `Or, no email: select public.approve_application('${applicationId}');`,
        `To decline: select public.decline_application('${applicationId}', 'optional note');`,
      ],
    }),
  };
}

export async function sendReviewerPing(args: {
  applicantName: string;
  email: string;
  neighborhood: string;
  occupation: string;
  about: string;
  sponsorReference: string | null;
  applicationId: string;
}): Promise<void> {
  const email = renderReviewerPing(args);
  await resend.emails.send({
    from: APPLICATIONS_FROM,
    to: REVIEWER_TO,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
}

// ---------------------------------------------------------------------------
// 3. Member welcome — on approval, to the new member. The brand moment.
//    No dynamic fields; the cold "You're in." open is the point. One CTA.
// ---------------------------------------------------------------------------
export function renderMemberWelcome(): RenderedEmail {
  const bodyHtml =
    p(
      "Your application was approved, and the name of the member who vouched for you now stands next to yours. You can post listings, message members, and vouch for someone yourself when the time comes."
    ) + p("Welcome to the network.", { last: true });

  const cta = { label: "Browse the network", href: "https://manhattanite.com/listings" };

  return {
    subject: "You’re in.",
    html: layout({
      kicker: "Membership",
      headline: "You’re in.",
      bodyHtml,
      cta,
    }),
    text: textLayout({
      headline: "You’re in.",
      lines: [
        "Your application was approved, and the name of the member who vouched for you now stands next to yours. You can post listings, message members, and vouch for someone yourself when the time comes.",
        "Welcome to the network.",
      ],
      cta,
    }),
  };
}

export async function sendMemberWelcome({ to }: { to: string }): Promise<void> {
  const email = renderMemberWelcome();
  await resend.emails.send({
    from: APPLICATIONS_FROM,
    to,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
}

// ---------------------------------------------------------------------------
// 3b. Member invite — a member bringing someone in, sent to the invitee. The
//     cold-start growth path: the invitee clicks through to /join/[token],
//     signs up, and lands in review pre-vouched by the inviter.
// ---------------------------------------------------------------------------
export function renderInviteEmail({
  inviterName,
  inviteeName,
  token,
}: {
  inviterName: string;
  inviteeName: string | null;
  token: string;
}): RenderedEmail {
  const greeting = inviteeName ? `Hi ${esc(inviteeName)},` : "Hi,";
  const joinUrl = `https://manhattanite.com/join/${token}`;
  const cta = { label: "Accept your invitation", href: joinUrl };

  const bodyHtml =
    p(greeting) +
    p(
      `<strong>${esc(inviterName)}</strong> would like to bring you into Manhattanite — a private marketplace for New Yorkers, where everyone is brought in by someone who already belongs.`
    ) +
    p(`${esc(inviterName)} is your way in.`, {
      last: true,
    });

  return {
    subject: `${inviterName} invited you to Manhattanite`,
    html: layout({ kicker: "Membership", bodyHtml, cta }),
    text: textLayout({
      lines: [
        inviteeName ? `Hi ${inviteeName},` : "Hi,",
        `${inviterName} would like to bring you into Manhattanite — a private marketplace for New Yorkers, where everyone is brought in by someone who already belongs.`,
        `${inviterName} is your way in.`,
      ],
      cta,
    }),
  };
}

export async function sendInviteEmail({
  to,
  inviterName,
  inviteeName,
  token,
}: {
  to: string;
  inviterName: string;
  inviteeName: string | null;
  token: string;
}): Promise<void> {
  const email = renderInviteEmail({ inviterName, inviteeName, token });
  await resend.emails.send({
    from: APPLICATIONS_FROM,
    to,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
}

// ---------------------------------------------------------------------------
// 3c. Sponsorship request — an applicant named this member as a vouch. Sent to
//     the member, who confirms or declines on the linked page (NOT a one-click
//     link in the body: mail clients pre-fetch links, so the action lives behind
//     an explicit button on the page). The founder still gives final approval.
// ---------------------------------------------------------------------------
export function renderSponsorshipRequest({
  sponsorName,
  requesterName,
  token,
}: {
  sponsorName: string | null;
  requesterName: string;
  token: string;
}): RenderedEmail {
  const greeting = sponsorName ? `Hi ${esc(sponsorName)},` : "Hi,";
  const reviewUrl = `https://manhattanite.com/sponsor-request/${token}`;
  const cta = { label: "Review the request", href: reviewUrl };

  const bodyHtml =
    p(greeting) +
    p(
      `<strong>${esc(requesterName)}</strong> is applying to join Manhattanite and named you as someone who would vouch for them.`
    ) +
    p(
      "If you know them and you're happy to vouch for them, confirm it below. If not, you can decline — they won't be told who declined.",
      { last: true }
    );

  return {
    subject: `${requesterName} asked you to vouch for them`,
    html: layout({ kicker: "Membership", bodyHtml, cta }),
    text: textLayout({
      lines: [
        sponsorName ? `Hi ${sponsorName},` : "Hi,",
        `${requesterName} is applying to join Manhattanite and named you as someone who would vouch for them.`,
        "If you know them and you're happy to vouch for them, confirm it below. If not, you can decline — they won't be told who declined.",
      ],
      cta,
    }),
  };
}

export async function sendSponsorshipRequest({
  to,
  sponsorName,
  requesterName,
  token,
}: {
  to: string;
  sponsorName: string | null;
  requesterName: string;
  token: string;
}): Promise<void> {
  const email = renderSponsorshipRequest({ sponsorName, requesterName, token });
  await resend.emails.send({
    from: APPLICATIONS_FROM,
    to,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
}

// ---------------------------------------------------------------------------
// 4. Listing contact — a member reaching out to a lister, sent to the lister.
//    Reply-To is set to the SENDER's address: this is what realizes "the lister
//    chooses whether to reply directly" — they just hit reply and it reaches the
//    member, not Manhattanite. The CTA is a mailto: to the same address for the
//    lister who'd rather compose fresh. Best-effort like the rest; the contact
//    row is already logged before this is called, so a mail failure never
//    loses it.
// ---------------------------------------------------------------------------
export function renderListingContact({
  senderName,
  senderNeighborhood,
  senderEmail,
  message,
  listingTitle,
}: {
  senderName: string | null;
  senderNeighborhood: string | null;
  senderEmail: string;
  message: string;
  listingTitle: string;
}): RenderedEmail {
  const sender = senderName ?? "A member";
  const firstName = senderName?.trim().split(/\s+/)[0] ?? null;
  const messageHtml = esc(message).replace(/\n/g, "<br/>");
  const neighborhoodHtml = senderNeighborhood ? ` (${esc(senderNeighborhood)})` : "";
  const mailto = `mailto:${senderEmail}?subject=${encodeURIComponent(`Re: ${listingTitle}`)}`;
  const cta = { label: firstName ? `Reply to ${firstName}` : "Reply", href: mailto };

  const bodyHtml =
    p(
      `<strong>${esc(sender)}</strong>${neighborhoodHtml} wrote to you about <em>${esc(listingTitle)}</em>:`
    ) +
    quote(messageHtml) +
    p(`Replies go straight to ${firstName ? esc(firstName) : "them"}.`, { muted: true, last: true });

  return {
    subject: "Someone has messaged you.",
    html: layout({
      kicker: `Your listing &middot; ${esc(listingTitle)}`,
      headline: "Someone has messaged you.",
      bodyHtml,
      cta,
    }),
    text: textLayout({
      headline: "Someone has messaged you.",
      lines: [
        `${sender}${senderNeighborhood ? ` (${senderNeighborhood})` : ""} wrote to you about ${listingTitle}:`,
        `“${message}”`,
        `Replies go straight to ${firstName ?? "them"}.`,
      ],
      cta,
    }),
  };
}

export async function sendListingContact({
  to,
  senderName,
  senderNeighborhood,
  senderEmail,
  message,
  listingTitle,
}: {
  to: string;
  listerName: string | null;
  senderName: string | null;
  senderNeighborhood: string | null;
  senderEmail: string;
  message: string;
  listingTitle: string;
  listingId: string;
}): Promise<void> {
  const email = renderListingContact({
    senderName,
    senderNeighborhood,
    senderEmail,
    message,
    listingTitle,
  });

  await resend.emails.send({
    from: APPLICATIONS_FROM,
    to,
    replyTo: senderEmail,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
}

// ---------------------------------------------------------------------------
// 5–7. Listing moderation — the three review outcomes, sent to the lister.
//      Best-effort like the rest: lib/admin/moderate.ts wraps each call in its
//      own try/catch AFTER the rpc succeeds, so a mail failure never undoes or
//      masks a completed review. These close the loop the /listings/new
//      confirmation opens ("We'll email you once we've taken a look").
//      Same v12 bones; copy unchanged from the moderation slice.
// ---------------------------------------------------------------------------

// 5. Approved — the listing is live. The good news stays short.
export function renderListingApproved({
  listerName,
  listingTitle,
  listingId,
}: {
  listerName: string | null;
  listingTitle: string;
  listingId: string;
}): RenderedEmail {
  const greeting = listerName ? `Hi ${esc(listerName)},` : "Hi,";
  const listingUrl = `https://manhattanite.com/listings/${listingId}`;
  const cta = { label: "See your listing", href: listingUrl };

  const bodyHtml =
    p(greeting) +
    p(`<em>${esc(listingTitle)}</em> is live. Every member can see it now.`) +
    p(
      "Listings move quickly — when someone messages you, they're already interested. Reply through your inbox and deal plainly.",
      { last: true }
    );

  return {
    subject: "Your listing is live.",
    html: layout({ kicker: `Your listing &middot; ${esc(listingTitle)}`, bodyHtml, cta }),
    text: textLayout({
      lines: [
        listerName ? `Hi ${listerName},` : "Hi,",
        `${listingTitle} is live. Every member can see it now.`,
        "Listings move quickly — when someone messages you, they're already interested. Reply through your inbox and deal plainly.",
      ],
      cta,
    }),
  };
}

export async function sendListingApproved({
  to,
  listerName,
  listingTitle,
  listingId,
}: {
  to: string;
  listerName: string | null;
  listingTitle: string;
  listingId: string;
}): Promise<void> {
  const email = renderListingApproved({ listerName, listingTitle, listingId });
  await resend.emails.send({
    from: APPLICATIONS_FROM,
    to,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
}

// 6. Returned — needs changes before it goes up. The note is the substance;
//    the next step (edit, resubmit) is the one clear action.
export function renderListingReturned({
  listerName,
  listingTitle,
  note,
}: {
  listerName: string | null;
  listingTitle: string;
  note: string;
}): RenderedEmail {
  const greeting = listerName ? `Hi ${esc(listerName)},` : "Hi,";
  const noteHtml = esc(note).replace(/\n/g, "<br/>");
  const cta = { label: "My listings", href: "https://manhattanite.com/listings/mine" };

  const bodyHtml =
    p(greeting) +
    p(`We've read <em>${esc(listingTitle)}</em> and it's not quite ready to go up. Specifically:`) +
    quote(noteHtml) +
    p("Make the changes and resubmit from My Listings — it comes straight back to us.", {
      last: true,
    });

  return {
    subject: "A note on your listing.",
    html: layout({ kicker: `Your listing &middot; ${esc(listingTitle)}`, bodyHtml, cta }),
    text: textLayout({
      lines: [
        listerName ? `Hi ${listerName},` : "Hi,",
        `We've read ${listingTitle} and it's not quite ready to go up. Specifically: ${note}`,
        "Make the changes and resubmit from My Listings — it comes straight back to us.",
      ],
      cta,
    }),
  };
}

export async function sendListingReturned({
  to,
  listerName,
  listingTitle,
  note,
}: {
  to: string;
  listerName: string | null;
  listingTitle: string;
  note: string;
}): Promise<void> {
  const email = renderListingReturned({ listerName, listingTitle, note });
  await resend.emails.send({
    from: APPLICATIONS_FROM,
    to,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
}

// 7. Rejected — it won't be carried. Gracious, firm, no over-apologizing
//    (the voice-and-copy.md "Removed listing" register). Covers both a
//    pending listing that never went up and a live one taken down.
export function renderListingRejected({
  listerName,
  listingTitle,
  note,
}: {
  listerName: string | null;
  listingTitle: string;
  note: string;
}): RenderedEmail {
  const greeting = listerName ? `Hi ${esc(listerName)},` : "Hi,";
  const noteHtml = esc(note).replace(/\n/g, "<br/>");
  const cta = { label: "My listings", href: "https://manhattanite.com/listings/mine" };

  const bodyHtml =
    p(greeting) +
    p(`We can't carry <em>${esc(listingTitle)}</em> on the network. Specifically:`) +
    quote(noteHtml) +
    p("We're strict because every member trusts us to keep the bar high. We hope you understand.") +
    p("You're welcome to post it fresh once you've addressed the feedback.", { last: true });

  return {
    subject: "About your listing.",
    html: layout({ kicker: `Your listing &middot; ${esc(listingTitle)}`, bodyHtml, cta }),
    text: textLayout({
      lines: [
        listerName ? `Hi ${listerName},` : "Hi,",
        `We can't carry ${listingTitle} on the network. Specifically: ${note}`,
        "We're strict because every member trusts us to keep the bar high. We hope you understand.",
        "You're welcome to post it fresh once you've addressed the feedback.",
      ],
      cta,
    }),
  };
}

export async function sendListingRejected({
  to,
  listerName,
  listingTitle,
  note,
}: {
  to: string;
  listerName: string | null;
  listingTitle: string;
  note: string;
}): Promise<void> {
  const email = renderListingRejected({ listerName, listingTitle, note });
  await resend.emails.send({
    from: APPLICATIONS_FROM,
    to,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
}
