# CLAUDE.md

This file is read at the start of every session by both Cowork and Claude Code. It is the single source of truth for how to work in this project.

The first half is the **CoWork OS reading protocol** (orient yourself, read context, log work). The second half is the **Manhattanite project context** (what we're building, why, and how it's organized).

---

# Part 1 — CoWork OS reading protocol

## Before every session

1. Read everything in `ABOUT ME/`. No exceptions. Five files define who George is, how to write for him, and where his tools live: `about-me.md` (identity, business context, background), `voice-profile.md` (beliefs, personality, perspective), `writing-rules.md` (tactical writing mechanics: banned words, anti-AI patterns), `my-context-map.md` (full tool ecosystem), `specialist-routing.md` (which plugins cover which domains).
2. Read this file's Part 2 (Manhattanite project context) and `COMPANY/memory.md` (current quick state).
3. Open the task-specific COMPANY files from the table in `COMPANY/_index.md`.
4. Open `COMPANY/memory/decisions.md` only if you need the full dated decision list. Open `COMPANY/memory/session-log.md` only when recent session context matters.

## After every session

Log anything significant to the appropriate memory file:

- **Universal memory** (`COMPANY/memory.md`): decisions about how we work, discovered preferences, system changes.
- **Project memory** (`WORK AREAS/Product/mvp-build-project/memory.md`): progress, project-specific decisions, blockers, next steps.
- **Decisions log** (`COMPANY/memory/decisions.md`): if a strategic decision was made or revised.
- **Session log** (`COMPANY/memory/session-log.md`): a dated entry summarizing what happened (newest at top).

Use the format defined in each memory file. If nothing significant happened, don't force an entry.

## Folder protocol (now unified)

This folder serves **two purposes simultaneously**: it's both the CoWork workspace (strategy, planning, PA) and the Manhattanite build repo (code, deployment).

**Cowork-side folders** (read by Cowork; the upper layer):
- `ABOUT ME/` — George's identity and preferences. Personal — gitignored, lives only on his Mac.
- `RESOURCES/` — CoWork OS templates, guides, and skills.
- `COMPANY/` — Manhattanite strategy reference (vision, brand, voice, mvp-spec, tech architecture, GTM, trust/moderation, legal, PA rules, memory).
- `COMPANY/memory/` — the deep memory store (decisions log + session log).
- `WORK AREAS/` — active project work, including `Product/mvp-build-project/` (where this MVP is tracked) and `Admin-PA/` (personal-assistant tracking).

**Claude-Code-side folders** (read by Claude Code; the lower layer):
- `app/`, `public/`, `lib/`, etc. — the actual Next.js codebase.
- `package.json`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, etc. — project config.
- `.env.local` — environment variables (API keys); gitignored.
- `.git/` — version control.

Both layers coexist at the same root. Cowork reads from the upper layer, Claude Code reads from both. This eliminates the previous drift problem (two folders out of sync).

## Project creation protocol

When work begins on something that looks like a new project — a distinct piece of work with a goal that will take multiple sessions, not a quick question or one-off task — check whether a matching project folder already exists anywhere in `WORK AREAS/`. If it doesn't:

1. Decide which work area it belongs to. If unclear, ask. If it's a quick task or general admin, use `Admin-PA/`.
2. Create the project subfolder inside the chosen work area using kebab-case and ending with `-project`.
3. Create `project-brief.md` and `memory.md` inside it. Create an `outputs/` subfolder.
4. Log the new project in `COMPANY/memory/decisions.md` as a system change.

## Naming convention

Files in `outputs/` follow: `Project_Content-Type_v1.ext` (e.g., `Manhattanite_Brief_v1.md`, `Q3-Launch_Deck_v1.pptx`). Increment version if a file with the same name already exists.

## Operating rules

- If the brief is unclear, ask. Don't fill gaps with generic filler.
- Don't over-explain. Deliver the work. Save commentary unless George asks for it.
- Never delete files anywhere except where explicitly stated (e.g., archiving). Append to memory files; don't rewrite them.
- Be proactive but think before destructive actions. For anything that can't be undone, pause and confirm.
- When you hit a wall, say so clearly. Don't loop.
- All writing must follow the rules in `ABOUT ME/writing-rules.md`. Apply the five-point test before finishing any piece of writing.

## Personal-assistant boundary

If a session involves email/calendar work alongside code:

- **Outlook = Manhattanite (business). Gmail = personal. Never cross them.**
- Claude can draft, label, summarize without asking. Claude must **never** send email without explicit approval — even short replies, even to George.
- Full rules in `COMPANY/pa-rules.md`.

## Things to always do

- If you find something unexpected while working (a problem, a better approach), flag it.
- Prefer doing over explaining — if you can just do the thing, do it.
- If a task could be automated or systematised, mention it.

## Things to never do

- Don't use technical jargon without immediately explaining it in plain terms. George is non-technical with ADHD; define every technical term inline at first use.
- Don't ask multiple questions at once — pick the most important one.
- Don't delete, send, post, or submit anything without telling George first.
- Don't give a wall of text when a few sentences will do.

---

# Part 2 — Manhattanite project context

## What this repo is right now

A real, working Next.js 16 project. Originally scaffolded 2026-04-26 to run the manhattanite.com waitlist; now the production build for the marketplace itself. **Current state (2026-06-12):** auth (email + password — signup, login, forgot-password reset), Tier 1 gating page at `/`, `/profile` + `/profile/edit`, `listings` table with RLS, `/listings` browse (with a logged-out teaser), `/listings/[id]` detail, member-gated `/listings/new`, `/listings/mine`, edit + archive of your own listings (`/listings/[id]/edit`), image upload (Supabase Storage), `/apply` + manual approval, member-to-lister contact (`/listings/[id]/contact` → Resend), tier-aware navigation, the multi-sponsor model (many sponsors per member, hybrid-at-2 byline), and the admin console (`/admin` — application review queue, stats dashboard, member directory). **Listing moderation** (pre-moderation: new listings post as `pending` and require admin approval at `/admin/moderation` before going public — the trust bar made mechanical) is the latest slice: migration `0017` is **applied to prod**, frontend built and deploying. **As of 2026-08-27** the Classifieds migration is merged and deployed, so the member-only screens (`/login`, `/signup`, `/apply`, `/listings/new`, `/profile`, `/listings/mine`, `/listings/[id]/edit`, `/listings/[id]/contact`) are Classifieds screens **in production**, not on a branch. The Cloudflare Turnstile localhost allowlist is fixed, so signed-in UI is verifiable locally. **Migrations are applied through `0027`** (all hand-run in the SQL editor — this line said "through `0017`" until 2026-08-27 while nine more had shipped, so re-check it rather than trusting it. Verified 2026-08-27 by probing the live schema and by `npm run audit:rls` exercising 0019/0020/0024/0025 against prod. `0027_listing_price_optional.sql` makes `price_cents` nullable; it was applied to prod on 2026-08-27 and verified from `pg_attribute` rather than the editor's success banner (`attnotnull` = false), and `drop not null` is idempotent, so re-running it is harmless. **Write hand-run migrations dollar-quoted and apostrophe-free** — the SQL editor auto-pairs a typed apostrophe and silently doubles it. There are TWO trust audits — `npm run audit:rls` attacks the database, `npm run audit:gates` attacks the routes, and neither substitutes for the other; run `audit:gates` against a WARM dev server, because a cold one reports false 404s on routes Next has not compiled yet). Founder is `is_member=true` + `role='admin'`, with three published test listings live in prod.

The stack is **Next.js (App Router) + Supabase + Vercel + Resend + Airtable (dormant)**. See `COMPANY/tech-architecture.md` for locked stack decisions. The `/apply` slice (Phase 2) shipped on `lib/applications/submit.ts`; the Airtable side of that pipeline stays dormant, with Supabase as the live store.

@AGENTS.md — Read this for Next 16 breaking-changes warnings. Do not use Next 15 muscle memory.

## Synthesized strategic position

Manhattanite reconciles two strategy streams: an earlier deep analysis (`COMPANY/strategy-blueprint.md`, 2026-05-06) and a later tactical refinement (the rest of `COMPANY/`, 2026-05-16/17). The reconciled position holds:

- **Trust is the product, not coolness.** Utility-first positioning. Manhattanite must be *useful* — solve real local trust problems — before it is *exclusive*. Reject pure status-positioning. The framing is "invite-worthy because useful," not "invite-only because cool."
- **Aesthetic execution, not aesthetic positioning.** The brand voice (Soho House, editorial, Mr. Porter, Le Labo) is the *costume*, not the substance. We dress utility in cultivated voice; we do not lead with cultivation.
- **Binary trust mechanic at MVP, graded trust score in v2.** Account / Member is shippable in 14 weeks. The longer-term direction is the multi-tier score system (Explorer / Verified / Trusted / Connector) from strategy-blueprint.md.
- **Pay-per-post only.** No paid membership tiers. No business accounts at MVP. Free membership forever.
- **2 categories at launch.** Apartments + Furniture. Jobs in v1.5.

## Architectural anchors (the non-obvious essentials)

- **Two-tier access model is the product.** Tier 1 (Account) = free, can browse + apply, cannot post/contact/sponsor. Tier 2 (Member) = application + manual approval, sponsor(s) publicly named. The wall between them is the trust gate and the moat — never weaken it for ergonomics. Full spec in `COMPANY/mvp-spec.md`. Future direction: replace the binary with a graded trust score per `COMPANY/strategy-blueprint.md`.
- **Row-Level Security (RLS) is load-bearing, not optional.** The Tier 1/Tier 2 wall must be enforced at the Supabase database layer on every member-only table, not just in UI. RLS = Supabase's database-level permission system that decides which rows a logged-in user can see/edit. An RLS-less feature is a broken feature. See `COMPANY/tech-architecture.md`.
- **Single `listings` table with a `type` enum + JSON `details` column.** Apartments and furniture share common fields; type-specific fields live in `details`. Designed to extend (jobs, services) without schema explosion.
- **Many sponsors per member** (revised 2026-06-10; was single-sponsor). The `sponsorships` table (migration 0012) is the source of truth; `accounts.sponsor_id` is retained as the *primary / inviter* pointer, rendered first. Floor of 1 sponsor now, working toward 2, no upper limit. The listing caches an ordered `sponsor_names text[]`; the byline is assembled by the **hybrid-at-2** rule in `lib/listings/byline.ts` (1 name → "A & B" at two → "A, B + N more" beyond). During seed phase the primary sponsor defaults to George.
- **Applications are rows with status**, not a separate approval table. Approval (`approve_application`) flips `is_member`, writes `accounts.sponsor_id`, and inserts the primary `sponsorships` row in one transaction.
- **Contact = form → Resend email.** No in-product inbox, no real-time messaging in v1. A `listing_contacts` row is logged for moderation history.
- **Auth = email + password.** Signup, login, and a forgot-password reset flow (`/reset-request` → `/reset-password`). Magic-link-only was the earlier plan but was overridden in Phase 1 Slice 2 (see the 2026-05-27 decisions-log entry).
- **Airtable is transitional, not permanent.** During seed phase, applications flow into both Airtable (for George's manual review UI) and Supabase (for the member record). Sunset Airtable when the in-product admin review UI is built (v1.5 or v2).

## Scope discipline

`COMPANY/mvp-spec.md` is the source of truth for what's in and out of v1. **Deliberately out of v1:** in-platform messaging, jobs, services, search filters, favorites, payments, native apps, sponsorship request flow, paid membership tiers, business accounts. If a feature doesn't map to one of the three brand promises ("better stuff", "trust the people", "I'm in"), it doesn't ship.

If a build week slips, scope is cut from later phases — never from the trust layer.

## Voice, copy, and spelling conventions

- **American spelling throughout** product and marketing copy (Manhattanite is a New York brand). `COMPANY/voice-and-copy.md` and `COMPANY/brand-guide.md` are sources of truth for tone — Soho House is the voice anchor.
- When writing any user-facing string (interaction gates, application copy, system emails), open `COMPANY/voice-and-copy.md` first.
- `app/page.tsx` is the Tier 1 gating page (shipped Slice 3.5, 2026-06-01) using copy lifted verbatim from `COMPANY/voice-and-copy.md`. Flagged for Phase 1.5 rework — both copy and design need revisiting once the Design Foundation slot opens. Until then, the page does its functional job (closing the funnel mismatch) but is not the marketing surface Manhattanite needs longer term.
- **CTA library is partially stale.** `voice-and-copy.md` still lists "Join the network" as the create-account CTA; the shipped CTA is "Create an account →". Reconcile in a later copy pass.

## Active migrations and known transitions

This repo is mid-build. Be aware:

0. **The Classifieds design migration is LIVE on `main` and deployed** (merged 2026-08-27, `4759502`). No professional designer is being engaged (George, 2026-08-26), so **the Classifieds system IS the site** — these slices are the product, not tidy-up ahead of someone else's brief. Slices 1 (public face), 2 (member-only screens) and 3a (the byline decision + the eight remaining screens a normal person can reach) merged together as one `--no-ff` commit and shipped, so a member never crosses a seam between two design systems. Route groups: `app/(cl)` is Classifieds, `app/(ed)` is the retiring editorial system, and every URL is unchanged. **Slice 3b is all that is left**: `/admin` ×4 — reachable only by the founder, and reached from the quiet Admin link `AppHeader` renders on `/profile` (`AppHeader` takes `admin` as a PROP rather than reading the session, so the eight prerendered-static routes stay static — see the note in the file). After 3b, `app/design/` and the `(ed)` group retire together, along with the editorial components nothing else uses. `design/classifieds-live` is kept until 3b has shipped and settled; rollback of the whole migration is still `git revert -m 1 4759502`. **George's walkthrough batch + the blank-price work merged 2026-08-27 as `2e80c65`**, also `--no-ff`, so that batch reverts on its own with `git revert -m 1 2e80c65`.

0a. **NOBODY IS NAMED TO A LOGGED-OUT VISITOR** (George, 2026-08-26). A guest sees listings, prices, photographs and neighborhoods — never a member name or a sponsor name. Signed in, the full byline is unchanged. Enforced in ONE place, `cardMeta()` in `lib/cl/listings-read.ts`, and **not** in RLS: the names are denormalized onto every listing (0006) and published rows are anonymously readable (0010), so the database will keep returning them. Like the six-row teaser cap this is an application rule, which means `npm run audit:rls` cannot see it — the assertions that hold it are in `npm run audit:gates`, which fetches every guest-reachable route and searches the response for real member names. `/members/[id]` answers a guest with the members-only wall for the same reason. The public claim, on `/terms` and `/privacy`: listings are public, member names are not.
0b. **George's walkthrough batch, 2026-08-27** — five notes taken on the live site the day after the merge, implemented together. Reasoning in `WORK AREAS/Product/design-foundation-project/outputs/Classifieds_Website-Notes_v1.md`.

   - **The neighborhood filter is an APARTMENTS control.** One predicate, `hoodApplies()` in `lib/cl/filters.ts`, read by `buildHref`, `resultLabel`, `isFiltered`, `activeChips`, the browse row filter and `FilterRail`. `buildHref` reading it is what makes a stale `?hood=` LEAVE the URL when you switch category instead of filtering invisibly — hiding the rail group alone would not do that. The list is derived from apartment rows only.
   - **Card kickers lead with the CATEGORY for non-apartments.** An apartment still reads "UPPER EAST SIDE"; a coffee table reads "FURNITURE". `placeOf()` in `lib/listings/card.ts` was doing two jobs — the card's display string AND the value filtering and search compared against — so it was SPLIT: `neighborhoodOf()` is the data, `placeOf()` is the display. **Never compare against `placeOf`.** Searching "tribeca" still finds a Tribeca coffee table precisely because of that split.
   - **Saved left the main nav.** Route, save pills and `/saved` are unchanged; it is reached from a row on `/profile` now, and `AppHeader`'s nav is Browse · Profile. `MobileTabBar` is Browse · Post · Profile.
   - **Search moved onto Browse and `/search` retired to a 308** that carries the query string. It was the same gated read with a text term added, and nothing in the product ever linked to it. `scripts/audit-gates.ts` asserts the guest name rule against `/listings?q=…` now — that assertion must keep passing, never be deleted.
   - **`AppHeader` takes a `width` prop** (`"wide"` 1400 for browse, `"standard"` 1240 elsewhere) so the bar aligns with the page beneath it. It was hard-coded to 1240 while browse is 1400, which is why "Post a listing" sat 80px short of the card grid. **Flagged, not fixed:** the product has FIVE content widths (1400/1240/1100/1000/900) and nobody chose five — they accumulated. Collapsing them is its own pass.

   Out of scope and explicitly parked the same day: wanted/"looking for" listings, price modes, new categories, and rebalancing the seed mix (12 of 20 listings being apartments is the largest remaining reason browse reads as a rental site, and it is content, not code).

1. **Airtable application pipeline is dormant, not removed.** `/apply` (Phase 2) shipped on `lib/applications/submit.ts`; Supabase is the live store and Airtable is the dormant mirror. Airtable + Resend env vars stay in Vercel. Sunset Airtable when the in-product admin review UI lands (v1.5/v2).
2. **Bylines render (multi-sponsor).** Denormalized `author_name` + `sponsor_names text[]` on listings (migrations 0006 → 0012), assembled by `lib/listings/byline.ts`. **`0013` (drop the singular `sponsor_name`) IS applied** — probed against the live schema on 2026-08-27, which answers `column listings.sponsor_name does not exist`. This entry claimed the opposite until then; the dual-write is gone.
3. **Image upload is wired** (Slice 6) — Supabase Storage `listing-images` bucket, RLS-scoped to the user's own folder, signed URLs on read.
4. **`/apply` + manual approval is live.** Apply creates a pending application; approval is run from a CLI/SQL during seed (`approve_application`). Niggle to check: the apply flow appears to fire two near-identical confirmation emails (flagged 2026-06-09).
5. **Landing page flagged for Phase 1.5 rework.** Copy + design both. Functional but not the marketing surface we need.
6a. **TWO BUGS THE BLANK-PRICE WALKTHROUGH EXPOSED, FIXED 2026-08-27** (merge `2e80c65`). Both had shipped with the Classifieds merge and both were live for a fortnight; both are the same shape — **a form control that renders but the server action never reads**. Worth a sweep for others before Slice 3b.
   - **No listing with a photo could be posted or edited at all.** `ClImageUpload` wrote the hidden `images` field as an array of OBJECTS while `create.ts`/`update.ts` require an array of STRINGS, so every such save died on "Photos didn't upload cleanly. Try again." — a message that sends you to Storage when the fault is the wire format. **The seed script writes rows through the service role, bypassing the form entirely, which is why a site full of photographed listings proved nothing and nobody noticed.** To verify a write path, drive the real form.
   - **Editing a furniture listing deleted its neighborhood.** The Neighborhood field renders for every category but only apartment/other/service read it back, and `update.ts` rebuilds `details` WHOLESALE — so any edit dropped it, even one that never touched the field. That is the value `neighborhoodOf()` feeds to search, so it silently broke the rule in note 0b. Note that `details` being rebuilt wholesale is deliberate (switching category must not leave stale keys), so seed-only keys the form cannot express — `tags`, `category` — are still dropped on edit; nothing reads them.

6. **A LISTING MAY HAVE NO PRICE** (George, 2026-08-27; migration `0027`). Blank stores NULL and renders as no price line at all — a members' rate, a service quoted on request, a perk extended through a member. **NULL is "no price"; 0 is NOT** — free is a real asking price and has to stay sayable, so nothing may branch on falsiness (`if (!price_cents)` would silently hide every free listing's price). Every reader branches on `=== null`. Two deliberate exceptions say **"No price"** out loud, both places where silence would read as a broken row: `/admin/moderation` and the post form's Review step. A price filter EXCLUDES unpriced listings (a missing number cannot satisfy a bound). **There is no longer a "Price" sort, so there is no sort position to define** — the unpriced-sorts-last rule was removed with the sort control later the same day (see note 7). That was correct, not a loss: it existed only because price sorting did. Price *modes* (Free · Make an offer · Rate on request) and "looking for" / wanted listings were both considered and PARKED the same day.

7. **THERE IS NO SORT CONTROL ON BROWSE, AND THAT IS A DECISION** (George, 2026-08-27). Sorting by price ranks the network cheapest-first, which is the Craigslist frame and the opposite of this product; the min/max boxes in the rail already answer the budget question ("within what I can spend" is a filter; "rank these people by how cheap they are" is not). With price gone, "Newest" was a control with one option, so the whole row went and the result count stays. `SORTS`, `byPrice` and `sort` (from `ClQuery`, `parseQuery`, `buildHref` and both forms' hidden fields) are gone. **A stale `?sort=price` is IGNORED, never an error.** The feed is newest-first as a property of the page.

8. **A ROUTE THAT WORKS IS NOT A ROUTE SOMEONE CAN REACH** (2026-08-27, after the third instance). `/admin` before the merge, `/search` that morning, `/listings/mine` that evening — each time a screen outlived the only entry point into it, because the Classifieds migration retired the editorial `SiteFooter` and `AccountMenu` that had been its only doors. **When a design system is retired, the surviving routes need their entry points re-homed.** No build, type check, `audit:rls` or `audit:gates` can see this, because every one of them addresses routes BY URL — the one thing a stranded page still has. The check is a crawl from a signed-in member's real starting points (Browse and Profile), following only real `href`s. `/listings/mine` is now reached from a row on `/profile`. The one remaining orphan, `/invite`, is DELIBERATE and documented in its own page header — it waits on the growth-loop decision, not on a link. `/listings/[id]/contact` has no `href` either (contact is the "Get in touch" modal), so its header comment claiming "It is linked directly" is stale and there is no no-JS path to contact.

9. **A COMMENT IS DOCUMENTATION, NOT ENFORCEMENT** (2026-08-27). `ClRemoveListing` brings its own `<form>` and was rendered as the last child INSIDE the post form's `<form>`. Nested forms are invalid: the browser drops the inner one, the submit re-associates with the outer form, and "Yes, take it down" ran `updateListing` — saving the edit and archiving nothing. It never worked, shipped with `4759502`, and was live a fortnight **while both files carried a comment stating the exact rule the code was breaking.** It is now a sibling after `</form>`, and the guard is `checkNotInForm()` in `scripts/audit-gates.ts`, which fetches the real edit page as a real member and counts unclosed `<form>` tags before the control. **Never delete that assertion.** Second nested-interactive-element trap in this family after the button-inside-a-link on the card, so sweep for the shape rather than fixing instances.

10. **Flagged, not fixed:** the edit screen says "It goes back through review before it's live again", but `updateListing` deliberately never writes `status` (the 0017 trigger waves content edits through), so an edit to a published listing goes straight back live with no re-review. The copy promises a moderation step the product does not perform. Copy or behaviour — George's call.

11. **`min-2` sponsor floor and a member-facing `/invite` / sponsorship-request flow are future.** The model supports many sponsors now, but the floor stays at 1 and there's no in-product "add a sponsor" UI yet (seed uses the `add_sponsor` helper).
