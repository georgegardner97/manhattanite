// Membership emails — Phase 2 Slice C.
//
// Three sends, all through Resend (domain already verified). Copy is lifted
// verbatim from outputs/Manhattanite_Apply-Emails_v1.md — American spelling,
// Soho House register, no generic transactional chrome. The HTML is simple and
// inline-styled on purpose: these are short, editorial notes, and a heavy
// template would fight the voice.
//
// Every function is best-effort and returns void — callers wrap each call in
// its own try/catch so a mail failure never breaks the underlying action (the
// saved application, the completed approval).

import { Resend } from "resend";

// One client for the module. RESEND_API_KEY is read at import time; in the
// CLI approve path it comes from `node --env-file=.env.local`.
const resend = new Resend(process.env.RESEND_API_KEY);

const APPLICATIONS_FROM = "Manhattanite <applications@manhattanite.com>";
const REVIEWER_TO = "info@manhattanite.com";

// Shared editorial shell. Keeps every send visually consistent without a
// templating dependency. `inner` is trusted HTML assembled by the callers below.
function shell(inner: string): string {
  return `
  <div style="margin:0;padding:32px 0;background:#ffffff;">
    <div style="max-width:520px;margin:0 auto;padding:0 24px;font-family:Georgia,'Times New Roman',serif;color:#1a1a1a;font-size:17px;line-height:1.65;">
      ${inner}
      <p style="margin:40px 0 0;font-size:13px;letter-spacing:0.18em;text-transform:uppercase;color:#8a8a8a;">— Manhattanite</p>
    </div>
  </div>`;
}

// ---------------------------------------------------------------------------
// 1. Applicant confirmation — on submit, to the applicant. No dynamic fields.
// ---------------------------------------------------------------------------
export async function sendApplicantConfirmation({
  to,
}: {
  to: string;
}): Promise<void> {
  const inner = `
    <p style="margin:0 0 20px;">Thanks for applying.</p>
    <p style="margin:0 0 20px;">We read every application personally, which means it'll take a few days. We'll be in touch either way.</p>
    <p style="margin:0;">In the meantime, if you know a member of Manhattanite who'd vouch for you, ask them to send a note. Sponsored applications move faster.</p>`;

  await resend.emails.send({
    from: APPLICATIONS_FROM,
    to,
    subject: "We've got your application.",
    html: shell(inner),
  });
}

// ---------------------------------------------------------------------------
// 2. Reviewer ping — on submit, to info@. Internal + functional, not brand
//    copy. The action block embeds the exact commands so review is two clicks.
//    Leads with the script path (which sends the welcome email); raw SQL stays
//    as the no-email fallback.
// ---------------------------------------------------------------------------
export async function sendReviewerPing({
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
}): Promise<void> {
  const aboutHtml = about.replace(/\n/g, "<br/>");

  const inner = `
    <p style="margin:0 0 24px;"><strong>${applicantName}</strong> just applied for membership.</p>
    <p style="margin:0 0 6px;"><strong>Neighborhood:</strong> ${neighborhood}</p>
    <p style="margin:0 0 6px;"><strong>Occupation:</strong> ${occupation}</p>
    <p style="margin:0 0 6px;"><strong>Email:</strong> ${email}</p>
    <p style="margin:0 0 24px;"><strong>Brought in by:</strong> ${sponsorReference ?? "—"}</p>
    <p style="margin:0 0 6px;"><strong>In their words:</strong></p>
    <p style="margin:0 0 28px;">${aboutHtml}</p>
    <hr style="border:none;border-top:1px solid #e2e2e2;margin:0 0 24px;" />
    <p style="margin:0 0 6px;font-size:14px;color:#555;">To approve (sends the welcome email):</p>
    <p style="margin:0 0 18px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:14px;color:#1a1a1a;">npm run approve -- ${applicationId}</p>
    <p style="margin:0 0 6px;font-size:14px;color:#555;">Or, no email:</p>
    <p style="margin:0 0 18px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:14px;color:#1a1a1a;">select public.approve_application('${applicationId}');</p>
    <p style="margin:0 0 6px;font-size:14px;color:#555;">To decline:</p>
    <p style="margin:0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:14px;color:#1a1a1a;">select public.decline_application('${applicationId}', 'optional note');</p>`;

  await resend.emails.send({
    from: APPLICATIONS_FROM,
    to: REVIEWER_TO,
    subject: `New membership application — ${applicantName}`,
    html: shell(inner),
  });
}

// ---------------------------------------------------------------------------
// 3. Member welcome — on approval, to the new member. The brand moment.
//    No dynamic fields; the cold "You're in." open is the point.
// ---------------------------------------------------------------------------
export async function sendMemberWelcome({ to }: { to: string }): Promise<void> {
  const inner = `
    <p style="margin:0 0 20px;font-size:22px;">You're in.</p>
    <p style="margin:0 0 20px;">Welcome to Manhattanite. Your account is active and you can start browsing now.</p>
    <p style="margin:0 0 20px;">A few things worth knowing:</p>
    <p style="margin:0 0 16px;"><strong>You can sponsor others.</strong> Bring in people you'd want to live next to. Sponsorship is public, and it counts.</p>
    <p style="margin:0 0 16px;"><strong>Listings move quickly.</strong> Especially apartments. If you see something you like, message the poster through the site.</p>
    <p style="margin:0 0 28px;"><strong>Quality matters more than quantity.</strong> If you post a listing, make it worth a member's time.</p>
    <p style="margin:0;"><a href="https://manhattanite.com/listings" style="color:#1a1a1a;text-decoration:none;border-bottom:1px solid #1a1a1a;font-size:13px;letter-spacing:0.18em;text-transform:uppercase;">Browse listings &rarr;</a></p>`;

  await resend.emails.send({
    from: APPLICATIONS_FROM,
    to,
    subject: "You're in.",
    html: shell(inner),
  });
}

// ---------------------------------------------------------------------------
// 4. Listing contact — a member reaching out to a lister, sent to the lister.
//    Reply-To is set to the SENDER's address: this is what realizes "the lister
//    chooses whether to reply directly" — they just hit reply and it reaches the
//    member, not Manhattanite. Best-effort like the rest; the contact row is
//    already logged before this is called, so a mail failure never loses it.
// ---------------------------------------------------------------------------
export async function sendListingContact({
  to,
  listerName,
  senderName,
  senderEmail,
  message,
  listingTitle,
  listingId,
}: {
  to: string;
  listerName: string | null;
  senderName: string | null;
  senderEmail: string;
  message: string;
  listingTitle: string;
  listingId: string;
}): Promise<void> {
  const greeting = listerName ? `Hi ${listerName},` : "Hi,";
  const sender = senderName ?? "A member";
  const messageHtml = message.replace(/\n/g, "<br/>");
  const listingUrl = `https://manhattanite.com/listings/${listingId}`;

  const inner = `
    <p style="margin:0 0 20px;">${greeting}</p>
    <p style="margin:0 0 20px;"><strong>${sender}</strong> is interested in your listing, <em>${listingTitle}</em>.</p>
    <p style="margin:0 0 24px;">${messageHtml}</p>
    <hr style="border:none;border-top:1px solid #e2e2e2;margin:0 0 24px;" />
    <p style="margin:0 0 20px;font-size:15px;color:#555;">Reply to this email to reach them directly.</p>
    <p style="margin:0;"><a href="${listingUrl}" style="color:#1a1a1a;text-decoration:none;border-bottom:1px solid #1a1a1a;font-size:13px;letter-spacing:0.18em;text-transform:uppercase;">See your listing &rarr;</a></p>`;

  await resend.emails.send({
    from: APPLICATIONS_FROM,
    to,
    replyTo: senderEmail,
    subject: `Someone's interested in your listing — ${listingTitle}`,
    html: shell(inner),
  });
}
