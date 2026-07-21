# Claude Code prompt — Phase 5: the transactional emails

*Paste everything below the line into Claude Code (repo: `~/Developer/manhattanite`, branch `main`). The last build slice of the redesign. Templates and copy only — send triggers, recipients, and logging stay exactly as they are.*

---

Restyle the transactional emails to the approved design. **The design contract is `WORK AREAS/Product/design-foundation-project/outputs/Manhattanite_Mockup_v12_Emails.html`** (George-approved, final copy included — open it and use the bottom switcher to see all three). Copy comes from the mockup verbatim, including typographic apostrophes. American spelling.

## Ground rules

- The Resend send calls, their triggers, recipients, and best-effort error handling in `lib/applications/emails.ts` (and the contact-forward send) are **untouched**. This slice changes what the emails look like and say, not when or to whom they go.
- Email HTML must be email-client-safe: table-based layout, inline styles. Max width 600px, bone `#F5F0E8` card, hairlines as 1px solid `rgba(15,14,12,.16)` borders, the boxed CTA as a bulletproof table button (1px `#0F0E0C` border, letterspaced caps).
- **Typography (George's amendment — the mark must match the site exactly):**
  1. **The wordmark is an IMAGE, not text.** Export a retina PNG of the real Instrument Serif "Manhattan*ite*." (transparent background, ink `#0F0E0C`, rendered at 2× — display ~180px wide / serve ~360px) using the same ImageResponse pipeline that renders the OG card. Host it in `public/email/` and reference it absolutely (`https://manhattanite.com/email/wordmark.png`). `alt="Manhattanite."` styled to degrade gracefully (Georgia, similar size) where images are blocked.
  2. **Headlines: Instrument Serif via `@font-face` with Georgia fallback.** Apple Mail (most of the audience) loads web fonts; Gmail falls back to Georgia. Declare the font in an embedded `<style>` block pointing at the woff2 (host it in `public/email/` too), and set headline stacks as `'Instrument Serif', Georgia, serif`. Never let the fallback break layout — size/line-height must work in both faces.
  3. Body text stays Arial/Helvetica.
- Build one shared layout helper (wordmark image header, hairline, footer with tagline + `info@manhattanite.com`) so the three emails share bones. Include a **plain-text alternative** for each send (deliverability).

## The three emails

1. **Application received** (applicant confirmation): headline "We've got your application." — body per mockup ("Your application is in. Every application is read by a person, usually within a few days." + the nothing-to-do paragraph). **No CTA button** — deliberate.
2. **Welcome** (on approval): headline "You're in." — body per mockup, ending "Welcome to the network." One CTA: **Browse the network** → `https://manhattanite.com/listings`.
3. **Contact forward** (to the lister): subject and headline "Someone has messaged you." Sender's name + neighborhood bolded, their message in the serif left-hairline pull-quote, then the line **"Replies go straight to {sender first name}."** CTA button **"Reply to {first name}"** as a `mailto:` link to the sender's address with subject `Re: {listing title}`.
   - **Verify the email's `Reply-To` header is set to the sender's address** (the contact modal already promises "can reply to you directly"). If it's already set, confirm and move on; if missing, set it — this is the one sanctioned behavior fix, it makes existing copy true.

## Also

- The **reviewer ping** email (to George, with the `npm run approve` action block) is internal — give it the shared header/footer for consistency but do NOT restyle or bury its action block; that block is load-bearing.
- Check both light and dark mail-client rendering won't invert the card illegibly (avoid pure-white text traps; test with Gmail's dark mode behavior in mind — stick to the bone card with dark text, which survives inversion best).

## Verify

1. Render each template to HTML locally and eyeball in a browser at 600px and ~360px.
2. Send ONE test of each to `info@manhattanite.com` only (George's own inbox — no other recipients), via a temporary script or the existing senders pointed at that address. Do not create accounts or applications to trigger them.
3. George checks them in Gmail (desktop + phone) before this slice is called done.
4. `npm run build` clean; commit, push. **Commit doc/memory updates to git as well** (project rule).

## Report back

Confirmation per email, the Reply-To finding (was it already set?), how the test sends were produced, and screenshots or a note on Gmail rendering.

This closes Phase 5. Remaining in the project: photography rules + brand-guide v2 (Cowork), and the final before/after re-grade.
