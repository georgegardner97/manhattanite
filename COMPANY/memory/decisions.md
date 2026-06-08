# Manhattanite — Decisions Log

Distilled list of strategic decisions. Quick-reference for grounding any new work. For full session context, see `session-log.md`.

Read this at the start of every Manhattanite conversation.

---

## Product

- **Categories at launch:** Apartments + Furniture. (2026-05-16)
- **Jobs:** Added in v2, not v1. Maybe shown as "coming soon" in v1, framed not as waitlist. (2026-05-16)
- **Seed MVP:** Pre-launch MVP is populated with clearly-labeled *example* listings and example members for advisor and founding-member conversations. Wiped before public launch. (2026-05-16)
- **Account creation in the MVP is real, not example.** Visitors can genuinely apply for membership; George reviews each application. The application flow is live from day one. Only the listings are example data. (2026-05-16)
- **Two-tier access model.** Tier 1 = Account (free, no review, view-only). Tier 2 = Member (application + approval, can post/contact/sponsor). The interaction wall, not the viewing wall, is where trust is enforced. This is the core product mechanic. (2026-05-16)
- **Contact form, not in-platform messaging in v1.** Members initiate contact via a form on the listing that forwards to email. No in-product inbox until v2. (2026-05-16)

## Trust mechanic

- **Working name:** Gens de Confiance Lite. (2026-05-16)
- **Seed / MVP phase:** Open application path. Anyone visiting the site can apply for membership via real account creation. George reviews each application personally and approves or declines. Approved applicants are technically "sponsored by George." (2026-05-16)
- **Post-launch:** Sponsor-only becomes the primary path. One existing member vouches and is publicly named on the new member's profile. Application path may quietly remain or be removed depending on what we learn during MVP. (2026-05-16)
- **No "waiting list" framing.** The terminology is "apply for membership" — confident, member-facing, Soho House-style. Not waitlist, not signup, not registration. (2026-05-16)
- **Primary reviewer at start:** George. Until other members start sponsoring at volume, every approved member is functionally sponsored by him. (2026-05-16)

## Timeline

- **MVP target:** End of August 2026 (~14 weeks from 2026-05-16). (2026-05-16)
- **MVP intent:** Show-able working product, not publicly launched. (2026-05-16)

## Tech

- **Direction:** Coded MVP, not no-code. Built with Claude Code. (2026-05-16)
- **Stack confirmed:** Next.js (App Router) + Vercel + Supabase + Resend + Cloudflare (DNS + registrar) + Plausible + Sentry + GitHub. Stripe in v2 only. (2026-05-16, confirmed)
- **Auth:** ~~Email + magic link via Supabase Auth. No passwords. (2026-05-16, confirmed)~~ **Revised 2026-05-27 → Email + password** (with forgot-password reset flow), via Supabase Auth. George's call, framed as "for now" / revisitable. Trade-off acknowledged: passwords add a reset flow to build + ongoing lockout-support burden that magic link avoided. To be implemented in Phase 1 Slice 2.
- **Listings schema:** Single `listings` table with `type` enum + JSON `details` column for type-specific fields. Simpler than two tables, more flexible than rigid columns. (2026-05-16, confirmed)
- **Sponsorships are their own table** (not just an FK on accounts) so accountability state and history can be queried cleanly. (2026-05-16, confirmed)
- **Row-Level Security on every member-only table** is the security primitive of the two-tier model. Non-negotiable. (2026-05-16, confirmed)
- **Roles:** account / member / admin only. No role explosion. (2026-05-16, confirmed)
- **Listing photo cap:** ~~8 per listing. Tunable. (2026-05-16, confirmed)~~ **Revised 2026-06-04 → 6 per listing.** Tight enough to push posters toward their best shots, generous enough for apartment sets. Enforced in three places: client uploader, server action, and a Postgres CHECK on `listings.images`. Shipped in Phase 3 Slice 6.
- **Listing image storage:** Private Supabase Storage bucket (`listing-images`), 5 MB per file, MIME-restricted to JPEG/PNG/WebP. Images surfaced to the browser via short-lived signed URLs (1h) minted server-side using the viewer's session — so the Tier 0 → Tier 1 read wall is real on pixels the same way it's real on rows. A public bucket would have let anyone with a direct image URL bypass the read gate; trust mechanic is the product, so the wall has to be real everywhere. (2026-06-04, Phase 3 Slice 6)
- **Image storage RLS:** Upload restricted to members, into a folder whose first segment is the user's own `auth.uid()` (path = `{user_id}/{uuid}.{ext}`). Read open to any signed-in user (mirrors `listings_read_published_for_accounts`). Delete restricted to the uploader. Same `is_member()` SECURITY DEFINER helper as the listings policy — never subquery `public.accounts` from inside a policy. (2026-06-04, Phase 3 Slice 6)
- **Cross-member display via denormalization, not RLS or views.** Other members' names need to appear on listings (author + sponsor bylines), but the `accounts` read-own RLS hides them. Three options considered: (a) a SELECT RLS policy that opens reads — rejected because RLS is row-level, not column-level, so email/role/bio would leak; (b) a `SECURITY DEFINER` view exposing only safe columns — rejected because PostgREST embedded-select syntax doesn't traverse view-to-view joins cleanly (no FK metadata on views); (c) **denormalize `author_name` + `sponsor_name` onto `listings`**, populated by a `BEFORE INSERT` trigger and kept fresh by an `AFTER UPDATE` trigger on `accounts` (name + sponsor_id propagation). Picked (c) — lowest-friction pattern, keeps the trust mechanic intact, keeps reads to a single table. Trade-off: an accounts rename does up to 3 follow-on UPDATEs on listings; trivial at MVP scale, bounded by member reach at scale. Same pattern is the template for any future cross-member display field. (2026-06-04, Phase 4 Slice 1)
- **Backups:** Supabase free tier (7-day daily) at MVP, upgrade to Pro ($25/mo, 30-day + PITR) at Cohort 1. (2026-05-16, confirmed)
- **No staging environment in v1.** Vercel previews + production only. (2026-05-16, confirmed)
- **v1 OUT (cuts to protect timeline):** In-platform messaging, search filters, payments, native mobile app. Web-first responsive only. (2026-05-16)
- **Monthly cost at MVP:** ~$10/month all-in. Domain (~$1 amortized) + Plausible ($9). Everything else free tier. (2026-05-16, confirmed)

## Brand

- **Byline name format: GdC-style full first + last.** "Listed by George Gardner · sponsored by Sarah Chen" — not "George G." (Vinted-style) and not "George" (first-name-only). Decided 2026-06-04 after reviewing how Gens de Confiance handles it (full name required, no pseudonyms or initials, "members agree that their first name, last name, and profile photo will be visible to others"). The full-name convention is the visible side of being vouched for — trust-by-identity, matches the Soho House / editorial brand voice. Privacy trade-off (name + neighborhood = identifiable) accepted as a deliberate brand cost. Enforced via denormalized `listings.author_name` + `listings.sponsor_name`; profile-edit UI to enforce on signup is still pending. (2026-06-04, Phase 4 Slice 1)

## Brand — legacy section header (entries below predate the Byline call above)

- **Voice anchor:** Soho House. (2026-05-16)
- **Visual reference set:** Mr. Porter, Soho House, Raya, Casa Magazines, Le Labo, The New Yorker. (2026-05-16)
- **Brand feeling:** Refined, simple, modern, cool. (2026-05-16)
- **Spelling:** American English throughout product, marketing, email, social, and support. Overrides George's personal British defaults for anything under the Manhattanite brand. (2026-05-16)
- **Wordmark + final palette:** Deferred until the first real product screens exist. Reason: hard to lock visual identity in isolation; needs context. Working defaults remain GT Sectra-style serif with italic "ite". (2026-05-16)
- **Palette direction:** Working base is black + cream (Lampblack + Paper). Brick demoted from primary accent to reserve. Open to revisiting Brick in context or replacing it. (2026-05-16)
- **Tagline (placeholder):** *New York's trusted private marketplace.* Used everywhere until revisited. (2026-05-16)
- **"Apply for membership"** is the canonical verb for joining. Never "sign up," "register," or "waitlist." (2026-05-16)

## Go-to-market

- **No paid ads, ever.** Growth is referral-led and curated. (2026-05-16)
- **Three phases:** Seed (0–20, founder-led), Cohort 1 (20–80, sponsor-led), Cohort 2 (80–200, light public surface). (2026-05-16)
- **Public marketing surface delayed until Cohort 2.** Goes live with cohort 2 expansion, not before. (2026-05-16)
- **No Twitter/X, no TikTok.** Instagram + email + word of mouth. Substack optional. (2026-05-16)
- **Monetization:** Free until end of Cohort 2 / start of Cohort 3, then pay-per-post via Stripe. Free to browse, free to sponsor, free to be a member. (2026-05-16, default pending confirm)

## Trust and moderation

- **Approvals are judgments, not checklists.** Application criteria are tilts, not requirements, except for the automatic-decline list. (2026-05-16)
- **Sponsor accountability is graded:** Good standing → Watch → Probation → Removed. Granular ladder, not binary. (2026-05-16)
- **Banned for life.** Once removed, no reapplication. (2026-05-16, confirmed)
- **Application response SLA:** Under 48 hours average, 72 hours max. (2026-05-16)
- **Listing moderation:** Every listing reviewed manually by George at MVP. 24-hour SLA in seed, 12-hour SLA in Cohort 1. (2026-05-16)
- **No broker apartment listings.** Peer-to-peer only. (2026-05-16, confirmed)
- **Sponsor accountability ladder is graded (Good standing → Watch → Probation → Removed).** Not binary. (2026-05-16, confirmed)
- **Founder identity exposure at seed:** George's name on emails, "Manhattanite team" introduced once a co-reviewer exists. (2026-05-16, confirmed)
- **Lawyer engagement target:** 4–6 weeks from 2026-05-16 (by end of June 2026). (2026-05-16, confirmed)
- **Sponsor visibility is permanent and public.** Every member's profile shows who they sponsored and who sponsored them. Social cost is the mechanism. (2026-05-16)

## Strategy synthesis (2026-05-17 reconciliation with prior STRATEGY.md)

After discovering that `~/Developer/manhattanite/` contained a substantial 26KB STRATEGY.md from 2026-05-06 with deeper strategic work than was visible at the start of this project, the two strategy streams were reconciled. The synthesized position now holds:

- **Trust mechanic at MVP:** binary two-tier (Account / Member) as planned. **v2 direction:** evolve toward a graded trust-score system with multiple membership tiers (Explorer / Verified / Trusted / Connector). The binary version is what ships in 14 weeks; the score version is the longer-term target. (2026-05-17, confirmed)
- **Launch categories:** stick with two — Apartments + Furniture. Jobs added in v1.5 (~Q4 2026). Services after that. (2026-05-17, confirmed)
- **Monetization:** simple pay-per-post only. No paid membership tiers, no business-account upsell. Free membership forever; only revenue is per-listing fees in v2. Keep it simple. (2026-05-17, confirmed — overrides earlier consideration of $99-499/mo business accounts)
- **Brand tone:** **utility-first, dressed in aesthetic vocabulary.** Trust is the product, not coolness. Take the older strategy's anti-clout / "invite-worthy because useful" positioning and execute it in the Soho House / editorial voice from the COMPANY/ brand-guide. The product *does* useful things; it just *looks* like a Soho House email. Reject pure status-positioning. (2026-05-17, confirmed)
- **Database:** Supabase as the primary marketplace database (per tech-architecture.md). **Airtable retained** during seed phase as George's manual application-review tool — applications flow into both. Sunset Airtable when the in-product admin review UI is built (v1.5 or v2). (2026-05-17, confirmed)
- **Build foundation:** Use `~/Developer/manhattanite/` (existing project with working code + integrations + git history) as the build repo. Move COMPANY/ docs into it. `~/Projects/manhattanite/` (today's clean shell) is being archived/deleted. (2026-05-17, confirmed)

## Legal posture

- **Seed-phase posture is private + non-transactional**, which reduces but does not eliminate legal exposure. (2026-05-16)
- **Legal-and-policy.md is a working map of open questions, not advice.** Every section is open until counsel is engaged. (2026-05-16)
- **First move:** Find a NY startup attorney within 4–6 weeks. Tier 1 items (entity, TOS, privacy) must resolve before MVP goes live. (2026-05-16)
- **NYC fair-housing law is the largest unaddressed regulatory question.** Specialist input may be needed. (2026-05-16)

## Folder structure (2026-05-17 evening — collapse to single folder)

After completing the Phase 0 migration of strategy docs into `~/Developer/manhattanite/docs/`, George surfaced the natural confusion of having two parallel "Manhattanite" folders (Desktop = CoWork workspace, Developer = build repo) and pushed back on the "two-folder, sync when needed" answer. Decided to collapse them.

- **Single Mac folder for everything:** `~/Developer/manhattanite/` becomes both the build repo AND the Cowork workspace. (2026-05-17, confirmed)
- **Cowork OS folders live at the root** of the unified folder (`ABOUT ME/`, `RESOURCES/`, `COMPANY/`, `WORK AREAS/`), alongside the Next.js code files (`app/`, `package.json`, etc.). Yes, the root gets visually busy, but CoWork OS expects this structure at the workspace root. (2026-05-17, confirmed)
- **`docs/` folder eliminated.** It was a stopgap from the Projects/manhattanite phase. With the workspace folders promoted to root, `docs/` is redundant. Delete it. (2026-05-17, confirmed)
- **`ABOUT ME/` is gitignored.** Personal data stays local, not pushed to GitHub (even though the repo is private). (2026-05-17, confirmed)
- **Other Cowork folders (COMPANY, RESOURCES, WORK AREAS) are committed.** They're project-relevant and benefit from version history. (2026-05-17, confirmed)
- **Two CLAUDE.md files merged into one.** The unified CLAUDE.md has the CoWork OS reading protocol at the top (so future Cowork sessions know to read ABOUT ME, COMPANY, etc.) and the Manhattanite project context underneath (synthesized strategy, architectural anchors, etc.). One file serves both Cowork and Claude Code. (2026-05-17, confirmed)
- **Cowork's mounted workspace switched from `~/Desktop/Manhattanite/` to `~/Developer/manhattanite/`.** (2026-05-17, confirmed)
- **`~/Desktop/Manhattanite/` archived to Trash** once the new unified folder is verified working in both Cowork and Claude Code. (2026-05-17, confirmed)

## Landing-page direction (2026-05-18)

- **Current waitlist page (`app/page.tsx`) is misaligned with the trust-first / utility-leading direction.** Its structural hierarchy (membership-first hero, manifesto second, no visible utility) reads Raya, not Gens de Confiance. The copy itself ("No scams. No junk furniture...") is on-direction; the structure is what needs reordering. (2026-05-18)
- **Decision: replace the current landing page** with a trust-first / utility-leading homepage. Swap target is NOT the gating page from `voice-and-copy.md` as literally written; it's a homepage that (a) shows what Manhattanite *does* before asking for commitment, (b) frames Account (Tier 1) as the default entry — "see what's here" — rather than "Apply for Membership," (c) surfaces the membership mechanism contextually (interaction gates) when a visitor tries to act, (d) keeps the cultivated aesthetic but serves utility, not exclusivity. (2026-05-18)
- **Sequencing: current waitlist page stays live** until Phase 1 (Tier 1 / accounts / browse) is built AND Phase 2 (example apartment listings) provides something real to show on the homepage. The replacement is the *visible deliverable* of the seed-phase MVP, not a parallel workstream that has to ship on its own track. (2026-05-18)
- **Form test on the existing waitlist page is dropped.** We are not testing the product we are replacing. Production env vars were restored for hygiene; that's sufficient. (2026-05-18)

## Design workstream

- **Begin design conversations around Phase 1 week 2–3** (~7–14 days from 2026-05-18). Decisions land in hand before Phase 2 listing UI work starts; not rushed, not over-baked before the backend can absorb them. Scope: brand application as real pages (including wordmark + palette finalization), trust-first homepage layout, listing card patterns, browse feed, listing detail, application form UI, member profile, admin review queue. (2026-05-18)
- **Claude is a design collaborator, not a substitute for a senior product designer.** Can generate options, apply brand guide rigorously, build HTML/CSS prototypes, structure the conversation. Whether to bring in a human designer later is a separate decision deferred to post-MVP. (2026-05-18)

## Personal Assistant

- **Email accounts:** Outlook = Manhattanite work. Gmail = personal. Never cross. (2026-05-16)
- **Default behaviors:** Claude can draft and label without asking. Claude must never send without asking. (2026-05-16)

## System / folder structure

- **`ABOUT ME/`** is read-only — founder identity. Cannot create or edit files there.
- **`COMPANY/`** holds all Manhattanite business reference (this folder).
- **`COMPANY/memory.md`** is the visible top-level snapshot (quick state + pointers). Read at the start of every Manhattanite conversation. (2026-05-16)
- **`COMPANY/memory/`** holds the deep memory files: `decisions.md` (this file) + `session-log.md`. Opened on demand. (2026-05-16)
- **`WORK AREAS/`** holds active project work.

## Profiles & identity photos (2026-06-08)

- **Members may have a photo on their profile page, but NO inline avatar thumbnails next to their name anywhere else.** George's call: small face thumbnails by bylines/listings would look "scrappy." Correct brand instinct — tiny circular avatars are the visual signature of consumer social platforms (Facebook, Nextdoor, Vinted) and fight the editorial Soho House / Mr Porter / Le Labo register. (2026-06-08)
- **GdC reconciliation:** GdC's real-photo rule exists for accountability *at the point of trust* — "see who I'm dealing with before I deal with them." That goal is served by a photo on the **profile**, viewable on click-through, NOT by thumbnails sprinkled across the browse grid. So keeping faces off inline bylines costs nothing on the trust model. (2026-06-08)
- **Where a photo earns its place:** (1) Profile page — real, generous, well-shot photo = the identity surface, fully GdC-faithful. (2) Listing detail — the *only* place a face might appear outside the profile (the trust-decision moment), and even then as a tasteful "about the lister" treatment, never a thumbnail. (3) Browse bylines — name only, no photo. (2026-06-08)
- **Status:** principle locked; implementation deferred to the Phase 1.5 Design Foundation / a future avatar slice. Not in the /apply build. Also a future GdC-identity note: GdC includes a profile photo as part of real-identity — adding one to profiles closes that gap when the time comes. (2026-06-08)

---

*Decisions are dated. If something here conflicts with later work, the later decision wins — but log the change rather than silently edit.*
