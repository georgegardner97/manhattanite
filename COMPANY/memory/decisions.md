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
- **Tier model refined to three viewing layers — the trust gate sits at the ACTION layer, not the VIEWING layer.** (2026-06-09, George, after the Slice C walkthrough; refines the 2026-05-16 two-tier entry and revises the listings RLS "must have an account to browse"):
  - **Visitor (logged out):** sees a *teaser* — a limited set of listings + the pitch. Job: make an account. (Previously saw nothing — RLS required login. This is the change.)
  - **Account (Tier 1):** sees *everything*, full detail, but can *act* on nothing — no contacting, posting, or sponsoring. The account is an **on-ramp / conversion step, not a destination**: its value to the user is "browse the whole catalogue," its value to the business is captured email + raised hand + the object membership attaches to. Job: apply for membership.
  - **Member (Tier 2):** contact sellers, post, sponsor (and, v2, see trust connections).
  - **Rationale:** mirrors GDC (free registration is a deliberately thin funnel tier; "browse freely, but be a member to respond/post"). Two nested hooks: teaser → want an account; full browse → want to act → worth the social cost of being sponsored. **Guardrail:** never give Tier 1 transactional power to "thicken" it — that dismantles the moat. Instead keep the teaser genuinely limited and make the copy sell the account as "the lobby, not the building." Settle before the navigation slice, since it changes what the logged-out experience contains.

- **The Classifieds system is the site, and Slice 1 of the migration has shipped to a branch.** (2026-08-18, George) Supersedes the 2026-08-18 morning read that the preview's highest value was as input to a designer's brief. Four calls settled with it:
  - **Landing bylines stay anonymous** ("Vouched by a member"), while `/listings` names everyone to the same logged-out visitor. George's explicit position is *held, not settled* — he is still undecided. Worth knowing: the landing is now `/`, so it is the page Google indexes, and reversing it is a one-function change (`anonymousMeta()` in `app/(cl)/page.tsx`).
  - **Wordmark stays Instrument Serif** against Newsreader body type — the one place the two systems touch. Reaffirms Concept D (2026-07-21) after seeing both faces on a real screen; re-cutting would have orphaned the favicon and OG card.
  - **Search and Saved move INTO v1**, reversing the mvp-spec cut. Neither widens what anyone can see: Saved is browser-local and touches no table, Search narrows the same permission-checked read. `mvp-spec.md` updated rather than left contradicting the product.
  - **Migration 0026 to be applied** (George's call, against the recommendation to leave it — nothing calls it, and the member profile works without it). Written and verified; NOT run, pending his SQL-editor pass.
- **The teaser cap is an application rule, and every read must go through one gate.** (2026-08-18, found during Slice 1 verification) The six-row guest teaser is enforced in code, not in RLS — migration 0010 permits anonymous reads of published rows — so any second, hand-rolled listings query silently bypasses it. `/members/[id]` did exactly that and was showing logged-out visitors listings whose own detail page refuses them. **Rule going forward: a new screen that lists listings calls the shared gated reader (`lib/cl/listings-read.ts`) or it is wrong.** The RLS audit cannot catch this class of bug — it passed 59/59 throughout — so the guest walk is not an optional visual check.

- **No professional designer is being engaged for now, so the Classifieds system IS the site.** (2026-08-26, George) This is the decision that changes the status of everything built in the preview. The 2026-08-18 call made Classifieds the direction; this one removes the safety net behind it — nobody is coming later to redo these screens, so the migration slices are not tidy-up work ahead of a designer's brief, they are the rest of the product. Consequence for sequencing: **Slice 3 is not optional polish.** The remaining editorial surface (`/admin` ×4, `/invite`, `/join/[token]`, `/sponsor-request/[token]`, `/reset-request`, `/reset-password`, `/thank-you`, `/terms`, `/privacy`) is the last of the site still in a design system that is being retired, and `app/design/` and the `(ed)` route group retire together with it.
- **Slice 2 shipped: every member-only screen is now Classifieds, and the signed-in states have been rendered and looked at for the first time.** (2026-08-26) `/login`, `/signup`, `/apply`, `/listings/new`, `/profile`, `/listings/mine`, `/listings/[id]/edit` and `/listings/[id]/contact` all moved. Three of those had no drawn screen and were designed in-system rather than ported. The Cloudflare Turnstile localhost allowlist — the thing that blocked Slice 1's verification entirely — **is fixed**, so the member-only UI was verified rather than assumed for the first time in the project.
- **`/profile` and `/profile/edit` collapsed into one screen, and `/profile/edit` stays as a redirect.** (2026-08-26) The design puts every field on one page with inline rows, so the rows carry their own write paths. The old route is kept rather than deleted so links in already-sent emails still land somewhere.
- **The profile photo was NOT dropped, against what the mockup drew.** (2026-08-26) Screen 10 has no photo row. Shipping it as drawn would have deleted a working feature (`0023`, `AvatarUpload`) and silently reversed the 2026-06-08 decision that put a real photo on the profile as the identity surface. **Rule this establishes: a mockup that predates a logged decision does not get to reverse it by omission.**
- **Route gates now have their own audit, because the RLS audit provably cannot see them.** (2026-08-26) `npm run audit:gates` asserts 21 gates over HTTP as guest / Tier 1 / member — including that someone else's unpublished listing id and a nonexistent one stay indistinguishable. It exists because Slice 1's trust hole passed `audit:rls` 59/59 on both sides of itself. The two audits are complements; neither substitutes for the other.

- **Nobody is named to a logged-out visitor. Anywhere.** (2026-08-26, George — settles the question held open on 18 August, and reverses it) The landing anonymised bylines ("Vouched by a member") while browse, search, saved, listing detail and the member profile named the same guest one click away. **Browse changed to match the landing, not the other way round.** What a logged-out visitor now sees: listings, prices, photographs, neighborhoods — and no member name and no sponsor name. What a signed-in reader sees is exactly what they saw before, full byline included; the vouching mechanic is untouched for everyone actually inside. Two consequences worth naming: **`/members/[id]` is now the members-only wall for a guest** (the page IS a named member, so anonymising it would leave nothing), which also means member profiles stop being indexable; and the public claim in Terms and Privacy is now **listings are public, member names are not**. Enforced in application code (`cardMeta()` in `lib/cl/listings-read.ts`), NOT in RLS — the database is entitled to return those names and does — so it is held by new assertions in `npm run audit:gates` that fetch every guest-reachable route and search the response for real member names.

- **"I have an invite →" does not go back as a button, and this is the correct reading of the copy library.** (2026-08-26, Claude Code judgement call — flagged for George) `voice-and-copy.md` pairs the contact gate with that CTA; it was commented out in Slice 2 under the dead-link rule because `/invite` was still an editorial screen. `/invite` is migrated now and the button still does not return, because **`/invite` is where a member SENDS an invitation** — a Tier-1 account pressing it would be redirected to their profile. The real destination is `/join/[token]`, and the token only exists in the invitation email. The gate now carries the instruction instead ("Have an invitation? Open the link in that email"). To make it a link again, someone has to build a tokenless "I have an invitation" lookup screen — a small piece of work, and a real decision, not an oversight.

- **The Classifieds system is live on manhattanite.com.** (2026-08-27) Slices 1, 2 and 3a merged to `main` as one `--no-ff` commit (`4759502`) and deployed — 202 files, +12,158 / −3,354, and the first code deploy since 22 July. Every screen a person who is not the founder can reach is now Classifieds; the four `/admin` screens are the only editorial surface left, and they are Slice 3b. The three slices merged together on purpose, so no member ever crosses a seam between two design systems. Rollback is a single `git revert -m 1 4759502` for as long as that is wanted, and `design/classifieds-live` stays until 3b has shipped and settled. Two things learned in the merge worth carrying: **`/admin` needs a way in that does not live in `(ed)`** — `AppHeader` now carries a quiet Admin link, passed as a prop from `/profile` rather than looked up, so the eight prerendered-static routes stay static — and **an audit written against `npm run dev` is not verified until it has run against production**, which `audit:gates` had not, and which cost two false failures on the day.

## Trust mechanic

- **Spam protection on the front door — Turnstile-only.** (2026-06-30, George) Returning from a break to a flooded application queue, we diagnosed the cause: email confirmation is OFF in Supabase (bots sign up with fake emails → instant session → apply) and there's no CAPTCHA. **Decision: add Cloudflare Turnstile (CAPTCHA) on signup + a free honeypot on the apply form; KEEP instant signup (email confirmation deferred).** Turnstile stops the automated flood, which is the bulk of it; email confirmation is parked as a one-setting add if spam still trickles through. No DB migration — auth-settings + frontend only. Full plan: `WORK AREAS/Product/mvp-build-project/outputs/Manhattanite_Spam-Protection_Build-Plan_v1.md`.
- **Working name:** Gens de Confiance Lite. (2026-05-16)
- **Seed / MVP phase:** Open application path. Anyone visiting the site can apply for membership via real account creation. George reviews each application personally and approves or declines. Approved applicants are technically "sponsored by George." (2026-05-16)
- **Post-launch:** Sponsor-only becomes the primary path. One existing member vouches and is publicly named on the new member's profile. Application path may quietly remain or be removed depending on what we learn during MVP. (2026-05-16)
- **No "waiting list" framing.** The terminology is "apply for membership" — confident, member-facing, Soho House-style. Not waitlist, not signup, not registration. (2026-05-16)
- **Primary reviewer at start:** George. Until other members start sponsoring at volume, every approved member is functionally sponsored by him. (2026-05-16)
- **Multi-sponsor model adopted — moves toward true GDC.** (2026-06-10, George) Revises the "one canonical sponsor per member" architecture. A member can now have **many** sponsors, not one:
  - **Floor, no ceiling.** Minimum **1** sponsor now; **work toward a minimum of 2** later (a one-line config lift, not a rebuild). **No upper limit** — a member can accrue any number of sponsors.
  - **Sponsors stay publicly named on listings** (not GDC's gate-only model — George's deliberate divergence; the named vouch is a stronger personal-accountability signal).
  - **Byline format = "hybrid-at-2":** 1 sponsor → "sponsored by John R."; 2 → "sponsored by John R. & Sarah K."; 3+ → "sponsored by John R., Sarah K. + N more". Real names kept up to two, then a count. Threshold lives in frontend code (easy to change).
  - **Schema impact (real, not cosmetic):** new `sponsorships` table (member→many sponsors) becomes the source of truth; `listings.sponsor_name text` → `sponsor_names text[]` (ordered denorm cache, primary inviter first); byline triggers (migration 0006) reworked; `approve_application` writes a primary sponsorship row. `accounts.sponsor_id` retained as the "primary sponsor / inviter" pointer. Build plan: `WORK AREAS/Product/mvp-build-project/outputs/Multi-Sponsor_Build-Plan_v1.md`.
  - **Follow-up:** root `CLAUDE.md` still describes the old single-sponsor model — reconcile in a dedicated pass.

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
- **Seed phase activated — full go; entity formation deferred.** (2026-07-02, George; revises the same-day "legal in parallel" call) With the MVP demo-ready, focus shifts from build to member acquisition. Outreach, list-building, seed listings, **and member approvals** all start immediately. **George's call: no entity registration until money is about to change hands.** Triggers to revisit: first dollar taken, ~50+ members, or members George doesn't personally know — whichever first. Attorney review of T&P moves to the same trigger list. **Surviving guardrail: fair-housing checklist in the moderation pass for apartment listings** — that exposure exists regardless of money or entity (George personally approves every listing). New work area: `WORK AREAS/Growth/founding-member-acquisition-project/` (two-week plan + candidate tracker in outputs/). Playbook assumptions still open: 8/8/4 composition split, founder-routine cadence (plan assumes the 2-day ADHD-friendly version), printed cards, Instagram-first vs no social.

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
- **Design Foundation activated as its own project.** (2026-07-16, George) The deferred styling pass is now an active workstream. George's verdict on the current design: okay but not amazing — the bar is chic, eye-catching, elegant, very professional. Scope decision: **product screens first, brand lock second** (chosen over "full brand system at once"; matches the brand guide's own sequencing — decide on a screen, not a swatch, and the first real screens now exist). Working method: Mobbin for reference collection, Claude Design (claude.ai/design) for mockups + component library, implementation in the repo by Claude. Wordmark, final palette, and the serif question all get decided inside this project, in context. New project: `WORK AREAS/Product/design-foundation-project/` (5-phase plan in outputs/). [System change: new project folder created per protocol.]

- **Design imports get a scoped, deletable PREVIEW AREA, not a live edit.** (2026-08-18, Claude Code + George) The Claude Design "Classifieds" system was built at `/design/*` — own CSS scope (`.cl-root`), own fonts, noindex, zero live-surface changes, revertible with one `rm`. Rationale: the site has real members and listings on it, so editing the marketing surface directly makes every mistake public. **The preview is a proving ground, not a destination** — if the direction is adopted, the right move is to migrate the real routes and delete `/design`, never to keep two design systems side by side.
- **The Classifieds system is better INSIDE than OUTSIDE.** (2026-08-18) Built and compared against the live editorial system: more legible and denser for product screens (browse, detail, post), but more conventional — rounded pills, sans-serif, card grid — where the editorial system is more distinctive and closer to the Soho House register. Maps onto the 2026-07-17 **dark outside / light inside** split: strong candidate for inside, weak for outside. **Highest value is as input to the designer's brief, not as the thing to ship** — the design freeze (2026-08-13, "too AI") is still in force and this is itself a Claude-generated design.
- **Landing v3 NOT promoted to `/`.** (2026-08-18) It lives at `/design/landing`. Promoting it would replace the primary marketing surface *and* reverse the July palette decision — a call to make deliberately, not as the side effect of importing a file.
- **On the landing, sign-in leads and request-access moves to the foot.** (2026-08-18, George) Inverts the design file, which puts "Request access" in the hero. Sign-in opens a real working form in place — no navigation, no modal. **Accepted trade:** most landing traffic has never visited, so above the fold they now meet only a members' door; the listings still argue the case and the way in waits at the end of them. Intended reading of "members only", not the higher-converting arrangement.
- **No dead controls in a design port.** (2026-08-18) Where a mockup draws something the product cannot do, cut it with a reason rather than fake it. Applied to: nine categories → the four in the enum; "Closest" sort and "Save this search" dropped; weekly-digest and hide-my-name toggles omitted (no columns, and hiding your name contradicts the trust mechanic); the member profile shows only facts already public on every card. **Rationale: a faked control in a preview is how a design gets approved for something the product cannot do.**
- **Member data stays behind RLS until a decision is made, not until it's convenient.** (2026-08-18) `accounts` is read-own, so the member profile was built entirely from the denormalized bylines already public on every listing — no new disclosure. `supabase/migrations/0026_member_profile.sql` is **written, not applied, nothing calls it**: a narrow SECURITY DEFINER function rather than a SELECT policy, because a policy makes every *future* column on `accounts` public by default. **Open — George's call and George's migration to run.**
- **OPEN INCONSISTENCY: the landing anonymises bylines, browse names everyone.** (2026-08-18) Same logged-out visitor, same six listings — "Vouched by a member" on one page, "Listed by Lila · sponsored by George Gardner" on the other. One is wrong about how public a member's name is, and the landing is the page that gets indexed and shared. **Not settled by whichever file was edited last; needs a product decision.**

## Personal Assistant

- **Email accounts:** Outlook = Manhattanite work. Gmail = personal. Never cross. (2026-05-16)
- **Default behaviors:** Claude can draft and label without asking. Claude must never send without asking. (2026-05-16)

## System / folder structure

- **`ABOUT ME/`** is read-only — founder identity. Cannot create or edit files there.
- **`COMPANY/`** holds all Manhattanite business reference (this folder).
- **`COMPANY/memory.md`** is the visible top-level snapshot (quick state + pointers). Read at the start of every Manhattanite conversation. (2026-05-16)
- **`COMPANY/memory/`** holds the deep memory files: `decisions.md` (this file) + `session-log.md`. Opened on demand. (2026-05-16)
- **`WORK AREAS/`** holds active project work.

- **New work area `Income/` + project `music-teaching-project` created.** (2026-08-01) First non-Manhattanite work area, for part-time income work. George's chosen direction: teaching music and creativity to children (bass/guitar lessons + songwriting labs). Placed in this workspace because the CoWork OS layer tracks all of George's work; flagged for George to relocate if he'd rather keep this workspace Manhattanite-only.

## Profiles & identity photos (2026-06-08)

- **Members may have a photo on their profile page, but NO inline avatar thumbnails next to their name anywhere else.** George's call: small face thumbnails by bylines/listings would look "scrappy." Correct brand instinct — tiny circular avatars are the visual signature of consumer social platforms (Facebook, Nextdoor, Vinted) and fight the editorial Soho House / Mr Porter / Le Labo register. (2026-06-08)
- **GdC reconciliation:** GdC's real-photo rule exists for accountability *at the point of trust* — "see who I'm dealing with before I deal with them." That goal is served by a photo on the **profile**, viewable on click-through, NOT by thumbnails sprinkled across the browse grid. So keeping faces off inline bylines costs nothing on the trust model. (2026-06-08)
- **Where a photo earns its place:** (1) Profile page — real, generous, well-shot photo = the identity surface, fully GdC-faithful. (2) Listing detail — the *only* place a face might appear outside the profile (the trust-decision moment), and even then as a tasteful "about the lister" treatment, never a thumbnail. (3) Browse bylines — name only, no photo. (2026-06-08)
- **Status:** principle locked; implementation deferred to the Phase 1.5 Design Foundation / a future avatar slice. Not in the /apply build. Also a future GdC-identity note: GdC includes a profile photo as part of real-identity — adding one to profiles closes that gap when the time comes. (2026-06-08)

## Positioning revisions from outreach prep (2026-07-13)

- **Paid ads softened from "never" to "not while the network seeds."** George's call during company-briefing review: an absolute no-ads rule may not be realistic; he's open to paid acquisition later if a channel can be measured against the member bar. `gtm-playbook.md` still reads "no paid ads, ever" — treat this entry as the later decision that wins; reconcile the playbook in its next revision. Note the distinction preserved: ads *on the site* (monetization) remain off the table; this revision covers ads *for acquisition* only. (2026-07-13)
- **Category framing widened for conversations:** apartments + furniture are the *focus*, but Manhattanite is open to any right listing from day one. Product caveat: the listings table currently supports only the apartment/furniture types, so an off-category listing needs a small build change before it can actually post. (2026-07-13)
- **Moderation language corrected:** "never rewrite" means the platform never rewrites a listing *itself* (Section 230 posture). Sending a listing back and asking the poster to rewrite is fine and expected — that's the quality bar working. (2026-07-13)

## Design direction (2026-08-18)

- **The Classifieds system becomes the site, not a reference for a designer.** George's call, reversing the read logged the same morning (that its highest value was "as input to the designer's brief, not the thing to ship"). The `/design` preview built 17–18 Aug stops being a proving ground and becomes the live visual system. (2026-08-18)
- **This supersedes the 2026-08-13 design freeze in practice.** That decision — design reads "too AI", open design calls frozen, engage a professional — was made about the editorial ICW system. George has been shown that the Classifieds direction is itself Claude-generated and chose it anyway. The designer shortlist and independent-designer research stay on file; whether a studio is still engaged, and for what, is now an open question rather than the plan. (2026-08-18)
- **Migration is three slices, not one merge.** Merging the preview branch changes nothing a visitor sees: everything lives under `/design/*` and no live page file is touched. Making it the site means route groups, promoting the fonts and `classifieds.css` out of the preview layout, and repointing routes — Slice 1 covers the logged-out experience, Slice 2 the member screens, Slice 3 admin and the edges. Prompt: `WORK AREAS/Product/design-foundation-project/outputs/Manhattanite_Classifieds-Migration_Claude-Code-Prompt_v1.md`. (2026-08-18)
- **Four decisions block Slice 1, still open:** whether the landing names members (it currently anonymises bylines while browse names everyone, to the same logged-out visitor); whether the wordmark stays Instrument Serif against the Classifieds system's Newsreader; whether Saved and Search ship, which is an `mvp-spec.md` scope change since both are listed out of v1; and migration 0026, recommended to stay unapplied since nothing calls it. (2026-08-18)

---

*Decisions are dated. If something here conflicts with later work, the later decision wins — but log the change rather than silently edit.*
