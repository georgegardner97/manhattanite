# Project Memory — MVP Build

Chronological log. Newest entries at the top.

---

## 2026-06-16 (later still) · Sponsorship-request flow built + landing "two ways in" simplified

**Landing simplified (George's call).** Killed the "Two ways in" Account/Member two-column section — it framed membership as a velvet rope before signup. Replaced with a single account-first closing CTA ("Start with an account"). Also rewrote the "How it works" body plainer/less clever (dropped "genuinely" + the em-dash clause) and bumped the privacy subline from 13px → 16px (George said it looked too small). All in `app/page.tsx`.

**Sponsorship requests — applicant-initiated, sponsor-confirmed (NEW feature, migration 0025 pending prod).** This is the scoped, density-safe version of the deferred "request a sponsor" flow. The decision chain with George: account→member was fuzzy; he wanted the named-member to actually be asked and to confirm/deny by email; we agreed (a) only fire if the named email/name matches a real member (no cold-emailing strangers), (b) the email links to a confirm PAGE not a one-click link (mail clients pre-fetch links), (c) **sponsor confirming does NOT auto-admit — George's one-tap approval stays the moat** at ~5 members.
- **Flow:** apply + name a member in "Know a member?" → if it matches a member, `request_sponsorship` (DEFINER) creates a `sponsorship_requests` row + we email the member (`sendSponsorshipRequest`) → member opens `/sponsor-request/[token]`, signs in, Confirms/Declines (`respond_to_sponsorship_request`, enforces auth.uid()=sponsor_id) → the admin queue shows "Sponsor confirmed/declined/awaiting" → George approves as before, recording that sponsor.
- **Files:** migration `0025_sponsorship_requests.sql` (table + RLS [admin-read + sponsor-read-own] + 3 DEFINER fns); `lib/applications/emails.ts` (+sendSponsorshipRequest); `lib/applications/submit.ts` (rpc + email, best-effort, fails soft pre-migration); `lib/sponsorship/respond.ts`; `app/sponsor-request/[token]/page.tsx`; `app/components/SponsorRequestActions.tsx`; `app/admin/applications/page.tsx` (status line); ApplicationForm placeholder updated.
- **Everything fails soft before 0025 is applied** (rpc/table missing → no request, apply behaves as today). tsc + eslint clean.
- **PENDING: George must run `0025_sponsorship_requests.sql` in the Supabase SQL editor** (same as 0024). Verify queries are at the bottom of the file. Not committed (sandbox can't push) — bundle with the rest for Claude Code.
- **Login note:** `/login` hardcodes its post-sign-in redirect to /listings (ignores any `next`), so the confirm page handles not-signed-in by telling the member to sign in and reopen the durable token link. A `next`-param on login is a future nicety.

---

## 2026-06-16 (later) · Duplicate apply-email niggle RESOLVED (was a false alarm) + filter now all 4 categories

**Duplicate apply email — investigated, nothing to fix.** The 2026-06-09 flag (two "near-identical" application emails) does NOT reflect a double-send in the current code. The two emails were **29 min apart with different subjects** — 15:08 "New Manhattanite application" (the old Slice A reviewer-ping subject) and 15:37 "New membership application" (the Slice C subject). That's two separate test submissions straddling the Slice A→C deploy, not one request firing twice. The current `lib/applications/submit.ts` calls `sendApplicantConfirmation` exactly once and `sendReviewerPing` exactly once; the old "New Manhattanite application:" subject exists nowhere in the codebase (removed when Slice C refactored). tsc + eslint clean. **The niggle line in CLAUDE.md Part 2 ("appears to fire two near-identical confirmation emails") is now stale — safe for Claude Code to delete.** Optional future hardening (not done, not needed): a Resend idempotency key on the sends to guard against any accidental retry/double-click.

**Listings filter expanded to all four categories.** George's call: the filter should include every live type, not just the two launch categories. `FILTERS` in `app/listings/page.tsx` now = All · Apartments · Furniture · Other · Services (the full type enum), validated against a `VALID_TYPES` set; the bar wraps on small screens.

---

## 2026-06-16 · UX pass — listings filter, serif headings, profile connections, contact modal

Five George-initiated UX improvements. tsc + eslint clean. **All code-only except one migration that needs hand-running in prod.**

**Shipped (frontend, no DB change):**
- **Category filter on `/listings`** — segmented bar (All / Apartments / Furniture) via a `?type=` search param (server-rendered, shareable). Query adds `.eq("type", …)` when set; filter-aware empty state. Held price/neighborhood filters for v1.5.
- **Serif page headings** — `/listings` and `/listings/mine` had eyebrow-only labels (small-caps Inter); gave them Instrument Serif `<h1>`s to match the wordmark + the other pages (George's ask: "titles in the same font as the logo"). new/edit/contact already had serif h1s.
- **Home redirect** — confirmed `app/page.tsx` already sends logged-in users to `/listings` (not `/profile`); only a stale header comment was fixed.
- **Contact modal** — "Message the lister" now opens an on-page modal (`app/components/ContactModal.tsx`) instead of routing to `/listings/[id]/contact`. Reuses the existing `ContactForm` → `sendContact` → Resend mechanic (NO real chat — still out of MVP scope). Two modes set server-side: `form` (member) / `gate` (Tier-1 account); guests still link to `/login`. Detail page now fetches viewer `is_member`+`name`. The `/contact` route is KEPT as a no-JS fallback.

**Needs prod action — migration `0024_my_connections.sql` (written, NOT yet applied):**
- **Profile connections** — profile now shows "Sponsored by" + "You've sponsored" blocks (on-brand: trust is the product). The `sponsorships` table is RLS-locked with zero client policies, so reads go through a new `get_my_connections()` SECURITY DEFINER fn keyed on `auth.uid()` (returns only the caller's own web; granted to authenticated). Profile **fails soft** — if the migration isn't applied, the rpc errors and the section just doesn't render, nothing breaks. **George must run 0024 in the Supabase SQL editor for connections to appear.**

**Next:** George to run migration 0024 in prod; Claude Code to commit + push (sandbox has no push). Inviter shown with an "Inviter" tag. No profile-to-profile links yet (no public `/members/[id]` route exists). — 17 live with photos, Example badge shipped

The seed inventory is live: 10 apartments (A1–A6, A8, A9, A11, A12 from `outputs/Manhattanite_Seed-Listings_v1.md`; A7 + A10 left out) + 7 furniture (FM1–FM7 from `outputs/Manhattanite_Seed-Listings-Furniture-Matched_v1.md`), all `is_example=true`, `status='published'`, every one with photos (commit `c31a6e8`). The named-designer furniture (F1–F15) stays deferred per the matched doc.

**Mechanics:** new `scripts/seed-example-listings.ts` (`npm run seed:examples`, idempotent — re-run skips by author+title; `-- --unseed` reverses everything by exact storage path, founder-safe). Four example members — Anna (West Village, gallery director), Max (Tribeca, architect), Lila (UES, magazine editor), Sam (Harlem, photographer) — on `george.gardner480+seed-*@googlemail.com` plus-aliases, created through the REAL apply → `approve_application` path (occupation lives on `applications`, not `accounts` — there is no accounts.occupation column), each primary-sponsored by George, so member bylines render "Listed by Anna · sponsored by George Gardner". George authors 7 of the 17 per the docs. Photos: George's 20 Unsplash downloads were found loose on the Desktop (the briefed `seed-images/` folders didn't exist), content-matched by eye (13 apartments / 7 furniture, exactly the FM1–FM7 descriptions), sips-resized to ≤2000px JPEG q80 into `seed-images/` (now gitignored; Desktop originals untouched), uploaded to `listing-images` at `{author_id}/{uuid}.jpg`. Service role passes the 0017 pre-moderation trigger, so the rows are born published — no migration needed.

**Example badge** added to `/listings` cards + the detail page (small bordered uppercase chip, driven by `is_example`).

**Verified:** harness self-verifies (17/17 published with images + bylines, 10/7 split, founder's 3 real listings byte-identical before/after); idempotent re-run = 0 inserted / 17 skipped; anon probe sees 20 published; signed-in probe (temp-password seed member, rotated after) signed + fetched an image URL HTTP 200; live site: landing "On the network" shows seeded titles + neighborhoods, /listings guest teaser shows 6 Example badges post-deploy.

**Notes / flags:**
- Guest /listings teaser is **text-only by design** — the `listing-images` SELECT policy (0005) is `to authenticated` only, so anon gets rows (0010) but not pixels. Photos appear once signed in. If George wants photos on the logged-out teaser, that's a deliberate policy decision, not a bug.
- Landing glimpse is also deliberately photo-less ("shown, not claimed" rows) and carries **no Example label** — worth a think: 5 of 5 glimpse rows are now examples.
- FM2's doc text has British "colour"; seeded as "color" per the American-spelling convention. Doc not edited.
- Guest teaser currently shows 6 furniture in a row (insert order = newest). If a mixed teaser matters, nudge created_at or reorder inserts.
- Unseed caveat: a run that dies between image upload and row insert orphans those storage objects until an unseed sweep.

---

## 2026-06-12 · Landing page v3 SHIPPED — narrative, trust-first, real-listings glimpse

The Phase 1.5 landing rework is live on manhattanite.com (`eee5ac8`). `app/page.tsx` rebuilt to `outputs/Manhattanite_Landing-Page_Mockup_v3.html` (GDC-aligned: benefit → mechanism → reassurance) in the existing design system; logged-in → /profile redirect kept. Sections: hero ("A private marketplace for New York." + vouching sub + park-green-underlined "Create a free account →" — new `mh-link-park` accent class in globals.css), How it works, **On the network** (the 5 most recent real published listings, listing-own `details->>'neighborhood'` for the place label — no FK embed, no timestamps, display-only rows; section hides at zero listings), the privacy aside, Two ways in, footer. Hero's inline "Log in →" dropped — SiteNav already carries it for guests. Live check: all sections render, glimpse shows the founder's 3 published listings (furniture row correctly place-less), no timestamps. The CLAUDE.md "landing flagged for Phase 1.5 rework" note can come off at the next reconcile.

## 2026-06-12 · Listing Moderation SHIPPED — 0017 live on prod, harness 34/34, moderation emails added

**Continuation of the entry below (same day).** Cowork applied 0017 in the prod SQL editor; `test:listing-moderation` is **34/34 green against prod** (key assertion holds: a member's direct `update status='published'` raises 42501 at the database), and `test:edit-archive` re-ran 20/20 (the recreated update policy + new trigger don't regress Edit & Remove). Committed + pushed; Vercel deploys.

**Two additions George requested before the commit:**
- Confirmation copy is now outcome-honest: "Your listing is in review. We'll email you once we've taken a look." (no promise it goes live).
- **Moderation emails shipped** (the earlier "no notifications until v1.1" flag is resolved): three best-effort sends from `lib/admin/moderate.ts` after each successful rpc — approved ("Your listing is live." + listing link), returned ("A note on your listing." + the note + resubmit nudge), rejected ("About your listing." + the reason, gracious, voice-and-copy "Removed listing" register). Functions live in `lib/applications/emails.ts` (reuse the editorial shell), from applications@manhattanite.com. Lister lookup is TWO separate queries (listing → accounts), deliberately not a PostgREST FK embed (the member-directory lesson). A mail failure logs and never fails the review.

**Next:** live check in the browser (post → review → approve/return/reject, emails arriving), then the RLS-audit re-run note in the build plan's step 5 is already covered (Cowork audited 2026-06-12, per CLAUDE.md).

## 2026-06-12 · Listing Moderation slice BUILT — paused for the 0017 SQL run

**Decision (George):** PRE-MODERATION. New listings land in a `pending` (in-review) status and only an admin can publish them. Build follows `outputs/Listing-Moderation_Build-Plan_v1.md`.

**Worked on (all built, lint + tsc + production build green):**
- `supabase/migrations/0017_listing_moderation.sql` — `pending` added to the status check (probed prod first: constraint really is `listings_status_check`); `moderation_note` column; `enforce_listing_status_transition()` trigger; owner UPDATE policy recreated without the 0014 status allowlist (trigger owns transitions now); `approve_listing` / `return_listing` / `reject_listing` (SECURITY DEFINER, 0015-style admin guard, granted to authenticated + service_role).
- **One deliberate addition beyond the plan:** the trigger fires BEFORE **INSERT** as well as BEFORE UPDATE. The plan's UPDATE-only trigger left the API insert door open — a member could have POSTed a row born `status='published'` (the insert RLS policy doesn't pin status). Members may now only INSERT `pending`. Same trust rule, both doors closed.
- Frontend: create.ts inserts `pending` + redirects to `/listings/mine?submitted=1` (a pending listing has no public detail page — old redirect would have 404'd); /listings/mine shows ALL own listings with In review / Live / Needs changes / Archived badges, moderation note, status-aware Edit/Remove/Resubmit; `lib/listings/resubmit.ts`; `/admin/moderation` queue + `ModerationActions` + `lib/admin/moderate.ts`; /admin dashboard "Listings in review" count + link; edit flow fixed for non-published listings (post-save redirect + back-link).
- Harness `scripts/test-listing-moderation.ts` (`npm run test:listing-moderation`) — synthetic admin + member via real password sessions; key assertion: member's direct `update status='published'` raises 42501.

**Found while probing prod:** migration **0013 (drop `listings.sponsor_name`) IS applied** — the column is gone. CLAUDE.md still says "written but not yet applied"; reconcile at commit time.

**Blockers / Next:**
- WAITING: Cowork applies 0017 in the prod SQL editor (verify queries in the migration footer), then Claude Code re-runs the harness against prod; if green → commit + push (Vercel deploys), live check, RLS-audit re-run.
- Flagged: confirmation copy promises "we'll let you know once it's live" but approve/return/reject notifications are out of scope until v1.1 — the only place the outcome shows is /listings/mine.

## 2026-06-11 · Edit & Remove + Admin Console BOTH SHIPPED — 0013–0016 live on prod, all harnesses green

Both slices are committed, pushed to main, and deploying via Vercel. Cowork applied **four** migrations to prod via the Supabase SQL editor: **0013** (drop `listings.sponsor_name`), **0014** (listings owner-archive: permissive update WITH CHECK allows `status in ('published','archived')`, and the member hard-delete policy dropped), **0015** (founder→admin, admin-guarded review functions granted to authenticated, `listings_admin_read_all`), **0016** (`listings_read_own` — the real archive fix).

**All three prod harnesses green:** `test:multi-sponsor` 16/16 (regression holds after `sponsor_name` dropped), `test:admin-console` 24/24 (0015 fully live — non-admin blocked with 'not authorized', admin + service-role approve both work, founder is admin), `test:edit-archive` 20/20 (owner edit + archive + ownership RLS + owner-read-own-archived).

**The 0014 / archive saga — what was actually wrong (correcting my earlier wrong hypothesis on the record).** I had two prod-drift findings here:
1. **Real drift 0014 closed:** prod had an OPEN member hard-DELETE policy (a member could `delete` their own listing via the API, wiping `listing_contacts` history — against the locked soft-delete-only decision). 0014 dropped it. Verified: a member's own-row delete now matches 0 rows (was 1).
2. **My WRONG hypothesis (disproven):** when archive stayed blocked after 0014, I theorized a hidden **RESTRICTIVE** `status='published'` policy and parked `0016_listings_drop_restrictive_status_pin.sql`. **Cowork's live `pg_policy` read proved there are ZERO restrictive policies on `public.listings`**, and 0014's update WITH CHECK already allowed `archived`. My parked migration was a no-op on a false premise — **deleted**.
3. **The actual blocker:** there was **no SELECT policy letting a member read their own non-published rows** (only published-for-accounts, published-for-anon, admin-read-all). Archiving flips status to `archived`; the owner could no longer read the row back, so the archive appeared to fail (and archived/draft listings would vanish from the member entirely). Fix = `0016_listings_read_own.sql` (Cowork): `create policy listings_read_own on public.listings for select using (author_id = auth.uid())`. Additive, own-rows-only. After it, archive works and the owner can read their own archived rows (enabling a future unarchive UI; `/listings/mine` still filters to published, so archived = off the list).

**Lesson recorded:** I lack any direct-SQL path in dev (.env.local has only PostgREST keys), so I diagnose drift behaviorally — but behavioral elimination led me to the wrong policy *type*. When an RLS read-back fails, suspect a missing **SELECT** policy before inventing a restrictive WITH CHECK. The authoritative move is a live `pg_policy` read in the SQL editor (Cowork can; Claude Code can't from here).

**Both slices, final state:**
- **Admin Console (3 of mvp-spec's 4 admin views):** `/admin` dashboard (account/member/listing/pending counts), `/admin/applications` review queue (Approve/Decline/Request-more-info as admin-session rpc — never service role), `/admin/members` read-only directory. SiteNav shows "Admin" only to `role='admin'`. **Listing-moderation queue deliberately NOT built — separate follow-up slice.**
- **Edit & Remove:** owner-only `/listings/[id]/edit` (pre-filled, shared NewListingForm in edit mode), `updateListing` (writes only type/title/description/price/details/images — never status/author/byline), `archiveListing` (soft delete), Edit/Remove controls on `/listings/mine`, Edit link on the detail page for the author.

**Live verification (synthetic admin + member driven through the deployed site, then cleaned up — founder never touched):** /admin dashboard renders for an admin with live counts; review queue lists the pending applicant with Approve/Decline/Request-more-info; a non-admin gets a hard 404 on /admin and sees NO Admin nav link; edit changed title/price/condition on the live listing (byline preserved) and Remove archived it (status='archived' in the DB, dropped off /listings/mine). All synthetic rows purged, founder intact (role=admin, 3 published listings).

**One bug caught by the live check + fixed (commit 849cca5):** the member directory rendered "No members yet" despite 3 members — the PostgREST self-join embed `sponsor:accounts!accounts_sponsor_id_fkey(name)` errored (PGRST200; the live FK constraint isn't named `accounts_sponsor_id_fkey`), nulling the whole result. Fixed by dropping the self-embed and resolving sponsor names in a second `in()` query. Redeployed and re-verified live: the directory now lists all members. **Lesson: PostgREST self-referential FK embeds need the exact constraint-name hint and silently null the result if wrong — prefer a second query for self-joins.**

**Next:** listing-moderation-queue follow-up slice (the 4th admin view). Migration backlog is clear (0013–0016 all applied).

---

## 2026-06-11 · Admin Console slice BUILT — awaiting 0015 SQL run (found a second prod drift / live security gap)

**Status: code complete, typecheck/build/lint green, harness green with 2 expected pre-migration deferrals. STOPPED before deploy** per the slice instruction ("apply 0015, then push"). Nothing committed/pushed.

**Scope built (the 3 admin views in mvp-spec §"Admin views"):** application review queue, stats dashboard, read-only member directory. **Listing moderation queue deliberately NOT built — it's the separate follow-up slice.** (mvp-spec lists 4 admin views; this slice does 3.)

**What landed (all role='admin'-gated, defense in depth at route + RLS + function):**
- `lib/admin/guard.ts` — `requireAdmin()` (no session → /login, non-admin → notFound). The clean-UX layer.
- `lib/admin/review.ts` — `approveApplication` / `declineApplication` / `requestInfo` server actions (useActionState shape). They re-check the admin role and call the rpc **AS THE SIGNED-IN ADMIN, never the service role** (verified: no service_role import). approve also fires the "You're in." welcome email, best-effort, mirroring the CLI path. Postgres errors mapped to readable copy.
- `app/admin/page.tsx` (dashboard: accounts / members / listings / pending counts), `app/admin/applications/page.tsx` (pending queue with Approve/Decline/Request-more-info; needs_info shown muted as "waiting on them" — those functions only act on 'pending', and needs_info frees a re-apply via /apply), `app/admin/members/page.tsx` (read-only directory; occupation sourced from the approved application since accounts has no such column; primary sponsor via the accounts self-FK).
- `app/components/ApplicationActions.tsx` — inline confirm-gated review controls (no browser dialogs, MyListingActions pattern).
- SiteNav: "Admin" link renders only for role='admin' (members and, defensively, accounts).
- `supabase/migrations/0015_admin_console.sql` + `scripts/test-admin-console.ts` / `npm run test:admin-console`.

**MIGRATION RENUMBERED 0014 → 0015.** The plan said 0014, but 0014 is already taken by the parked listings-owner-archive migration from the Edit & Remove slice (uncommitted, not yet applied). 0015 is independent of 0013/0014 and can run in any order relative to them. **George now has TWO (soon three) parked SQL-editor migrations: 0013 (drop sponsor_name, cosmetic), 0014 (listings owner-archive, fixes the Edit & Remove drift), 0015 (this slice).**

**SECOND PROD DRIFT FOUND (a live security gap, confirmed empirically).** The harness + a focused probe (`scripts/probe-listing-policies.ts` is the edit-slice one; this used an inline probe) proved that in prod **right now**, any signed-in `authenticated` user can execute the three review functions — the repo (0008/0009) says service-role-only, but the `revoke … from public` evidently never took in prod:
- `decline_application` and `request_more_info`: **SUCCEED for any member** — a member could decline/limbo anyone's application. No guard at all.
- `approve_application`: runs but the protect_account_columns trigger (0001) blocks the is_member write → 'is_member is protected'. So a non-admin still **cannot** grant membership (that wall holds), but can call the function.

Migration 0015 closes it: it re-revokes from public AND adds the in-function admin guard (`auth.uid() is null` = seed path passes; admin passes; everyone else → 'not authorized' 42501) on all three, then grants `authenticated` (the guard does the gating). So 0015 both adds the console's admin-callable path AND fixes the pre-existing gap.

**Harness result pre-0015: 15 passed, 0 failed, 2 deferred.** Green on: admin reads the queue (0007 policy live), name embed (0002), all four dashboard counts match service-role ground truth + sane, service-role approval still works, founder untouched, 0 synthetic rows. The 2 deferrals (non-admin gets 'not authorized'; admin rpc approve flips membership) need 0015 live — the harness self-detects migration state via a non-admin probe and will run them in full on re-run.

**PRE-CHECK FOR GEORGE — founder is NOT admin yet.** info@manhattanite.com is role='account' (is_member=true) in prod. 0015 §0 includes the `update … set role='admin'` flip; the admin console matches zero people until it runs. (Strike that line if you'd rather set it by hand.)

**Next:** George applies 0013 + 0014 + 0015 in the SQL editor → I re-run `test:admin-console` (expect all green, no deferrals) + `test:edit-archive` → commit/push/deploy → re-verify on prod. Then: the listing-moderation-queue follow-up slice.

---

## 2026-06-11 · Edit & Remove slice BUILT, NOT SHIPPED — blocked by undocumented prod RLS drift

**Status: code complete and tested locally, but STOPPED before commit/push** per the slice guardrail ("if anything fails, stop and show me"). Nothing pushed; working tree holds the full slice.

**What's built (all green on typecheck + `next build` + grep guard):**
- `lib/listings/update.ts` — `updateListing` server action, mirrors create.ts (useActionState shape, validation, image-path ownership checks). Write set is ONLY `type/title/description/price_cents/details/images` — never status, author_id, or byline columns; verified by grep guard. Session + membership + ownership re-checked server-side.
- `lib/listings/archive.ts` — `archiveListing` soft delete (status='archived'). Deliberately no `.select()` after the update: Postgres applies SELECT policies to `UPDATE … RETURNING`, and an archived row stops being visible to the published-only read policy.
- `app/listings/[id]/edit/page.tsx` — owner-only pre-filled form; gating mirrors /listings/new (no session → /login, non-member → /profile, non-author → redirect to the listing, archived/missing → notFound via RLS).
- `NewListingForm` extended with optional `initial` (edit mode, same component both flows); `ImageUpload` takes `initialItems` (existing photos pre-signed server-side, removable). `MyListingActions` on /listings/mine: Edit link + inline confirm-gated Remove ("Remove this listing? It comes off the network right away." / Keep it). Detail page shows "Edit listing" to the author where others see "Message the lister".
- Archived listings are OMITTED from /listings/mine (not shown muted): the published-only read policy means owners can't read their own archived rows, so no honest unarchive UI is possible without a new read policy. Future slice.
- `scripts/test-edit-archive.ts` + `npm run test:edit-archive` — prod harness in the multi-sponsor mold (plus-alias synthetics, founder snapshot, auto-cleanup).

**The blocker — prod RLS has drifted from the repo.** Harness run: 15/20, and every failure traces to one fact. The live `listings_write_member_own_update` policy in prod pins `status = 'published'` in WITH CHECK — members can edit fields but CANNOT set status to 'archived' (or 'draft'). Migration 0003 in the repo has no such pin, no later migration touches the policy, and neither decisions.md nor this file records it. Confirmed empirically via `scripts/probe-listing-policies.ts` (synthetic member, auto-cleanup): title-only update OK, status→archived BLOCKED, status→draft BLOCKED, status→published OK, **hard DELETE of own row OK**. The slice premise "no migration needed" was wrong in prod even though it's true of the repo's SQL.

**Also caught:** the live member DELETE policy means any member can hard-delete their own listings via direct API call, wiping listing_contacts moderation history — contradicts the locked soft-delete-only decision.

**Proposed fix, awaiting George (SQL-editor gate):** draft migration `0014_listings_owner_archive.sql` — recreate the UPDATE policy with `status in ('published','archived')` in WITH CHECK (archive allowed, draft still blocked), and drop the member DELETE policy (soft-delete only, DB-enforced). After it's applied: re-run `npm run test:edit-archive` (expect all green), then commit/push/deploy.

**Everything that doesn't touch status already passes against prod:** owner edit of all six writable fields (byline columns byte-identical before/after), cross-member update/archive blocked by RLS (0 rows, data unchanged), cleanup to 0 synthetic rows, founder account + 3 listings snapshot-identical.

---

## 2026-06-10 · Multi-Sponsor slice SHIPPED — sponsorships table + hybrid-at-2 byline, live on prod

**Shipped** (Claude Code built → paused → Cowork ran 0012 in the prod SQL editor → prod test harness green → pushed → Vercel deployed → live render verified). Members can now have many sponsors; the byline assembles them with the hybrid-at-2 rule from `lib/listings/byline.ts`.

**What landed:**
- Migration `0012_multi_sponsor.sql`: `sponsorships` table (RLS on, no client policies — 0011 lockdown), backfill, `listings.sponsor_names text[]` (ordered, primary first), `rebuild_sponsor_names()` + reworked byline/propagation triggers, `add_sponsor()` seed helper (execute granted to service_role only, mirroring 0009), `approve_application()` now writes a primary sponsorship row. `-- MIN_SPONSORS = 1` comment marks the future floor-raise spot.
- **Plan deviation, George's call mid-slice: 0012 went ADDITIVE.** `listings.sponsor_name` was NOT dropped — it's kept and dual-written (= primary sponsor) by the rebuild helper and the BEFORE INSERT trigger, so the migrate→deploy cutover was zero-downtime in either order. **Follow-up: a trivial cleanup migration drops `sponsor_name`** now the new frontend is confirmed live.
- Frontend: `app/listings/page.tsx`, `[id]/page.tsx`, **`mine/page.tsx` (a third page the plan missed — caught by the grep guard)** all read `sponsor_names`; per-file `renderByline` copies replaced by the shared `lib/listings/byline.ts`.
- `scripts/test-multi-sponsor.ts` + `npm run test:multi-sponsor` — reusable prod harness.

**Prod test results: 21/21 green.** Bylines correct at 1/2/3 sponsors (incl. "+ 1 more"), primary always first, rename propagation, sponsor removal, anon teaser read of the array column, legacy dual-write asserted on every read, cleanup to 0 synthetic rows, founder untouched (account fields + byte-identical before/after snapshot of his listings' byline columns).

**Caught during the test loop:** first run failed one check — the harness wrongly required the 'John Robinson' placeholder on ALL founder listings, but the founder has a third listing (posted 2026-06-09, after the 0006 override) that legitimately has no sponsor. Test bug, not a prod bug; fixed by switching to the snapshot-compare. Note for future sessions: **founder has 3 listings**, two with the placeholder, one without.

**Commits:** `1b1a579` (slice), `42042bb` (additive 0012 + harness fix), `5acd043` (docs). All pushed; Vercel deploy succeeded.

**Next:** cleanup migration to drop `listings.sponsor_name`; reconcile root `CLAUDE.md` to the multi-sponsor model; later, the min-2 apply flow.

---

## 2026-06-10 · Multi-Sponsor slice SPECCED — build plan + Claude Code prompt written (not built yet)

**Context / trigger:** George asked whether the current "· sponsored by [one name]" byline matches GDC. Researched it: GDC uses sponsorship as the *entry gate* (min 3 sponsors) and surfaces status badges / ratings / connection-degree on listings — it does **not** print a single named sponsor per listing. George's call: move closer to GDC (work toward **min 2** sponsors, **min 1** now, **no upper limit**) but **keep sponsors named** on listings (a deliberate, stronger-accountability divergence). New byline = **hybrid-at-2**.

**Discovered en route:** the repo is well ahead of the stale root `CLAUDE.md` (which still says "Phase 3 Slice 5, images not wired, names don't render"). Reality: migrations through `0011`, byline renders, image upload fully wired, contact slice shipped. Both items I'd have proposed building were already done. Flagged; CLAUDE.md reconcile is a follow-up.

**Also flagged:** the "Marcus Halloway" application emails (2026-06-09) were George's own slice-C test (plus-alias `+slicec` / `george@manhattanite.com`). But **two** near-identical application emails fired (15:08 "New Manhattanite application" + 15:37 "New membership application") — possible double-send path in the apply flow. Check when revisiting `/apply`.

**Decision logged** in `COMPANY/memory/decisions.md` (Trust mechanic, 2026-06-10).

**Outputs:**
- `outputs/Multi-Sponsor_Build-Plan_v1.md` — full file-by-file plan. Key calls: (1) new `sponsorships` table = source of truth, RLS-on/no-client-policies (0011 pattern); (2) `listings.sponsor_name text` → `sponsor_names text[]` (ordered denorm cache, primary first), format logic stays in TS; (3) keep `accounts.sponsor_id` as the primary/inviter pointer; (4) byline triggers (0006) reworked + a `rebuild_sponsor_names()` helper + sponsorship-change trigger; (5) `add_sponsor()` seed helper to test 2/3-sponsor bylines; (6) `approve_application()` also writes a primary sponsorship row; min-floor=1, one-line lift to 2 later.
- `outputs/Multi-Sponsor_Claude-Code-Prompt_v1.md` — copy-paste hand-off. Migration = `0012_multi_sponsor.sql`.

**Run order:** Claude Code writes migration + frontend + harness → **pauses** → Cowork runs `0012` in prod SQL editor via Chrome (frontend drops `sponsor_name`, so SQL must land first) → deploy + prod test loop (1/2/3-sponsor bylines, rename propagation, sponsor removal, order, cleanup, founder untouched) → reconcile SHIPPED.

**Next:** George runs the Claude Code prompt. Then: reconcile root CLAUDE.md to the multi-sponsor model; later, the min-2 apply flow.

---

## 2026-06-09 · Contact slice SHIPPED — member contact form → lister email + listing_contacts log (built, deployed, tested on prod)

**Shipped** (Claude Code built → committed → pushed/deployed → ran the prod test loop). The "capture the value" half of membership: members can now contact listers. Listings are no longer view-only.

**What shipped:**
- **Migration `0011_listing_contacts.sql`** (run in prod by Cowork before deploy): `listing_contacts` table (id / listing_id / sender_id / message / created_at) with **RLS on and NO client policies** — the only write path is the function; reads are admin-only (deferred). Plus `log_listing_contact(p_listing_id, p_message)` **SECURITY DEFINER** — guards in order (signed in, `is_member()`, listing published, not self-contact), logs the row, returns the lister's email+name+title. Each guard raises a distinct SQLSTATE (**MH001** not-member → the interaction gate; **MH002** not-published; **MH003** self-contact) the action maps cleanly. `revoke all from public; grant execute to authenticated`.
- **`lib/applications/emails.ts`** — new `sendListingContact()`. From `applications@manhattanite.com`, **Reply-To = the sender** (this is what lets the lister reply directly — no inbox), subject "Someone's interested in your listing — {title}", editorial body + a link back to the listing. Best-effort.
- **`lib/listings/contact.ts`** — `useActionState` server action (mirrors submit.ts). Calls the function via `rpc()` **as the authenticated user** (no service role — the function is SECURITY DEFINER), then fires the email in its own try/catch so a mail failure never loses the logged contact. Maps MH001→gate / MH002,MH003→readable errors.
- **`app/listings/[id]/contact/page.tsx`** (new) — guest → `/login`; Tier-1 → interaction gate (copy **verbatim** from voice-and-copy.md, `[name]` from the listing's `author_name` byline); member → message form → "Your message is on its way." confirmation.
- **`app/listings/[id]/page.tsx`** — un-stubbed "Message the lister" link; **hidden on the viewer's own listing** (`author_id !== user?.id`).

**Prod test loop (all green):**
- **Guest:** curl `/listings/{id}/contact` on prod → **307 → /login** ✓ (deploy confirmed live).
- **Tier-1 / member / row / self-contact / cleanup:** a `tsx` harness against **prod Supabase + prod Resend** stood up a synthetic member (Gmail plus-alias `george.gardner480+contact@googlemail.com`), 26/26 logic checks passed: non-member rpc raises **MH001**; member rpc succeeds and returns founder email (`info@manhattanite.com`)+name+title; the `listing_contacts` row is correct (listing_id / sender_id / message); self-contact (synthetic member posts own listing, contacts it) raises **MH003**; deleting the synthetic auth.users row cascaded accounts+listings+contacts → **0 synthetic rows, founder untouched** (is_member=true, sponsor_id=null).
- **Email:** all sends landed at **info@manhattanite.com** (verified via Outlook MCP) — including the real `sendListingContact()` output, body rendered correctly ("Hi George Gardner, Contact Tester is interested… Reply to this email to reach them directly. See your listing →"). **Reply-to verified by construction**: code sets `replyTo: senderEmail`, Resend accepted the send + returned an id (it validates replyTo). Direct API read-back of the header was **not possible — the Resend key is send-only (restricted)**, and the Outlook MCP doesn't surface the raw Reply-To header. The 3 "failures" in the first harness run were that 401, not a bad reply-to.

**Decisions / notes:**
- **"I have an invite →" CTA omitted** from the interaction gate (rendered only "Apply for membership →" → `/apply`). The verbatim gate copy lists both CTAs, but `/invite` doesn't exist yet and this repo's **dead-link rule** (see the gating page) says don't ship broken links. Copy preserved in a comment; one uncomment away when the invite flow lands. Flag if it should point to `/login` instead now.
- **Self-contact tested with the synthetic member** (posts its own listing, contacts it → MH003), not the founder, since there's no founder browser session — same guard, same code path. The link-hidden UI is verified by code (`author_id !== user?.id`); the rendered Tier-1 gate / member form weren't clicked through with a logged-in browser session (function-layer + guest-redirect were the live checks).
- **3 test emails sit unread in info@** (two contact emails + one reply-to probe) — harmless; bin them when convenient. (Left them — never delete George's received mail without asking.)

**Out / follow-ups (unchanged):** in-app inbox (v2), admin moderation UI for `listing_contacts` (rows logged now, review UI later), rate-limiting/anti-spam beyond the member gate.

**Next:** signup-name + copy pass (A5, B1/B2/D3), then seed listings + photos (A6 — unlocks the second "does it look finished" walkthrough checkpoint), edit/delete listing UI, Phase 1.5 restyle.

---

## 2026-06-09 · Contact slice SPECCED — build plan + Claude Code prompt written (not built yet)

**What:** Specced the next build (the "capture the value" half of membership). Outputs:
- `outputs/Contact-Slice_Build-Plan_v1.md` — file-by-file plan.
- `outputs/Contact-Slice_Claude-Code-Prompt_v1.md` — copy-paste hand-off.

**Grounded in:** `mvp-spec.md` (contact = in-product form → forwards to lister's email; lister replies directly; no inbox till v2) + `voice-and-copy.md` (the interaction-gate copy already exists: "To message [name], you need a member account…"). The listing detail page already has the `/contact` link stubbed (commented "dead-link rule") ready to wire.

**Design spine:** contact is **member-only** (Tier-1 → interaction gate, not a redirect; guest → login). **Key call:** resolve the lister's email via a `SECURITY DEFINER` function `log_listing_contact()` (migration 0011), NOT by denormalizing email onto listings — the 0010 anon-teaser policy makes published listings publicly readable, so an email column would leak. The function enforces member + published + no-self-contact, logs a `listing_contacts` row, and returns the lister's email/name/title for the send. Email uses **Reply-To = the sender** so the lister replies directly (realizes the spec). New `sendListingContact` in emails.ts; new `lib/listings/contact.ts` action; new `/listings/[id]/contact` page.

**Migration 0011** (`listing_contacts` table + the function) to be run by Cowork via Chrome before deploy, same as 0010.

**Next:** George runs the Claude Code prompt → it pauses for the 0011 SQL → Cowork runs it → Claude Code deploys + tests (synthetic-member contacts a founder listing, verify row + email w/ reply-to). Then reconcile + mark SHIPPED. After contact: signup-name + copy pass, then seed listings + photos (→ unlocks the "does it look finished" checkpoint).

---

## 2026-06-09 · Navigation slice SHIPPED — tier-aware nav + teaser browse + my-listings (built, deployed, tested by Claude Code)

**Shipped** (George confirmed done; Claude Code built → committed → pushed/deployed → ran the prod test loop per its workflow):
- **`SiteNav.tsx`** — server-component tier-aware top bar mounted in `app/layout.tsx`. Guest: Listings / Log in / Create account. Account: Listings / **Apply for membership** / Profile / Log out. Member: Listings / Post a listing / My listings / Profile / Log out. Sign-out reuses the existing `/auth/sign-out` POST route (no new route).
- Redundant centered wordmarks stripped from the six interior pages; kept on the landing `/` hero + the four auth pages (login/signup/reset-request/reset-password) where they read as the page hero. Back links on detail/new/apply already existed — preserved.
- **`/listings/mine`** — member-only read view of the viewer's own published listings (no new RLS; posting publishes directly). Edit/delete UI still deferred.
- **Teaser (D1 implemented):** logged-out `/listings` now shows the 6 most recent published listings + a "create an account to see every listing" prompt (was: redirect to /login). **Migration `0010_listings_anon_teaser_read.sql`** — `listings_read_published_for_anon` (anon SELECT on published). **Applied to PROD by Cowork via Chrome MCP** ("Success. No rows returned.") before deploy, so logged-out browse never hit an empty page. The 6-cap lives in the query, not RLS (intentional MVP funnel; viewing is not the moat).
- tsc + eslint clean. Teaser used the plan's **generous default** (6 listings shown in full incl. detail) unless George flipped the `[TEASER CHOICE]` flag.

**Resolves walkthrough findings:** A1 (no nav), A3 (no browse path from account), A2-lite (my-listings entry), and D1 (public teaser).

**Production DB state now:** 10 migrations applied (0010 = anon teaser read policy live). Founder untouched.

**Still owed from the walkthrough:** A4 contact slice (biggest remaining product gap — the "capture the value" half of membership), A5 signup-name field, B1/B2 copy pass (incl. D3 account-vs-membership clarity), A6 seed listings + photos, edit/delete listing UI, Phase 1.5 restyle (C1–C3).

**Next:** tee up the **contact slice** (form on each listing → Resend email to the lister; logs a `listing_contacts` row for moderation history — per mvp-spec) OR the small **signup-name + copy pass**. George to pick.

---

## 2026-06-09 · Navigation slice SHIPPED — tier-aware nav + teaser browse, tested clean on prod

**Worked on:**
- Built + shipped the navigation spine and the three-tier model (D1: trust gate at the ACTION layer). Three commits, pushed, Vercel deployed:
  - `feat(nav)`: `app/components/SiteNav.tsx` (global server-component nav that renders only the links each tier can use), mounted in `layout.tsx`; new `app/listings/mine/page.tsx` (member-only, own published listings, mirrors the /apply gate); removed the redundant centered wordmark from the 6 interior pages (nav now carries the single wordmark); back links preserved.
  - `feat(listings)`: logged-out teaser browse — `/listings` shows 6 most recent published + a create-account prompt; `/listings/[id]` renders only for a teaser listing, else redirects to `/signup`. **Migration 0010** adds an `anon` SELECT policy on published listings (the data-layer side of D1); the 6-cap is enforced in the query, not the policy. (George ran 0010 in the SQL editor before deploy.)
- **Full test loop on prod (deployed code), all tiers pass:**
  - **Guest** (curl, logged out): `/listings` shows all 3 listings + the teaser prompt, nav = Listings · Log in · Create account (no Apply/Post/My-listings); a teaser detail → 200; a non-teaser id → 307 → `/signup`.
  - **Account** (synthetic, is_member=false): nav = Listings · Apply for membership · Profile · Log out; full browse (3 listings, no prompt); no Post/My-listings links; `/listings/new` and `/listings/mine` typed directly both → `/profile` (gates hold).
  - **Member** (same synthetic flipped is_member=true + one seeded listing): nav = Listings · Post a listing · My listings · Profile · Log out; `/listings/mine` lists the seeded listing; `/listings/new` form + "← Listings" back link; detail back link navigates to `/listings`.
  - Cleanup: deleted the synthetic account (cascaded its seeded listing) → 3 published listings, 2 accounts, founder untouched (is_member=true, sponsor_id=null).

**Decisions / notes:**
- **Used synthetic accounts, not the founder**, for account+member tiers (no founder password to log in via browser; keeps the founder fully untouched). The "lists the founder's 2 listings" check became "lists the member's own seeded listing" — same query path. Prod actually has **3** founder listings now, not 2.
- **Non-teaser redirect** tested with a non-existent id (all 3 real listings fall within the 6-cap, so there's no real non-teaser listing yet) — same redirect branch.
- **Auth pages keep their centered wordmark** (`/login`, `/signup`, `/reset-request`, `/reset-password`) — on a sparse auth page it reads as the page hero, like the landing page. Only the 6 interior app pages dropped theirs. Flagged for the Phase 1.5 visual pass if it ever looks off.
- Guest currently sees all 3 listings + the "see every listing" prompt because there are fewer than 6 listings — expected given the cap; the prompt is the funnel, not a bug.

**Next:** the next slice — contact (the bigger "capture the value" gap) or signup-name + copy pass. Edit/delete listing UI still out (RLS already permits author edit/delete; forms are a later slice).

---

## 2026-06-09 · Navigation slice SPECCED — build plan + Claude Code prompt written (not built yet)

**What:** Specced the next build (the highest-leverage walkthrough fix). Two outputs:
- `outputs/Navigation-Slice_Build-Plan_v1.md` — file-by-file plan.
- `outputs/Navigation-Slice_Claude-Code-Prompt_v1.md` — copy-paste hand-off for the Code tab.

**Grounded in the real wiring** (checked this session): no nav component exists; `app/layout.tsx` is bare; pages read session via `createClient()` → `getUser()` → `accounts` row; design tokens bone/ink/slate/park + Instrument Serif (`font-serif`), `mh-link` hover.

**Slice scope:** (1) `SiteNav.tsx` — a server-component tier-aware top bar (guest: Listings/Log in/Create account; account: Listings/**Apply**/Profile/Log out; member: Listings/Post/My listings/Profile/Log out); (2) mount in layout + strip redundant per-page wordmarks on interior pages; (3) back links on detail/new/apply; (4) `/listings/mine` member-only read view (no new RLS — posting publishes directly); (5) **teaser** for logged-out (`/listings` shows 6 most recent + create-account prompt) via migration **0010** (anon SELECT on published listings — the data-layer form of the D1 decision: viewing is a funnel, action is the wall; cap enforced in query, not RLS).

**Out of scope (flagged as follow-ups):** edit/delete listing UI, the contact slice, signup-name field, Phase 1.5 restyle.

**One default flagged for George to confirm:** teaser = 6 most recent listings shown *in full incl. detail* (generous, GDC-like) vs *cards-only* (detail needs an account). Plan assumes the generous version; one-line change either way.

**Next:** George runs the Claude Code prompt (will pause for the 0010 migration line, same as Slice C). When it reports back: reconcile, mark SHIPPED, tee up the contact slice or the signup-name + copy pass.

---

## 2026-06-09 · Walkthrough checkpoint RUN — punch list captured (Manhattanite_Walkthrough-Findings_v1.md)

**What happened:** Ran the agreed end-of-Slice-C live-site walkthrough (George clicked through manhattanite.com as a real Tier-1 account `george.gardner480@gmail.com`, non-member, while Cowork guided). George surfaced a rich punch list. Captured + sorted into `outputs/Manhattanite_Walkthrough-Findings_v1.md`, with each claim checked against the actual code/RLS.

**Two headlines:**
1. **No navigation exists** — confirmed no nav/header component anywhere. Every page is a URL-only island. Most "feels off" complaints reduce to this one fix.
2. **Listings are view-only for everyone, even members** — the contact feature isn't built (Contact link commented out on detail page, no route, no `listing_contacts` table). A member's only extra power today is *posting*. The "capture the value" half of Tier 2 is the biggest functional gap. Contact is a defined v1 slice (form → Resend email), just not shipped.

**Verified facts (from code):**
- Signup (`app/signup/page.tsx`) captures email + password only — **no name field**. Account identity shows the email until the user edits profile or applies. (George's ask: add name to signup.)
- Listings read policy = `status='published' and auth.uid() is not null` → **must be logged in to browse** ("Tier 0 → Tier 1 gate"). So a Tier-1 non-member CAN browse (RLS allows it); George's "no way to browse as non-member" is a *navigation* gap (no link from /profile), not access.
- No `middleware.ts`; components are forms only (no nav).
- Founder's 2 listings are text-only — image upload is built, just no photos uploaded.

**Strategic (referred to GDC, researched this session):** GDC = register free → browse; must be a member (sponsored by 3) to respond/publish; signature feature is the connection/trust chain. Open decisions logged in the doc:
- **D1 (decide first):** should logged-out visitors see listings (public preview) to draw people in? Manhattanite is currently *stricter* than GDC (login required to see anything). This shapes the nav slice — settle before building nav.
- **D2:** mutual-connections-via-sponsors — already in the v2 vision (graded trust / Connector tier, strategy-blueprint.md). Post-MVP.
- **D3:** make account-vs-membership distinction unmistakable (copy + IA).

**Suggested next sequencing (not decided):** (1) Navigation slice [highest leverage], (2) Contact slice [biggest product gap], (3) signup-name + copy pass, (4) seed listings + photos → unlocks the "does it look finished" checkpoint, (5) Phase 1.5 design, (6) strategic decisions (D1/D3 now, D2 v2).

**Next:** George to react to the findings doc + settle D1 (public browse) so the navigation slice can be specced.

**Update (same session) — D1 DECIDED + tier model locked:** George approved the **three viewing-layer model (trust gate at the ACTION layer, not the VIEWING layer)**: logged-out = teaser; account (Tier 1) = full browse, acts on nothing, is an on-ramp/conversion step (funnel + application container); member (Tier 2) = contact/post/sponsor. Guardrail: never give Tier 1 transactional power. Logged in `COMPANY/memory/decisions.md` (Product) + the findings doc D1 (now marked DECIDED). **Navigation slice is now unblocked** and must be built around this model. Likely next build: spec the navigation slice (nav around the 3 tiers) — then the contact slice.

---

## 2026-06-09 · /apply Slice C SHIPPED — three membership emails live, full loop tested clean on prod

**Worked on:**
- Committed (2 commits) + pushed → Vercel deployed. `feat(apply): membership emails…` (emails.ts, submit.ts, scripts/approve-application.ts, package.json + lock, migration 0009) and `docs: Slice C copy + build plan + Claude Code prompt + memory`.
- **Full loop tested on prod against the deployed code** using a synthetic applicant on a readable inbox (`george.gardner480+slicec@googlemail.com`, a Gmail plus-alias, so the applicant-facing emails could be verified; founder stayed member+sponsor):
  - Submit `/apply` → pending row written; **both** on-submit emails confirmed: applicant confirmation ("We've got your application.", Gmail) + the refined reviewer ping ("New membership application — Marcus Halloway", info@) with the `npm run approve -- <id>` action block leading, SQL fallbacks below, and `\n`→`<br/>` in the about paragraph. Ping's embedded id matched the row.
  - `npm run approve -- <id>` → printed "Approved Marcus Halloway (…) — welcome email sent."; DB atomic (is_member=true, sponsor_id=founder, status approved, reviewed_at set); **"You're in." welcome confirmed in Gmail**; approved member could load `/listings/new`.
  - Cleanup: deleted synthetic auth.users row (cascaded) → 0 applications, founder untouched (is_member=true, sponsor_id=null, name "George Gardner").

**Caught + handled:**
- **First test run hit OLD code** — prod was still serving the pre-Slice-C build (changes weren't deployed yet), so the first submit fired the old inline ping and no confirmation. Resolved by deploying first, then re-testing. (The approve script + welcome were validatable locally before deploy since the CLI runs against prod DB.)
- **Resend quota false alarm** — `x-resend-*-quota` response headers looked tiny; flagged to George, who confirmed they're rate-limit headers, not send budget (only 6 sends in 15 days). No risk.
- **Test-inbox gotcha** — first run used `george@manhattanite.com` as applicant, which isn't a readable/deliverable inbox; switched to the Gmail plus-alias so confirmation + welcome could actually be read.

**Reconciled:** updated `Manhattanite_Apply-Emails_v1.md` reviewer-ping action block to match what shipped (leads with `npm run approve`, raw SQL as no-email fallback).

**Next:** **Run the walkthrough checkpoint** (the agreed live-site pause). Caveat to repeat: landing page (Phase 1.5 pending) + thin content (2 listings, placeholder "John Robinson" sponsor) still look unfinished.

---

## 2026-06-09 · /apply Slice C build STARTED (Claude Code) — code written, prereqs cleared, test loop pending

**Worked on:**
- Claude Code built the Slice C code: `lib/applications/emails.ts` (3 best-effort Resend sends — applicant confirmation, reviewer ping, member welcome), wired confirmation + ping into `submit.ts` (insert now returns id), and `scripts/approve-application.ts` + `npm run approve` (Option A CLI). tsc + eslint clean on changed files. **Nothing committed yet.**
- **Approval connection = Option (i):** service-role key via supabase-js `rpc()` (reuses existing dep, no `pg`). Required migration `0009_approve_grant_service_role.sql` because 0008's `revoke all from public` stripped service_role's execute.

**Prereqs cleared this session (George + Cowork):**
- George pasted `SUPABASE_SERVICE_ROLE_KEY` into `.env.local` (gitignored). Used the **new Supabase `sb_secret_...` secret key** (Project Settings → API → Secret keys), not the legacy service_role JWT — functions identically with supabase-js.
- **Migration 0009 applied to PROD** by Cowork via Chrome MCP → Supabase SQL editor (new untitled snippet, postgres role): `grant execute on function public.approve_application(uuid, uuid) to service_role;` → "Success. No rows returned." Auto-saved as snippet "Grant Execute on Approve Application Function" (harmless).
- Synthetic-applicant test approach confirmed (founder stays member+sponsor; throwaway account applies). **Good catch by Claude Code:** the original plan's "flip founder is_member=false then apply as founder" can't pass — approve requires a member sponsor, and the founder is the only member.

**Next:** George told Claude Code to run the prod test loop (apply → `npm run approve` → confirm all 3 emails fire → cleanup). When it reports back: reconcile the one-line copy divergence in `Manhattanite_Apply-Emails_v1.md` (ping leads with `npm run approve`), mark Slice C SHIPPED, then **run the walkthrough checkpoint** (the agreed live-site pause). Caveat to repeat then: landing page (Phase 1.5 pending) + thin content still look unfinished.

---

## 2026-06-08 · /apply Slice C copy lane DONE — three membership emails drafted (build lane still owed)

**Worked on:**
- Drafted `outputs/Manhattanite_Apply-Emails_v1.md` — send-ready copy for the three Slice C emails, grounded in `voice-and-copy.md` and run through the five-point voice test (all pass):
  1. **Applicant confirmation** (on submit) — subject "We've got your application.", verbatim from the voice guide's "Application received" block, no name greeting, no CTA. Static copy.
  2. **Reviewer ping** (on submit, to info@) — subject "New membership application — {{name}}", functional/internal register, lists neighborhood/occupation/sponsor-reference/about AND embeds the exact `approve_application()` / `decline_application()` SQL so the email IS the review tool.
  3. **Welcome / "You're in."** (on approve) — subject "You're in.", verbatim from the "Application approved" block, CTA → /listings. The brand moment.
- Sender convention set: all applicant-facing sends from `Manhattanite <applications@manhattanite.com>`; ping to `info@manhattanite.com`. Resend already domain-verified, no DNS work.

**Decided:**
- **No decline email at seed** (George, 2026-06-08) — declined applications stay silent for now, revisit later. Matches the plan's lean.
- **No `needs_info` email either** — re-application is freed by the one-pending index; any "why" is a manual note for now. Flagged in the doc if we want it built.
- **Cold "You're in." open over "Hi {{first_name}},"** — kept the stronger cold open; first-name derivation noted as available if George prefers warm.

**Blockers / open threads:**
- **Build lane not done.** Copy is ready; the [Claude Code] work is still owed: `lib/applications/emails.ts` (3 templated sends), wire confirmation + ping into `submit.ts`, and a thin server action wrapping `approve_application()` that fires the welcome on success. I offered to write the full Slice C build plan (Slice 5/6 level of detail) on George's word.
- **End of Slice C = the agreed walkthrough checkpoint** (preferences.md, 2026-06-08). Once the build lane ships and the apply→approve→welcome loop fires for real, proactively run the guided live-site walkthrough. Caveat to repeat then: landing page (Phase 1.5 pending) + thin content (2 listings, no photos, placeholder sponsor) still look unfinished.

**Next:**
1. George's word → I write the Slice C build plan → hand to Claude Code → wire the three sends.
2. Live-test the full loop on prod, then run the walkthrough checkpoint.

**Update (same session):** Build plan + Claude Code hand-off prompt now written.
- `outputs/Apply-Route_Slice-C-Build-Plan_v1.md` — full file-by-file build plan.
- `outputs/Apply-Route_Slice-C_Claude-Code-Prompt_v1.md` — copy-paste prompt for the Code tab.
- **DECIDED — welcome-email trigger = Option A, the CLI script** (George, 2026-06-08). Approval moves from raw SQL to `npm run approve -- <app-id>`, a `scripts/approve-application.ts` that calls `approve_application()` then fires the "You're in." welcome via Resend. Rationale: SQL functions can't send email; a Node action layer is needed, and at founder-only seed volume a CLI script beats an Edge-Function webhook or a (deferred) /admin page. **Prerequisite George must do once:** paste a privileged secret (service-role key or DB connection string) into `.env.local` (gitignored, never committed) — Claude Code will specify the exact line. Reviewer-ping copy now leads with `npm run approve` (one-line divergence from the copy doc, to be reconciled back after build).
- **Build is now in George's court (Claude Code).** When it reports back: reconcile the copy doc, mark Slice C SHIPPED, run the walkthrough checkpoint.

---

## 2026-06-08 · /apply Slice B SHIPPED — approve/decline transaction (migration 0008), tested clean on prod

**Worked on:**
- Wrote + applied `supabase/migrations/0008_approve_application.sql` to production. Three SECURITY DEFINER functions: `approve_application(app_id, sponsor_id default founder)` — the atomic 3-way transaction (account → is_member=true + sponsor_id set; application → approved + reviewed_at), with guards (app exists, app is pending, account not already a member, sponsor must be a member); `decline_application(app_id, note)` → status declined; `request_more_info(app_id, note)` → status needs_info. None granted to `authenticated` — called from the SQL editor (postgres) during seed; expose via a narrow admin path when an /admin page lands.
- **Full happy-path tested on prod** by standing up a synthetic non-member applicant (inserted `auth.users` row → the 0001 trigger auto-created the accounts row → inserted a pending application), then calling `approve_application`. Verified atomically: is_member true, sponsor_id = founder, status approved, reviewed_at set, sponsor name resolves to "George Gardner". Cleanup = single `delete from auth.users where id=…` which cascaded to accounts + applications. Final check: 0 synthetic rows, 0 applications, founder untouched (is_member true, sponsor_id null).

**Decided:**
- **Sponsor defaults to the founder** (`85ce5315-…`) when `approve_application` is called without a sponsor — the seed-phase default. Pass an explicit sponsor to override.
- **`needs_info` frees re-application** — the 0007 one-pending partial unique index only covers status='pending', so moving an app to needs_info lets the applicant submit a fresh one via /apply. Intended back-and-forth path for v1.
- **SQL-driven review, no /admin page** (per the Slice plan). Approve from the SQL editor: `select public.approve_application('<app-id>');`.
- **Synergy confirmed:** writing `sponsor_id` fires the 0006 byline trigger, so approving a member also lights up their listings' "· sponsored by [name]" automatically.

**Blockers / open threads:**
- `decline_application` and `request_more_info` not independently tested (simple UPDATE-with-guard; happy path of approve was the priority). Low risk; exercise on first real use.
- No deploy needed — these are DB functions, already live in prod. Commit is just the migration file for version control.
- Scratch SQL snippet "Membership Applications with RLS Controls" still in George's SQL editor (now holds the last verification query). Harmless.

**Next:** Slice C — the three emails (applicant confirmation, reviewer ping refinement, the "you're in" welcome fired on approval). **End of Slice C = the agreed pause/walkthrough checkpoint** (see preferences.md) — proactively flag it and help George test the full loop.

---

## 2026-06-08 · /apply Slice A SHIPPED — built, committed, deployed, live-tested clean on prod

**Live test loop (after George ran the Claude Code commit → Vercel deployed):**
- `/apply` as a member → redirects to `/profile` ✓ (deploy confirmed live + member-gate works).
- Flipped founder `is_member=false` via SQL. `/apply` → form rendered with **name prefilled "George Gardner"** (prefill works); neighborhood blank (account had null), occupation/about required.
- Filled neighborhood "West Village" / occupation "Founder, Manhattanite" / about text, submitted via the real server action.
- Redirected to `/apply` showing the **confirmation state** ("Thanks for applying." + received copy, no form) ✓.
- DB verified: one `applications` row (status `pending`, occupation/about/neighborhood snapshot, sponsor_reference NULL). Accounts write-back verified: **neighborhood null → "West Village"** (the design-win — applying populates the profile), name intact, is_member still false (pending ≠ approved) ✓.
- Revisited `/apply` → still confirmation, no second form ✓ (one-pending guard holds).
- Reviewer ping email sent to info@manhattanite.com (one real test email in the inbox).
- **Cleanup:** deleted the test application row, restored `is_member=true` and `neighborhood=null`. Final verify: app_count 0, is_member true, name "George Gardner", neighborhood NULL. `/apply` → `/profile` again. Account is exactly as before the test.

**Slice A status: DONE.** Next is Slice B (approve/decline atomic transaction, migration 0008).

---

## 2026-06-08 · /apply Slice A BUILT — code written, migration 0007 applied to prod, RLS smoke-tested

**Worked on (build):**
- Greenlit and built Slice A in full. Five files written to the repo: `supabase/migrations/0007_applications.sql` (new), `lib/applications/submit.ts` (rewritten — Airtable dropped, writes to Supabase, useActionState shape, writes name+neighborhood back to accounts then inserts the application, Resend ping to George, maps 23505→"already applied"/42501→/profile), `app/components/ApplicationForm.tsx` (refactored to useActionState; fields name/neighborhood/occupation/about/sponsor_reference, email from session, CTA "Apply for membership"), `app/apply/page.tsx` (new route — gates no-session→/login, member→/profile, pending row→confirmation state, else prefilled form; copy verbatim from voice-and-copy.md), `app/profile/page.tsx` (apply CTA uncommented + pointed at /apply).
- **tsc + eslint clean** in the sandbox against the changed files (exit 0 both).
- **Migration 0007 applied to PRODUCTION** via Cowork → Chrome MCP → Supabase SQL editor (postgres role, new untitled snippet so no saved migration overwritten). "Success. No rows returned."
- **RLS smoke-tested on prod:** structural check returned table_exists=1, policy_count=4, index_count=3. Member-block test (impersonate founder is_member=true inside a `begin…rollback`) correctly raised `42501: new row violates row-level security policy` — the `not is_member()` insert gate fires. Founder state untouched (rolled back). The "non-member CAN apply" half is deferred to the live loop.
- **Commit handed to Claude Code** via a self-contained prompt (Cowork can't push to the local repo): `feat(apply): membership application form + applications table + RLS (Phase 2 Slice A)` for the 5 code files, plus a `docs:` commit for the two plan docs + memory + output-log.

**Worked on (planning, earlier in session):**
- Produced two planning docs in `outputs/`:
  1. **`Apply-Route_Plan_v1.md`** — the three-slice shape. A: form + application row (~1 session). B: approve/decline atomic transaction (~1 session, SQL-driven). C: the three emails (~½–1 session). Total ~2–3 sessions.
  2. **`Apply-Route_Slice-A-Build-Plan_v1.md`** — full hand-to-Code build plan for Slice A: migration `0007_applications.sql` (applications table, status enum, one-pending-per-account partial unique index, RLS using existing `is_member()`/`is_admin()` helpers), `submit.ts` rewrite (Airtable dropped, writes to Supabase, useActionState shape), `ApplicationForm` refactor (name/neighborhood/occupation/about/sponsor_reference; email from session), new `app/apply/page.tsx` (gates + pending-confirmation state), CTA wiring, prod test loop, commit message. All copy lifted verbatim from `voice-and-copy.md`.

**Decided:**
- **Supabase-only, drop Airtable** from the apply flow (Airtable formally sunset later per CLAUDE.md).
- **SQL-driven review for v1** (Slice B), `/admin` page deferred to later polish — at seed volume, approving is a couple of clicks in the Supabase dashboard against people George knows.
- **Application is account-bound** — applicant is already logged in; email from session, name/neighborhood prefilled from accounts and written back on submit. Design win: applying sets the byline `name`, closing the Slice 2 "name not collected" gap for real members.
- **`name` required at apply time** (stricter than `/profile/edit` where it's optional) — pending George's final confirm.

**Decided during build:**
- **`name` required at apply time** — confirmed and implemented (server + client). Stricter than `/profile/edit`. They can still edit/clear on the profile later.
- **Neighborhood is a plain text input** on the apply form (prefilled from accounts), not the old curated waitlist `optgroup` select — keeps the write-back to `accounts.neighborhood` simple and matches `/profile/edit`. Noted as a deliberate simplification of the build-plan, which had floated keeping the select.

**Blockers / open threads:**
- **Awaiting George: run the Claude Code commit prompt → Vercel deploy.** `/apply` will 404 in prod until then. Once deployed, the live test loop runs (apply as founder with is_member flipped false; verify confirmation state + applications row + accounts name/neighborhood updated + ping email; revisit; clean up row + restore is_member=true).
- **Read-own RLS isolation not independently tested** (only one account exists) — same limitation as prior slices; policy shape is identical to proven tables.
- A scratch SQL snippet "Membership Applications with RLS Controls" was left in George's Supabase SQL editor (contains the verification query, not a migration). Harmless; delete if tidying.
- Legal Tier-1 items (entity/TOS/privacy/founder identity) still open and still gate any *public* go-live — apply flow collects real personal data; fine for seed/demo only.

**Next:**
1. George runs the commit prompt → says "deployed" → Claude drives the live test loop.
2. Then Slice B (approve/decline atomic transaction, migration 0008), then Slice C (emails).

---

## 2026-06-04 · Phase 4 Slice 2 complete — /profile/edit shipped + cosmetic fix on /profile link stacking

**Worked on:**
- **Closed the "name not collected at signup" thread that's been open since Slice 2.** Members can now edit their own name, neighborhood, and bio via `/profile/edit`. No migration needed — `accounts.name`, `accounts.neighborhood`, `accounts.bio` already exist from migration 0001; the RLS "accounts: update own row" policy from 0001 is the gate; the `protect_account_columns` trigger from 0001 backstops the protected fields (role / is_member / sponsor_id / email).
- **`lib/profile/update.ts`** — server action. Trims inputs (empty string → null so the column actually reverts rather than storing empty), validates bounds (name 2-80 if provided, neighborhood ≤60, bio ≤500). Only passes `name` / `neighborhood` / `bio` to the UPDATE — even an attempt to pass the protected columns would be rejected by the 0001 trigger. Returns `{error: string | null}` for `useActionState`. On success: `redirect('/profile')` so the new values render and any rename has already propagated.
- **`app/components/ProfileEditForm.tsx`** — client form. Three fields: name (text, "(first and last)" hint), neighborhood (text, "(optional)" hint), bio (textarea, "(optional, a sentence or two)" hint). Same `FIELD_BASE` / `LABEL` / `HINT` classes as `NewListingForm` / `ApplicationForm` — visual consistency across every form. CTA: "Save changes". `defaultValue` pattern so the form pre-fills without forcing controlled-input boilerplate.
- **`app/profile/edit/page.tsx`** — Server Component shell. Auth gate (no session → `/login`), reads current row via accounts read-own RLS, passes name/neighborhood/bio to the form. Page title "Who are you?" — matches the interrogative-question voice of `/listings/new`'s "What have you got?".
- **`app/profile/page.tsx`** — added "Edit profile →" link in BOTH the member CTA block AND the Tier-1 nudge block. Important detail: the link belongs in both branches because tier-1 holders also need to fill out their profile before/during the apply flow.
- **End-to-end test on prod, full round-trip:** opened `/profile/edit`, changed name from "George Gardner" → "George G. Gardner", saved, verified redirect back to `/profile` with the new name rendering on the header, verified both founder listings on `/listings` now read "LISTED BY GEORGE G. GARDNER · SPONSORED BY JOHN ROBINSON" — the AFTER UPDATE trigger from migration 0006 propagated the rename to both author rows automatically. Then went back through the form and restored "George Gardner". The cross-slice plumbing works exactly as designed.
- **Caught and fixed a cosmetic bug** during the test: the two secondary links on `/profile` ("Browse listings →" and "Edit profile →") were rendering on the same line ("BROWSE LISTINGS →EDIT PROFILE →") instead of stacked. Root cause: `mh-link` is presumably `display: inline-block` or similar, and the `block` Tailwind class I added wasn't winning the specificity battle. Fix: wrap each Link in its own `<div>` inside the `space-y-4` parent so the stacking comes from the wrapper divs (always block by default), not from the Link itself. Same structural pattern as the original single-link version; just two of them now.

**Decided:**
- **Name is optional, not required.** Could have enforced name as required to push toward the GdC-style convention from Slice 1. Chose optional because: (a) the byline `renderByline()` already handles null gracefully with "a member" fallback, (b) requiring it on save would block existing signups who don't have a name yet from saving ANY profile change, (c) clearing the name is a valid user choice that the system supports cleanly. Convention is enforced by social pressure + the visible byline, not by validation.
- **Empty string → null, not stored as empty string.** Cleaner database state. A future query like `SELECT * FROM accounts WHERE name IS NULL` does what you'd expect.
- **No new SQL trigger.** The Slice 1 trigger (`accounts_propagate_byline_changes`) already handles name + sponsor propagation; this slice just ships the UI that triggers it. Confirms the trigger pattern is the right separation of concerns — UI changes don't require DB changes for downstream effects.
- **"Edit profile →" link on the Tier-1 (non-member) branch too,** even though no `/apply` route exists yet. Tier-1 holders need to set a name before they apply for membership; the link lives where they'll look for it.
- **Cosmetic link-stacking fix bundled into the slice, not deferred.** Caught it during the live test; the fix is a 6-line structural change to the same file. Cleaner to ship it now than carry a known visual bug.

**Blockers / open threads:**
- **Slice ships in two commits, not one.** The first commit (`feat(profile)`) was already pushed before the cosmetic bug was caught. The fix needs a small follow-up commit (`fix(profile): stack member CTAs vertically`). George needs to run a second Claude Code prompt for it.
- **No `/apply` route yet** — Tier-1 holders can now edit their profile but still can't submit an application; the membership path is the next obvious gap.
- **Profile-edit doesn't expose email change.** Intentional — changing email touches Supabase Auth and the protect_account_columns trigger blocks it on the public.accounts row. Email change is a separate flow (Supabase Auth's built-in `updateUser({email})` with confirmation), worth its own slice when needed.
- **Two threads from earlier slices still open, unchanged:** image-upload orphan-file cleanup not built; 'John Robinson' is still fake placeholder data on the founder's bylines (now safer to remove once a real sponsor exists, since other members can have real names of their own).

**Next session:**
1. **`/apply` route** — Phase 2 proper. The big one. Revives the dormant `lib/applications/submit.ts` into a real apply/approve flow. Multi-slice work: form, application creation, admin review (likely SQL-driven for v1), sponsor assignment on approval, email notifications. ~2-3 sessions total.
2. **Or: seed listings load** — needs real photos sourced first (external work).
3. **Or: small polish round** — landing page Phase 1.5 rework, contact form on listing detail, search/filter on browse, image optimization (Next.js `<Image>`).

---

## 2026-06-04 · Phase 4 Slice 1 complete — author/sponsor byline denormalized + GdC-style full-name convention picked

**Worked on:**
- **Closed the "Listed by a member · sponsored by —" byline gap that's been open since Slice 4.** Bylines on both browse and detail pages now render with real names on both halves: "Listed by George Gardner · sponsored by John Robinson."
- **Migration `0006_listings_byline_denorm.sql` — applied to prod.** Adds `author_name text` and `sponsor_name text` columns to `public.listings`, both nullable. Adds two triggers: a `BEFORE INSERT` trigger `populate_listing_byline()` (SECURITY DEFINER, looks up the author's `name` + the author's sponsor's `name` from accounts, sets both columns on the new row); and an `AFTER UPDATE` trigger `propagate_account_changes_to_listings()` (fires only `WHEN name IS DISTINCT FROM OLD.name OR sponsor_id IS DISTINCT FROM OLD.sponsor_id`, propagates renames to every affected listing). Backfilled the two founder listings from current accounts state, then manually overrode `sponsor_name = 'John Robinson'` on both as a demo-visibility placeholder until real sponsored members exist.
- **Set the founder's accounts.name = 'George Gardner'** (it was null from the Slice 2 "name not collected at signup" thread). Full-name not initial — see the GdC convention decision below.
- **Code changes:** `app/listings/page.tsx` and `app/listings/[id]/page.tsx` both drop the embedded `author:accounts(name)` select (which silently returned null for other members because of `accounts` read-own RLS) and read `author_name` + `sponsor_name` directly from the listings row. A new `renderByline(authorName, sponsorName)` helper handles the conditional: author always shown ("a member" fallback if null), sponsor portion appears only when `sponsor_name` is present — so a listing with no sponsor renders a clean "Listed by [Name]" with no trailing dash. Helper duplicated in both files (kept local; not worth a shared utils module yet).
- **End-to-end test on prod.** Browse + detail both show full bylines on the seed listings. Manually NULL'd `sponsor_name` on the Ceccotti row via the Supabase JS client, reloaded `/listings`, confirmed it renders "LISTED BY GEORGE GARDNER" with no sponsor portion (the conditional branch); restored sponsor_name to 'John Robinson'. Bonus: tested the `accounts_propagate_byline_changes` trigger by renaming George's accounts.name to a test value, reading the listings (saw the new name propagate), then renaming back — both round trips ran cleanly with no errors.

**Decided:**
- **GdC-style full first + last name on bylines, not Vinted-style initial.** George originally picked "George G" / "John R." (Vinted convention). After looking up how Gens de Confiance handles it — they require full first + full last, no pseudonyms, with the Terms framing "members agree that their first name, last name, and profile photo will be visible to others" — switched to "George Gardner" / "John Robinson." This is a brand-anchoring call: full names read more committed and editorial, matching the Soho House / GdC voice anchor better than the lighter consumer-marketplace convention. Privacy trade-off (full name + neighborhood = identifiable) accepted — the trust mechanic IS the product, and being named is the visible side of being vouched for. Logged in `COMPANY/memory/decisions.md` under a new Brand entry.
- **Denormalize over public-profile RLS policy or SECURITY DEFINER view.** Three options considered: (a) add a SELECT RLS policy on accounts that lets authenticated users read other rows — rejected because Postgres RLS is row-level, not column-level, so this would expose email/role/is_member/bio too; (b) `SECURITY DEFINER` view exposing only id+name+sponsor_id — rejected because PostgREST's embedded-select syntax doesn't cleanly traverse view-to-view nested joins (no FK metadata on views); (c) denormalize `author_name` + `sponsor_name` onto listings with triggers handling rename propagation. Picked (c) — lowest-friction pattern that keeps the trust mechanic intact and keeps reads to a single table. Trade-off: an `UPDATE accounts SET name = '…'` now does up to 3 follow-on UPDATEs on listings (author's own, plus listings whose author is sponsored by this account). At MVP volumes this is trivial; at scale it stays bounded by a member's posting + sponsorship reach.
- **'John Robinson' as the demo sponsor name.** George has no real sponsor (`accounts.sponsor_id` stays null on his row). Without an override, every founder listing would render "Listed by George Gardner" with no sponsor portion — which is correct logically but hides the byline mechanic from anyone reading the page. Manual `UPDATE` post-trigger sets `sponsor_name = 'John Robinson'` on both founder listings as a placeholder. When a real sponsor relationship is established on George's accounts row, the AFTER UPDATE trigger will overwrite this automatically.
- **Trigger conditional uses `WHEN (new.name IS DISTINCT FROM old.name OR new.sponsor_id IS DISTINCT FROM old.sponsor_id)`** so the propagation function doesn't fire on every accounts update (e.g. is_member flip, neighborhood edit, bio edit). Cheap optimization that also keeps the trigger's intent obvious from the trigger definition.
- **`renderByline()` helper duplicated in both page files**, not extracted to a shared `lib/listings/byline.ts`. The helper is 4 lines; the duplication cost is lower than the indirection cost. Easy to extract later if a third surface needs it.

**Blockers / open threads:**
- **'John Robinson' is fake data on the founder's listings.** Anyone reading those bylines closely (and knowing Manhattanite is real) will notice the sponsor doesn't exist. Acceptable for demo + advisor conversations during seed phase; not acceptable for any public-facing surface. Replace before any non-founder sees the network — either by approving real members who become real sponsors, or by removing the override.
- **Name not collected at signup** (still open from Slice 2). Real members signing up via `/signup` won't have a `name` set, so their bylines will render "Listed by a member" (the fallback) until they edit their profile. Profile-edit UI doesn't exist yet. Two paths to close this: add a name field to `/signup`, or build a `/profile/edit` page. Likely the second — name + neighborhood + bio belong on a profile editor, not a signup form.
- **Cowork JS tool blocks "[BLOCKED: Sensitive key]" on name-like strings returned from the supabase-js client during the rename test.** Didn't break the test — the underlying data was correct, just redacted in the tool's display. Worth knowing for future browser-side data inspection.
- **Two threads from Slices 4/5 still open, unchanged:** no `/apply` route (members still created by SQL flip); image upload orphan-file cleanup not built.

**Next session:**
1. **Profile editing.** Build `/profile/edit` (or `/account`) so members can set their own `name` (+ neighborhood, bio). Reuse the protected-columns trigger from 0001 — those columns are already safe under member-side updates. This is the unblocker for real members showing real names on bylines.
2. **Or: `/apply` route.** Phase 2 proper. Revives `lib/applications/submit.ts` into a real apply/approve flow.
3. **Or: seed-data load.** Load the 27 listings from `outputs/Manhattanite_Seed-Listings_v1.md` (after sourcing real photos — picsum-random would defeat the brand).

---

## 2026-06-04 · Phase 3 Slice 6 complete — image upload via Supabase Storage shipped + CLAUDE.md housekeeping

**Worked on:**
- **Housekeeping — CLAUDE.md Part 2 refreshed.** The "What this repo is" paragraph still claimed Phase 1 was beginning and Supabase was "planned, not yet wired"; the Active migrations section still listed the waitlist→gating page transition as in-flight. All stale. Replaced with the current truth: through Phase 3 Slice 5, Supabase wired in Slice 1, gating page shipped Slice 3.5, two real founder listings live in prod. Added a fresh Active-migrations list naming the remaining open threads (no `/apply` yet, author/sponsor name rendering, image upload deferred to this slice, landing page flagged for Phase 1.5). The magic-link → email+password line was already correctly fixed in an earlier session; left intact.
- **Migration `0004_listings_images.sql` — applied to prod.** Adds `images jsonb NOT NULL DEFAULT '[]'::jsonb` to `public.listings` with CHECK constraint `jsonb_typeof(images) = 'array' AND jsonb_array_length(images) <= 6`. The 6-cap is enforced in three places (client uploader, server action, DB CHECK) — belt + braces + suspenders. Sanity query returned both existing rows with `n = 0`, exactly as expected.
- **Migration `0005_storage_listing_images.sql` — applied to prod.** Creates a **private** Storage bucket `listing-images` (5 MB file limit, MIME whitelist of `image/jpeg`, `image/png`, `image/webp`). Adds 3 RLS policies on `storage.objects` scoped to that bucket: `listing_images_member_upload` (only members can upload, only into a folder whose first segment is their own `auth.uid()`), `listing_images_authenticated_read` (any signed-in user — mirrors the listings read gate), `listing_images_owner_delete` (only the uploader, on their own files). `is_member()` SECURITY DEFINER helper from 0003 carried forward — same recursion-safety pattern as `is_admin()`.
- **Three RLS policies verified live via `pg_policy` query** before any UI was built. All three returned with correct `polcmd` (r, a, d). Same smoke-test-first discipline as Slice 4.
- **`lib/storage/upload-listing-image.ts`** — client helper. Validates MIME + size on the way in, builds the path `{user_id}/{crypto.randomUUID()}.{ext}`, calls `supabase.storage.from('listing-images').upload(...)`, returns `{ok, path}` or `{ok: false, error}`. Path convention is load-bearing for the RLS upload policy — the first folder segment IS the ownership check.
- **`lib/storage/sign-image-urls.ts`** — server helper. Takes `string[]` of paths, returns `Map<path, signedUrl>` via `createSignedUrls(paths, 3600)`. One round-trip per page render. Missing/failed paths simply don't show up in the map, so callers default cleanly to "no image."
- **`app/components/ImageUpload.tsx`** — new client component. Upload-on-select (not on-submit): each chosen file uploads immediately, returns a path, the path goes in local state alongside an `URL.createObjectURL(file)` thumbnail. Submit ships the paths as one JSON-encoded hidden `<input name="images">`. Grid of 3 thumbs per row, hover-reveal "Remove" button, "Add photos" / "Add more" label switching, inline error display, "The first photo is the cover." caption. Voice: Manhattanite-cultivated, no "Select photos" / "Choose files" generic language.
- **`app/components/NewListingForm.tsx`** — wired ImageUpload. Now takes `userId: string` prop, replaces the "Photos coming soon" placeholder.
- **`app/listings/new/page.tsx`** — passes `user.id` to the form.
- **`lib/listings/create.ts`** — parses + validates the `images` JSON field. Each path must be a string AND must start with `{user.id}/` so a member can't be tricked into attaching someone else's uploaded files to their own listing (the storage RLS already prevents the upload but the server action backstops the linkage). Stores as `[{path}]` jsonb objects, leaving room for per-image alt text / dimensions / sort-order later.
- **`app/listings/page.tsx`** — collects every listing's first image path, batch-signs them in one `signImagePaths` call, then maps back per card. Cards with a cover render a 4:3 aspect-locked `<img>` with a hover-scale effect; cards without an image branch cleanly to title+desc+byline.
- **`app/listings/[id]/page.tsx`** — batch-signs every image path on the listing, then renders the gallery (first image 4:3, subsequent images at natural aspect, all `object-cover bg-ink/5`). Plain `<img>` tags (not Next.js `<Image>`) to avoid configuring `remotePatterns` for the Supabase storage domain — image optimization is a polish slice.
- **tsc + eslint clean locally.** Commit `feat(listings): image upload via Supabase Storage (Phase 3 Slice 6)` (paths: `supabase/`, `lib/`, `app/`, `CLAUDE.md`). George ran the commit in Claude Code. Vercel deployed automatically.
- **End-to-end test on prod.** Posted a real listing ("Loft on Greene Street with three big windows", SoHo, $5,400/mo, 1bd/1ba, 3 photos) by driving Chrome via the MCP. Detail page rendered title + price + 4:3 cover + the other two photos at natural size + description + bedrooms/bathrooms/neighborhood. Browse page rendered the new card WITH cover; the two existing founder listings (Ceccotti table, West Village apartment) rendered cleanly WITHOUT cover, proving the `coverUrl &&` conditional works both ways. Author byline still shows "a member" + sponsor "—" (the known stale-display threads from Slices 4/5, unchanged).
- **Smoke test cleaned up.** Deleted the listing row + 3 storage objects via the Supabase JS client from the browser (RLS owner-delete policies allowed both). Confirmed the table is back to the original two founder listings. Also deleted the local `.test-uploads/` folder I'd briefly created when trying to work around the file_upload MCP tool.

**Decided:**
- **Private bucket + signed URLs over public bucket.** Costs an extra round-trip per page render but keeps the Tier 0 → Tier 1 read wall real on pixels. A public bucket would have let anyone with a direct image URL bypass the read gate for the image bytes (text was already gated). Trust mechanic is the product; the wall has to be real everywhere.
- **6-photo cap.** George picked the recommended option. Tight enough to push posters toward their best shots, generous enough for apartments. Enforced in client + server + DB.
- **Upload-on-select, not on-submit.** Faster perceived submit. Tradeoff: orphan files in Storage if a user abandons the form mid-way. A cleanup job that prunes anything not referenced by a listing is a known future polish — not v1 scope.
- **Plain `<img>` tags, not Next.js `<Image>`.** Avoids configuring `remotePatterns` for `*.supabase.co`. Image optimization is a polish slice, not Slice 6 scope.
- **Migrations applied via Cowork → Chrome MCP → Supabase SQL Editor.** First time a slice's migrations were driven from Cowork rather than Claude Code. Worked smoothly; the Monaco-editor `setValue` injection pattern from earlier sessions carried over cleanly.
- **Commit + push handed off to Claude Code via a self-contained prompt.** Cowork can't easily run `git commit && git push` against George's local repo; a focused prompt for the Code tab containing the expected diff, the tsc/eslint re-check, the stage list, and the commit message kept the handoff small and idempotent.
- **Smoke test artifacts get cleaned up, not kept.** George explicitly chose "Clear it" rather than keep the picsum-photo'd loft as MVP content. The three picsum photos (Chicago skyline, London street, foggy hilltop) didn't match the SoHo loft narrative; better not to pollute the table.

**Blockers / open threads:**
- **Three threads from earlier slices still open, unchanged:**
  1. No `/apply` route yet. New members are still created by manually flipping `is_member=true` via SQL.
  2. Author name on cards/detail renders "a member" — `accounts` RLS read-own hides other members' names. Needs a public-profile read policy or denormalized `author_name`.
  3. Sponsor renders "—" everywhere. Sponsor-name display isn't wired.
- **Storage delete via SQL is blocked by Supabase.** `delete from storage.objects` raises Postgres `42501: Direct deletion from storage tables is not allowed. Use the Storage API instead.` Supabase protects against orphan-object accidents this way. The Storage API (`supabase.storage.from(bucket).remove(paths)`) is the supported route — works from the browser under RLS owner-delete, or from server-side with service_role. Worth knowing for any future bulk-cleanup work.
- **Cowork's `file_upload` MCP tool wouldn't accept the JPEGs I'd generated locally** — kept rejecting the paths with "paths parameter is required" even though the array was clearly populated. Worked around it by `fetch`-ing 3 random photos from `picsum.photos` (which sets CORS) inside the browser JS context, building `File` objects, populating the `<input type="file">` via `DataTransfer`, and dispatching a `change` event. Useful pattern for future e2e tests; documenting here so the workaround isn't reinvented next time.
- **Orphan-file cleanup not built.** If a member uploads photos then abandons the new-listing form, those files sit in Storage forever. Acceptable for v1 (small volume, founder-only seed phase). A pruning job (paths-in-storage minus paths-in-listings) is a known future polish.
- **Next.js `<Image>` not used.** Plain `<img>` tags work but skip optimization. Polish slice candidate.

**Next session:**
1. Reasonable candidates: load the 27 seed listings from `outputs/Manhattanite_Seed-Listings_v1.md` (with real photos sourced — picsum random would defeat the brand); OR wire the author-name / sponsor-name display (close the two byline gaps); OR start the `/apply` route (Phase 2 proper).
2. If seed listings: decide whether `is_example=true` rows need real photos before any non-founder sees the network, or whether they ship without photos and the gallery layout only shows for the founder's own posts initially.

---

## 2026-06-01 · Phase 3 Slice 5 complete — listing creation (posting flow) shipped + founder seeded as member

**Worked on:**
- **Seeded the founder as a member.** Flipped `is_member = true` on `info@manhattanite.com` (uuid `85ce5315-…`, role stays `account`) via the Supabase SQL Editor (postgres role, bypasses RLS), driven through claude-in-chrome MCP. Verified before (false) and after (true). This account is now the test subject for every member-only flow and the default sponsor during seed phase.
- **Built `/listings/new` — the member-gated posting form.** New route `app/listings/new/page.tsx` (Server Component): `getUser()` → null redirects `/login`; reads `accounts.is_member` → false redirects `/profile`; member renders the form. Defense in depth over the Slice 4 RLS write policy.
- **`lib/listings/create.ts` — the server action.** Validates shared fields (title ≤80, description ≤2000, price ≥0) + builds the type-specific `details` JSONB, inserts `author_id = auth.uid()`, `status='published'`. Returns `{error}` for inline display (via `useActionState`); on an RLS rejection (Postgres `42501`) routes to `/profile`; on success `redirect('/listings/[id]')`. Mirrors the dormant `lib/applications/submit.ts` server-action pattern.
- **`app/components/NewListingForm.tsx` — the client form.** Apartment/furniture radio drives a conditional field render: apartment → neighborhood / bedrooms / bathrooms / available_from; furniture → condition (select) / dimensions / brand. Price label switches "Monthly rent ($)" ↔ "Asking price ($)". "Photos coming soon" placeholder note (image upload is Slice 6). Submit copy **"Post a listing"** per the CTA library (never Submit/Create/Publish). American spelling throughout.
- **`/profile` member-branching.** Members now see a primary **"Post a listing →"** + secondary **"Browse listings →"**; non-members keep the existing Tier-1 nudge (the `/apply` CTA stays commented — still no route). Without this, members had no in-product door to the form.
- **Full end-to-end test on prod (steps 1–7).** Posted a real apartment ("Sunny one-bedroom in the West Village", $4,200/mo, West Village, 1bd/1ba, available 2026-07-01) and a real furniture listing ("Ceccotti Collezioni walnut dining table", $1,200, good, 72×38×30, brand Ceccotti). Both redirect to their detail page with all JSONB fields rendered and both appear on `/listings` (empty state gone). Price formats correct ($X/mo vs $X). Logged-out `/listings/new` → 307 `/login`. Type-switch verified live. tsc + eslint clean. Commit `28891b4` (`feat(listings): …`), pushed, Vercel deploy verified live.
- **Verified the member gate holds for an authenticated non-member.** Couldn't create a second account (account creation / password entry is outside what Claude does), so tested by temporarily flipping `is_member=false`, confirming `/listings/new` → `/profile` redirect + the Tier-1 nudge reappears + the "Post a listing" CTA disappears, then flipping back to `true` and confirming the member view returns. The gate is intact at both the route and the profile-branch.

**Decided:**
- **Founder is permanently a member** — `info@manhattanite.com` stays `is_member=true`. George is a member of his own product and the seed-phase default sponsor.
- **Image upload deferred to Slice 6** (needs Supabase Storage). Listings are text-only for now; the detail page renders fine without images.
- **`status` defaults to `'published'` on submit** — no user-facing draft/archived control this slice. Draft workflow is a later slice.
- **Tested directly on prod, skipped a separate local browser pass.** Local dev has **no local Supabase** — `.env.local` points `NEXT_PUBLIC_SUPABASE_URL` at the prod project (`tjelmwbbyqfbtwnewadt`). So a "local" listing IS a prod row; local testing has zero isolation benefit. Logged-out redirect was confirmed locally via curl (307); the authenticated happy path was driven on prod using George's existing prod session (no password entry needed).
- **Auth is email+password, not magic link.** Confirmed in code (`signInWithPassword`). CLAUDE.md still says "magic link only" under architectural anchors — that's stale; the Slice 2 override to email+password is the truth. Flagged for a CLAUDE.md correction.
- **Condition `<select>` set via injected JS during the test** (native OS dropdowns are awkward to drive by pixel). The field itself works normally for real users.

**Blockers / open threads:**
- **Two real listings now live in prod** (apartment + furniture, both `is_example=false`, authored by `85ce5315-…`). Intentional — gives `/listings` visible content. Clear them when the seed-listings load slice runs, or keep as founder listings.
- **Still no `/apply` route.** Non-founder members can only be created by manually flipping `is_member` via SQL — the same seed-phase workaround as today. Real apply/approve flow is Phase 2 work, still deferred. The `/apply` CTA stays commented out (dead-link rule).
- **Author name renders "a member" on cards/detail** — `name` is null on the account (never collected at signup; Slice 2 thread) AND the accounts read-own RLS hides other members' names (Slice 4 thread). Both persist. A public-profile read policy or denormalized `author_name` is still owed.
- **Sponsor still renders "—"** (Slice 4 thread) — every listing inherits the author's `sponsor_id` but the sponsor-name display isn't wired.

**Next session:**
1. **Slice 6** — image upload (Supabase Storage): bucket + RLS, upload UI on `/listings/new`, render on cards + detail.
2. Optionally load the 27 seed listings (`outputs/Manhattanite_Seed-Listings_v1.md`, `is_example=true`) — decide whether to keep or clear the two founder test listings first.
3. Correct the stale "magic link only" line in CLAUDE.md.

---

## 2026-06-01 · Phase 2 Slice 4 complete — listings schema + RLS + read-only browse shipped

**Worked on:**
- **Migration `0003_listings.sql` — the single listings table + RLS, applied to production.** One table for every category (`type` enum: apartment/furniture, extensible to job/service later); shared fields are real columns, category-specific fields live in a `details` jsonb. Columns per the locked mvp-spec: `id`, `author_id` (FK → accounts, cascade), `type`, `title`, `description`, `price_cents` (CHECK >= 0), `details` jsonb, `status` enum (draft/published/archived, default draft), `is_example` flag, timestamps. Indexes on `author_id`, `(status, type)`, `created_at desc`. `updated_at` auto-bump reuses `touch_updated_at()` from 0001. Both migrations now versioned in the repo.
- **RLS — the Tier wall, enforced at the database.** SELECT policy `listings_read_published_for_accounts`: `status = 'published' AND auth.uid() IS NOT NULL` (Tier 0 → Tier 1 browse gate, no anonymous read, no draft/archived read). Three write policies `listings_write_member_own_{insert,update,delete}`: `author_id = auth.uid() AND is_member()` (Tier 1 → Tier 2 post gate). Posting UI is a later slice; the wall is in place now so it's real the moment posting ships.
- **`is_member()` SECURITY DEFINER helper.** Same pattern as `is_admin()` from 0002 — single lookup against `public.accounts`, bypasses RLS for the inner query, avoids the Slice 2 recursion bug. Never subquery accounts directly inside an accounts-joined policy.
- **Smoke-tested the RLS wall before building any UI, all four assertions passed:** (1) authenticated Tier 1 reads the published row; (2) `anon` role read → 0 rows; (3) **live REST call with the public anon key and no session → `[]`** (the real attack surface, sealed); (4) Tier 1 insert → `ERROR 42501: new row violates row-level security policy`. Inserted one `is_example` published row as service_role for the test, then deleted it — table is back to 0 rows.
- **Built `/listings` (browse) and `/listings/[id]` (detail), both read-only Server Components.** Browse: published rows, newest-first, limit 50, locked card copy + empty state from voice-and-copy.md, links to detail. Detail: single published row or `notFound()`, full description + jsonb details as key/value pairs, contact CTA commented out (dead-link rule). Both redirect logged-out visitors to `/login` (defense in depth, not relying on RLS alone). American spelling. No filters/search/sort (own slice later).
- **Verified:** tsc + eslint clean; locally both routes 307 → `/login` when logged out, no 500s. Commit `feat(listings): …`, pushed, Vercel deploy.

**Decided:**
- **`is_member()` SECURITY DEFINER pattern matches `is_admin()`** — the recursion lesson from Slice 2 carried forward.
- **`is_example` column added to the schema** for seed/example-listing tracking; will be stripped from public views before launch.
- **Sponsor display deferred — renders "—" for now.** The card/detail byline is "Listed by [name] · sponsored by —" until the sponsor slice wires `accounts.sponsor_id` → sponsor name.
- **Smoke test run via SQL-editor role impersonation + a live anon REST fetch, not a deployed `/rls-test` route.** Faster, no throwaway route on prod, and the impersonation reproduces exactly how PostgREST evaluates RLS for `authenticated`/`anon`. The plan's `/rls-test` route was never created and there's nothing to clean up there.
- **Corrected the stale memory:** prod has **one** Tier 1 account — `info@manhattanite.com`, uuid `85ce5315-2c38-4dc6-b3f3-48f224f26dba`, role `account`, `is_member = false` — created during the Slice 3 reset verification. Earlier entries said "zero accounts"; that was written before the reset test.

**Blockers / open threads:**
- **Zero published listings in prod, so `/listings/[id]` detail can't be visually verified** until either (a) the Slice 5 seed-data load runs or (b) a real member posts a listing. Browse shows the empty state, which is correct for now.
- **`accounts` RLS (read-own) blocks listing cards from showing OTHER members' author names.** The author-name embed only resolves for the viewer's own listings; everyone else's renders "a member". Needs a later slice to either add a public-profile read policy (expose `name`/`neighborhood` to authenticated users) or denormalize `author_name` onto listings. Flagged, not fixed this slice.
- **Stale saved query in the Supabase SQL Editor:** "Schema and RLS Drift Sanity Check" hardcodes uuid `e64bb21b-6051-45d1-a927-47f588deec98`, which does **not** exist in `accounts`. The real account is `85ce5315-…`. Update or delete that snippet before reusing it.

**Next session:**
1. **Slice 5** — load the 27 example listings from `outputs/Manhattanite_Seed-Listings_v1.md` into the table (`is_example = true`), OR build the post-listing flow. Either unblocks visual verification of the detail page.
2. End-to-end prod verification of the gated browse with George logged in (sees empty state; logged out → 307 to `/login`).

---

## 2026-06-01 · Landing page (Slice 3.5) reviewed live — copy + design both flagged for Phase 1.5 rework

**Decided:**
- Slice 3.5 page is functional — gate closes, two-tier model is named, `Create an account →` routes correctly, logged-in redirect verified. But after seeing it live, George flagged that **neither the copy nor the design lands well**, equal weight. The page is doing its Phase 1 job (closing the funnel mismatch) but is not the marketing surface Manhattanite needs longer term.
- Hold all iteration until **Phase 1.5 (Design Foundation slot)** per `Manhattanite_MVP-Timeline_v2.md`. Treat copy refresh as a co-deliverable of Phase 1.5, not a separate pass — visual treatment and the words move together.
- `COMPANY/voice-and-copy.md` is the source of truth, not the page. If Phase 1.5 changes what's on the page, the doc updates downstream to match — not the other way around.

**Blockers / open threads:**
- Specifics of the dislike deferred. "Both equally" is the only diagnosis on file today. Phase 1.5 kickoff should start with a 10–15 minute live walkthrough where George names what specifically grates — copy line by line, design element by element — so the rework has a real brief instead of "do better."
- No action between now and Phase 1.5. Phase 1 continues to ship on the current page.

---

## 2026-06-01 · Phase 1 Slice 3.5 complete — two-tier gating page replaces the waitlist form

**Worked on:**
- **Closed the front-door / side-door mismatch.** The landing page (`app/page.tsx`) was still the waitlist Airtable application form, while `/signup` (shipped in Slice 2) quietly created real accounts behind the scenes. Visitors hit the wrong door. `app/page.tsx` is now the Tier 1 gating page: the locked "Public-facing gating page" + "Two-tier explainer" copy from `voice-and-copy.md`, verbatim. American spelling throughout. Kept the existing visual treatment (giant serif wordmark, color, layout container, footer) — only the content region changed.
- **Server-side gate.** Page is now an async Server Component. It calls `supabase.auth.getUser()` before rendering; a logged-in visitor is `redirect()`-ed to `/profile` (the exact reverse of the guard `/profile` runs for logged-out visitors). Logged-out visitors see the pitch.
- **CTAs.** Primary `Create an account →` links to `/signup`. Secondary `I have an invite →` is commented out (dead-link rule — no invite flow exists yet; a later block wires `/invite`).
- **Preserved the application pipeline as dormant code.** Extracted the old `submitApplication` server action (Resend notification + Airtable write) out of `page.tsx` into `lib/applications/submit.ts`, untouched and unwired. `app/components/ApplicationForm.tsx` and `app/components/ApplyLink.tsx` left exactly as they were. The `/apply` slice will revive and refactor these — not rebuild them. Airtable + Resend env vars in Vercel left in place, dormant.
- **Verified.** tsc + eslint clean. Locally and on prod confirmed: logged-out `/` shows the gating copy + both tiers, `Create an account →` points at `/signup`, the invite CTA is absent (commented out, not a 404), and no Airtable form / `submitApplication` is wired to the homepage. Commit `e85ed9d` (`feat(landing): …`), pushed, Vercel live ~40s later.

**Decided:**
- **ApplicationForm + submitApplication preserved as dormant — `/apply` reuses, not rebuilds.** This is the big one. The whole pipeline survives the landing-page swap; the next slice lifts it back into a real `/apply` route.
- **Extraction (option b) over dormant-in-page (option a).** Leaving `submitApplication` unrendered inside `page.tsx` would have left unused imports + an unused function tripping eslint. The clean lift to `lib/applications/submit.ts` was the smaller, lint-clean diff.

**Blockers / open threads:**
- **`voice-and-copy.md` CTA library is stale.** Its table still lists "Join the network" as the create-account CTA (and "Create account" in the don't-use column). This slice ships "Create an account →" — the current truth. Flagged here, **not edited** in `voice-and-copy.md` this slice per the build plan. Reconcile the CTA library in a later copy pass.
- **Logged-in redirect + full signup→profile click-through not click-tested by Claude.** There are zero accounts in the project right now (the Slice 3 test user was deleted), and fabricating one needs a signup George should drive. The redirect logic is code-identical-in-reverse to the proven `/profile` guard. Both are part of George's prod verification loop (the six-step test in the build plan).

**Next session:**
1. Run the six-step gating-page loop on prod (logged-out gate → Create an account → /signup → complete signup → /profile → revisit / while logged in → 307 to /profile → sign out → gate again).
2. Reconcile the stale "Join the network" CTA row in `voice-and-copy.md`.

---

## 2026-06-01 · Phase 1 Slice 3 complete — forgot-password reset flow shipped to prod

**Worked on:**
- **Next 16 `middleware.ts` → `proxy.ts` rename.** Cleared the deprecation warning that printed on every dev boot since Slice 1. Same matcher config, same session-refresh behavior, renamed function. Verified the warning is gone and the session cookie still refreshes on each request.
- **Built the forgot-password reset flow (Block 4).** `/reset-request` (email-only form → `resetPasswordForEmail`, with a generic no-leak success message so the page can't probe who's in the network). Reused the existing `/auth/callback` route for the code exchange. `/reset-password` (session-gated — a cold visit with no recovery session bounces to `/reset-request`; 8-char minimum; `updateUser({ password })` → `/login`). Uncommented the "Forgot password?" link on `/login`.
- **Fixed the Supabase Auth URL config — this was the real blocker.** The redirect-URL allowlist was **empty** and the Site URL was a dev value (`http://localhost:3000`) on a production project, so recovery links had nowhere valid to land. With George's go-ahead: set Site URL to `https://manhattanite.com`, and added both `http://localhost:3000/auth/callback` and `https://manhattanite.com/auth/callback` to the redirect allowlist.
- **Housekeeping.** Deleted the `/supabase-test` smoke-test route. Deleted the Slice 2 test user `claude-test-1780015807648@example.com` from `auth.users` (cascades to `public.accounts`) — project now has zero accounts.
- **Shipped.** tsc + eslint clean, routes render 200. Commit `c36b7ef` (`feat(auth): …`), pushed, Vercel deployed; `manhattanite.com/reset-request` confirmed live with the correct copy.

**Decided:**
- **`redirectTo` uses `window.location.origin`, not an env var.** The build plan referenced `process.env.NEXT_PUBLIC_SITE_URL`, which doesn't exist in `.env.local`. `window.location.origin` is host-adaptive (localhost in dev, manhattanite.com in prod) and avoids an undefined value — both origins are now in the Supabase allowlist.

**Blockers / open threads:**
- **Live email round-trip not tested by Claude.** Sending a real recovery email and clicking the link needs an inbox Claude can read and a registered account (there are none now). Verified everything else (compile, render, session gate, config). George's 4-step manual test: create an account with a real inbox → Forgot password? → click the email link → set a new password → log in.
- **Pre-existing lint error in `app/thank-you/page.tsx`** (`<a>` to `/` instead of `<Link>`). Predates this work; flagged as a separate spawned task, not bundled into the auth commit.

---

## 2026-06-01 · Parallel content lanes — homepage copy v2 + seed listings drafted while Slice 2 ran

**Worked on:**
- While Claude Code was executing Phase 1 Slice 2, ran two parallel content lanes (parallel-safe with the code build — no overlap on app/, lib/, supabase/, or middleware).
- Drafted `outputs/Manhattanite_Homepage-Copy_v2.md` — the trust-first replacement landing page in the locked voice. Hero, three-pillar promise (better stuff / trust the people / you're in or you're not), two-tier mechanic explainer, what's listed, sponsorship paragraph, founding cohort honesty block, footer. American spelling throughout. Single CTA pair ("Apply for membership" / "I have an invite") repeated, no other CTA verbs. Build notes attached. Five-point test passed inline.
- Drafted `outputs/Manhattanite_Seed-Listings_v1.md` — 12 apartments + 15 furniture listings, each tagged `[EXAMPLE]` per spec. Real streets (Bank, Greene, East 78th, Orchard, Vandam), real brands (Ceccotti, BDDW, Knoll, Carl Hansen, Flos, Ligne Roset), honest flaws named (chip, scratch, repaired chair, sun-fade). Sponsor defaults to George with six rows showing cross-member sponsorship (Anna, Max, Lila) for design preview. Photos are placeholder counts only — real images to be sourced before any non-founder sees the network. Five-point test passed inline.

**Decided:**
- Homepage v2 stays parked in `outputs/` until Phase 1 + early Phase 2 give the page real proof to point to. The "what's on the network right now" section needs a live count from the `listings` table before ship.
- Seed listings ship into the database the same week the `listings` table lands in Phase 2. `is_example = true` on all 27 rows. Tag stripped automatically once flag flips.
- Kept scope tight to copy work that wouldn't compete with Slice 2 for attention. Legal and founding-member acquisition lanes remain unstarted — flagged for a later parallel session.

**Blockers / open threads:**
- Both files are draft v1 / v2. Want a George read-through before either is treated as final. Homepage hero phrasing ("A private marketplace for New Yorkers") is a working line, not a locked headline.
- Six non-George sponsor names in the seed listings are a display call — database can hold either; swap to George before launch if preferred.
- Founding-member acquisition + NY attorney outreach still unstarted.

**Next session:**
1. Review homepage copy v2 against the live page; decide whether the founder-cohort honesty section reads right or feels too soft.
2. Decide on the six non-George sponsor names in seed listings (keep for variety, or normalize to George).
3. Pick up one of the still-open lanes: founding-member acquisition list, or attorney outreach brief.

---

## 2026-06-01 · Phase 1 Slice 2 complete — email + password auth shipped to prod

**Worked on:**
- **Auth method override executed.** Per the 2026-05-27 decisions-log update, swapped the locked magic-link plan for email + password (with reset flow planned). Reset flow itself deferred to next session per the build-plan cut-order; everything else delivered in one slice.
- **Database (Block 1) — accounts table + RLS + triggers, applied to production.** Migration `0001_accounts.sql` (175 lines) creates the table per the locked schema (`id`, `email` unique, `name`, `neighborhood`, `bio`, `role` enum, `is_member`, `sponsor_id` self-FK, timestamps), wires the `auth.users → public.accounts` AFTER INSERT trigger so signUp auto-creates the profile row, and enables RLS with read-own / update-own / admin-read-all / admin-update-all policies. Protected `role` / `is_member` / `sponsor_id` / `email` via a `BEFORE UPDATE` trigger so non-admins can't escalate themselves on their own row (simpler than self-referencing subqueries inside `WITH CHECK`).
- **Caught and fixed an RLS infinite-recursion bug during end-to-end testing.** The original admin policies subqueried `public.accounts` from inside policies on `public.accounts` itself, error `42P17`. The recursion short-circuits all RLS evaluation on the table — meaning even the "read own row" policy never gets a chance, so logged-in users saw "Setting up your account…" forever. Migration `0002_fix_admin_rls_recursion.sql` (93 lines) wraps the admin check in an `is_admin()` `SECURITY DEFINER` helper that bypasses RLS for the inner lookup; applies the same fix to `protect_account_columns`. Standard Supabase gotcha, easy fix once diagnosed. **Both migrations now versioned in `supabase/migrations/`** — the database is reproducible from the repo.
- **UI (Block 2) — /signup, /login (password), session middleware.** `/signup` is a Client Component (~163 lines) with the gating-page copy from `voice-and-copy.md` lifted verbatim; CTA is "Create an account" (never "Sign up") per the CTA library. Replaced the prior session's magic-link `/login` with email + password + a "Forgot password?" link (commented out until Block 4 ships next session). Friendly error mapping for invalid-credentials (rewrites Supabase's "Invalid login credentials" into Manhattanite voice). `middleware.ts` refreshes the Supabase session cookie on every matched request.
- **Profile (Block 3) — /profile reads own row, redirects logged-out.** Server Component that calls `getUser()`, redirects to `/login` if null, then reads the user's own row via RLS. The "Apply for membership" CTA is commented out until `/apply` exists in a later slice; the Tier-1 nudge text stands on its own.
- **End-to-end test loop verified locally then live in production.** Drove a full signup → /profile → sign out → /profile (307 to /login) → wrong password (friendly error) → correct password → /profile loop in Chrome via the claude-in-chrome MCP, both at `localhost:3000` and at `https://manhattanite.com`. Vercel deploy was live 11 seconds after `git push`.
- **Workflow note.** Drove the Supabase SQL Editor and the localhost dev server programmatically via Chrome MCP + JavaScript-into-Monaco to apply migrations and run end-to-end tests, instead of asking George to copy-paste SQL. Faster, repeatable, and George stayed watching the screen.

**Decided:**
- **Commit message convention adjusted.** Original plan said `feat(auth): email+password login, signup, reset + accounts table + RLS (Phase 1 Slice 2)`. Since reset is deferred, the actual commit is `feat(auth): email+password login, signup + accounts table + RLS (Phase 1 Slice 2)` (no `reset`). The detailed bullet body still ends with a "reset flow deferred to next session" note for the audit trail.
- **Dead links hidden, not deleted.** `/reset-request` (Forgot password?) and `/apply` (Apply for membership) both 404 today. Both are commented out in the UI rather than removed entirely, so Block 4 (and the future apply slice) just need to uncomment.
- **Memory + planning docs split into a separate commit.** Code lands as `feat(auth):…`; memory and `WORK AREAS/` updates land as a follow-up `docs:` commit so each is reviewable in isolation.
- **Test account left in production for now.** `claude-test-1780015807648@example.com` is a real row in `auth.users` + `public.accounts`. Useful as a known-good test account for the next session's reset-flow work; can be deleted from Supabase at any time.

**Blockers / open threads:**
- **Block 4 — reset flow — deferred.** Build `/reset-request` (calls `resetPasswordForEmail` with `redirectTo` → `/auth/callback?next=/reset-password`), reuse `/auth/callback` for the code exchange, build `/reset-password` (calls `updateUser` → redirect to `/login`). Uncomment the "Forgot password?" link on `/login`. End-to-end test the email round-trip on the live site (test inbox needed).
- **Next 16 `middleware.ts` → `proxy.ts` rename.** Dev server prints `⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.` on every boot. Pre-existing from Slice 1, not introduced today. Small rename + matcher copy. Bundle with Block 4 so the deploy log stays clean from that point forward.
- **`/supabase-test` route still live in production.** Per the rules of engagement, leave it alone until Block 4 ships and a final smoke test confirms the auth pages survive the reset-flow additions. Then delete and `feat: …` commit.
- **`name` not collected at signup.** Today's `/signup` only collects email + password; `name`, `neighborhood`, `bio` on the `accounts` row stay null until profile editing ships (probably alongside the application flow). `/profile` falls back to email when name is null, which reads OK for now but is the obvious next polish.
- **Email confirmation is OFF in Supabase Auth settings.** Per the build plan, this was the intentional choice for the build loop. Decide before real members arrive whether to turn it back on (one toggle in Supabase + a follow-up "check your inbox" UI state).

**Next session (Block 4 — forgot-password reset flow + housekeeping):**
1. Rename `middleware.ts` → `proxy.ts` (Next 16) — first thing, clears the deprecation warning before the rest of the work.
2. Build `/reset-request` (email-only form → `resetPasswordForEmail`).
3. Build `/reset-password` (new-password form → `updateUser` → redirect to `/login`).
4. Uncomment the "Forgot password?" link on `/login`.
5. End-to-end test with a real inbox: request reset → click email link → set new password → log in with new password.
6. Decide on `/supabase-test` removal (probably yes by end of slice).
7. Commit + push + verify on prod.

Estimated effort: ~60–90 minutes if the reset email lands cleanly the first try; longer if Supabase's redirect-URL allowlist needs tweaking.

---

## 2026-05-18 (morning) · Phase 1 Slice 1 complete — Supabase wired in

**Worked on:**
- Finished the env-var restore from last night: added `RESEND_API_KEY` and `AIRTABLE_API_KEY` to Preview and Development environments in Vercel (had been Production-only because of how the variables were created on the Production-specific page).
- Strategic alignment conversation: George flagged that the existing waitlist page reads Raya (exclusivity-first hero, no visible utility), which contradicts the trust-first / utility-leading direction we've reconciled to. Confirmed alignment.
- Locked the landing-page decision (Option C): current waitlist page stays until Phase 1 + early Phase 2 give us something real to put on a trust-first homepage; then the replacement ships as the visible deliverable of the seed MVP. Form test on the existing waitlist was dropped (testing the wrong product).
- Logged a future task: design workstream begins ~Phase 1 week 2-3, before Phase 2 listing UI work needs design decisions.
- **Phase 1 Slice 1 (stack setup) executed end-to-end:**
  - Verified the Supabase project already exists (`info@manhattanite.com's Project`, region us-west-2 Oregon, Free plan, healthy). Acknowledged Oregon adds ~70ms latency vs an east-coast region; not a deal-breaker at MVP scale; deferred any migration.
  - Retrieved the publishable key from Supabase Settings → API Keys (new naming; replaces the old "anon" key).
  - Appended `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`.
  - Installed `@supabase/supabase-js` (^2.106.0) and `@supabase/ssr` (^0.10.3) into the project.
  - Wrote `lib/supabase/client.ts` (browser client) and `lib/supabase/server.ts` (server client with cookie adapter ready for slice 2 auth) following the Next.js 16 App Router SSR pattern.
  - Added a temporary `/supabase-test` smoke-test route (Server Component that calls `supabase.auth.getUser()` and renders the result).
  - TypeScript + ESLint pass clean locally. Local `npm run build` aborted on Google Fonts fetch (sandbox network restriction); not a real failure.
  - Added Supabase env vars to all three Vercel environments via the Claude-in-Chrome browser automation (Production, Preview, Development).
  - Committed everything to git as `9d14752` ("feat(supabase): wire Supabase client + smoke test (Phase 1 Slice 1)") and pushed to `origin/main`. Vercel auto-deployed in 22s.
  - **Smoke test passed in production:** `manhattanite.com/supabase-test` renders showing URL set, Anon key set, and Connection: Connected (no active session — expected for anonymous visitors). Real proof that the deployed app can talk to Supabase.

**Decided:**
- Skip Sensitive flag for Supabase variables in Vercel (default left ON for Production, OFF for Development per Vercel's restriction). NEXT_PUBLIC_* vars end up in the client bundle anyway, so masking adds nothing functional.
- Use the new Supabase "publishable" key naming (sb_publishable_…) rather than legacy "anon" JWT keys. Same role, current Supabase recommendation.
- `.claude/` added to `.gitignore` — it's Claude Code per-machine settings, not project state.
- `WORK AREAS/Product/mvp-build-project/outputs/.gitkeep` is an accidental file from an early session-start mistake; left untracked. Harmless. Operating rules say never delete.
- Claude-in-Chrome browser automation is officially part of the workflow going forward — saved ~10 minutes of manual Vercel clicking. Worth the small one-time pairing setup.

**Blockers / open threads:**
- Slice 1 leaves `/supabase-test` live in production. Anyone visiting `manhattanite.com/supabase-test` sees a small "yes Supabase is wired" page. No secrets leak (URL is already public via NEXT_PUBLIC_, anon key is by design safe). Delete it when slice 2 ships real auth pages.
- Founding-member acquisition project still unstarted.
- NY startup attorney outreach still unstarted. Tier 1 legal items (entity, TOS, privacy, founder identity) block go-live.

**Next session (Phase 1 Slice 2 — magic-link auth):**
1. Create the `accounts` table in Supabase with RLS policies (account / member / admin roles, `is_member` flag, sponsor FK).
2. Wire Supabase Auth + Resend for magic-link emails (custom SMTP setup so emails come from a manhattanite.com address).
3. Build `/login` page (email input, magic-link request).
4. Build `/auth/callback` route handler (token exchange, session set).
5. Build a minimal authenticated `/profile` page (Server Component that reads the signed-in account row, displays name/neighborhood/bio).
6. Add Next.js middleware to refresh sessions on every request.
7. End state: a real visitor can enter their email on `/login`, receive a magic link, click it, land logged in. The two-tier wall starts to be real.

Estimated effort: ~2 focused hours. Best done fresh.

---

## 2026-05-17 (late evening) · Env-var restore in progress, COMPANY/memory.md refreshed, landing-page decision framed

**Worked on:**
- Refreshed the stale `COMPANY/memory.md` "Quick state" snapshot to reflect the post-folder-collapse reality (single unified folder at `~/Developer/manhattanite`, live site, open admin items).
- Walked George through the env-var restore in Vercel for the live waitlist form. Took longer than expected because of TextEdit not opening the hidden `.env.local`; pivoted to a Terminal `cat` command, which worked.
- Both `RESEND_API_KEY` and `AIRTABLE_API_KEY` got added to the new Vercel project, but **scoped to Production only**. The Vercel Edit dialog wouldn't let George expand the Environments selector to add Preview and Development scope (likely because the variables were created on the Production-specific environment page, which locks scope at creation). Skipped the multi-env scoping fight for tonight.
- Drafted a 3-option framing for the landing-page question (keep current waitlist / replace with gating page / hybrid). Recommended Option C (keep current page; build Phase 1 behind it; swap once auth is live). Decision not yet locked.

**Decided:**
- Skip Preview/Development env-var scope for tonight. Production is what runs manhattanite.com; that's what matters for the live form. Preview/Dev becomes a v-low-effort follow-up once we know the right Vercel workaround (probably delete + re-create via the Shared tab, or via each environment's page individually).
- Side flag: the AIRTABLE_API_KEY value in `.env.local` starts with `sk_live_` rather than the usual Airtable `pat...` prefix. Working theory: it's an older key format Airtable still honors, since the live site worked previously. If the form fails after redeploy, regenerate the Airtable key as the first fix.

**Blockers / open threads:**
- **Redeploy:** George confirmed he hit Redeploy before signing off. Keys should be live on Production.
- **Untested:** the form has not been tested yet. Test plan: open manhattanite.com in incognito, submit application with George's own email as the test value, watch for email at info@manhattanite.com + new row in Airtable. First-thing-tomorrow task.
- Landing-page keep-vs-replace decision still open. Option C (hybrid) is recommended but not locked.

**Next (locked priorities for tomorrow):**
1. **First thing — no questions asked:** Add `RESEND_API_KEY` and `AIRTABLE_API_KEY` to Preview and Development environments in Vercel. George explicitly asked for this to be tomorrow's first task.
2. Test the live application form (Redeploy already happened tonight).
3. Lock the landing-page decision (Option A / B / C from tonight's framing).
4. Then: begin Phase 1 build slice 1 (Supabase + magic-link auth scaffold).

---

## 2026-05-17 (evening) · Discovered existing project, reconciled strategy, synthesized position

**Worked on:**
- Investigated three "manhattanite" folders on George's Mac: ~/Desktop/Manhattanite (CoWork workspace), ~/Projects/manhattanite (today's clean shell), ~/Developer/manhattanite (prior work, originally assumed to be discardable old waitlist).
- Discovered ~/Developer/manhattanite was actually substantial: working Next.js 16 landing page + form + Resend integration + Airtable database + 26KB STRATEGY.md from 2026-05-06. NOT junk.
- Copied STRATEGY.md into the CoWork workspace and read it in full.
- Produced a structured reconciliation document (outputs/Manhattanite_Strategy-Reconciliation_v1.md) comparing OLD STRATEGY.md vs NEW COMPANY/ docs across 5 axes of divergence.
- George reviewed and confirmed all reconciliation recommendations.

**Decided:**
- Build foundation: ~/Developer/manhattanite (existing project) instead of ~/Projects/manhattanite (today's clean shell).
- Trust mechanic: binary at MVP, score system as v2 direction.
- Categories: stick with 2 (Apartments + Furniture). Jobs in v1.5.
- Monetization: pay-per-post only. No paid membership tiers, no business accounts.
- Brand tone: utility-first, dressed in aesthetic vocabulary ("Soho House email serving Gens de Confiance utility"). Trust is the product, not coolness.
- Database: Supabase as primary; Airtable retained for manual application review during seed phase.
- ~/Projects/manhattanite/ to be archived/deleted.

**Blockers / open threads:**
- None blocking. Execution plan is clear and George is unblocked.

**Next:**
- Execute migration via Claude Code (Code tab pointed at ~/Developer/manhattanite/).
- 3 phases: (1) copy docs in, (2) rewrite CLAUDE.md, (3) reconnect git + force-push.
- Then archive ~/Projects/manhattanite/ and verify Vercel.
- Then plan first concrete chunk of Phase 1 (Foundations) — recommendation: migrate from Airtable-waitlist to Supabase + magic-link auth, then build the gating page.

---

## 2026-05-17 (late evening) · Migration executed and pushed

**Worked on:**
- George switched the Code tab from ~/Projects/manhattanite (where it had defaulted) to ~/Developer/manhattanite. Confirmed correct working directory.
- Claude Code copied COMPANY/ + WORK AREAS/ from Cowork workspace into docs/COMPANY/ + docs/work-areas/. Copied STRATEGY.md to docs/COMPANY/strategy-blueprint.md (538 lines, 26,400 bytes, integrity verified). Original STRATEGY.md preserved at repo root pending archival decision.
- Claude Code removed an incidental .DS_Store that snuck in during the copy. Verified .gitignore already covered .DS_Store.
- Claude Code replaced the 1-line stub CLAUDE.md with the synthesized 80-line version. Added @AGENTS.md import + prose pointer to preserve the Next 16 breaking-changes warning. Prepended supersession notice to STATUS.md.
- George approved the multi-file commit (23 files, 4,032 insertions) and the force-push to GitHub.
- Commit 2c8d597 ("Migrate from waitlist project to MVP build foundation") landed on remote main, overwriting the throwaway README-only commit (313b968) that was on the recreated empty GitHub repo. Full local history (7 commits, oldest dc295dc from 2026-04-26) is now mirrored on GitHub.

**Decided:**
- Used plain `git push --force` instead of `--force-with-lease` because local's tracking ref was stale and we knew the remote had nothing worth protecting.
- Original STRATEGY.md at the repo root left untouched for now (one final cleanup decision to make later: delete it or keep it as a "see strategy-blueprint.md" pointer file).

**Blockers / open threads:**
- None blocking. Vercel auto-deploy and the Projects/manhattanite archival are in progress as George finishes the final two manual steps.

**Next:**
- Once George confirms Vercel deployed and Projects/manhattanite is in Trash, Phase 0 is truly closed.
- Phase 1 planning is the next session. Recommended first chunk: scaffold the Account creation flow (Supabase Auth magic link + accounts table + a basic /login + /apply route pair). That's a focused 1-2 hour build that touches every key piece of the stack and produces a visible win.

---

## 2026-05-17 (late evening, post-migration) · Vercel 404 diagnosed and fixed; site live

**Worked on:**
- After the migration push, manhattanite.com returned 404 NOT_FOUND despite Vercel's deployment showing "Ready." Investigated via the Code tab and via Cowork's Claude-in-Chrome MCP.
- Build logs confirmed Next.js produced three routes (`/`, `/_not-found`, `/thank-you`) as static. Yet the deployment's own *.vercel.app URL also 404'd — ruling out a domain attachment issue.
- Diagnosed root cause via Vercel Project Settings → Build and Deployment: **Framework Preset was set to "Other"** instead of "Next.js." This was a leftover from when the Vercel project was recreated earlier today against an empty GitHub repo (Vercel's auto-detection couldn't see Next.js because no code was present at the time).
- Changed Framework Preset from "Other" to "Next.js" and saved. Triggered a Redeploy from the latest commit. Build completed in 25s. Deployment Status: Ready.
- Verified manhattanite.com loads correctly — serving the existing waitlist landing page ("Manhattanite — A better marketplace for Manhattan residents") with the GT Sectra-style wordmark (italic "ite" exactly as specified in brand-guide.md), "Better listings." subtitle, and "APPLY FOR MEMBERSHIP" CTA in letterspaced caps.

**Decided:**
- The existing wordmark on the live site already matches the brand guide direction. No need to design a new one from scratch — the past-George execution was on target.

**Blockers / open threads:**
- **Form submission will fail until environment variables are migrated.** The old Vercel project (deleted earlier today) had RESEND_API_KEY and AIRTABLE_API_KEY set. The new Vercel project doesn't. The page renders fine but `applications@manhattanite.com` emails and Airtable writes won't work. The keys live in `~/Developer/manhattanite/.env.local` and need to be copied into Vercel → Settings → Environment Variables.
- This is a 5-minute task for next session, not blocking anything because the waitlist isn't being actively promoted.

**Next:**
- Confirm Projects/manhattanite/ is archived (George doing in Finder).
- Then: Phase 0 is truly, finally closed.
- Next session opens with two small admin tasks before Phase 1: (1) restore env vars to Vercel, (2) decide whether to keep the existing waitlist landing or replace it with the gating page from voice-and-copy.md as the first Phase 1 chunk.

---

## 2026-05-17 (night) · Folder collapse — Desktop and Developer merged into one

**Worked on:**
- George pushed back on the two-folder split (Desktop = Cowork workspace, Developer = build repo). Honest reconsideration: a single Mac folder for everything is simpler and better suited to an ADHD non-technical founder. Cowork agreed to collapse.
- Drafted a unified CLAUDE.md (outputs/Manhattanite_CLAUDE-md-Unified_v1.md) that serves both Cowork and Claude Code — top half is CoWork OS reading protocol, bottom half is Manhattanite project context.
- Resolved structural decisions: Cowork folders go at the root (matching CoWork OS convention), the `docs/` indirection is eliminated, ABOUT ME is .gitignored (personal data), other Cowork folders are committed.

**Decided:**
- Collapse into single folder at `~/Developer/manhattanite/`.
- `~/Desktop/Manhattanite/` to be archived after verification.
- New unified CLAUDE.md replaces both existing CLAUDE.md files.

**Blockers / open threads:**
- Migration execution pending — three steps in Claude Code (Code tab), one manual Cowork mount switch, one Finder archive.

**Next:**
- Execute the migration via prompts to Claude Code.
- Verify Cowork can read ABOUT ME and COMPANY from the new mount.
- Archive Desktop/Manhattanite.
- After that: Phase 0 truly truly closed. Then env vars + Phase 1 planning.

## 2026-05-17 · Phase 0 fully closed — docs in build repo, CLAUDE.md generated, committed to GitHub

**Worked on:**
- Copied COMPANY/ and WORK AREAS/ from the CoWork workspace (~/Desktop/Manhattanite/) into the build repo at ~/Projects/manhattanite/docs/. Renamed "WORK AREAS" to "work-areas" in transit (no space) for code-tooling friendliness.
- Created a .gitignore for standard Next.js + Mac patterns (node_modules, .next, .env*, .DS_Store, etc.).
- Ran /init in Terminal Claude Code; it generated a strong CLAUDE.md capturing memory protocol, architectural anchors (two-tier model, RLS as load-bearing, single listings table with JSON details, magic link auth), scope discipline, voice conventions, PA boundary.
- Discovered the Claude desktop app has a built-in **Code tab** next to Cowork — switched George's workflow there from Terminal Claude Code for Phase 1 onward (friendlier interface, same engine).
- Hit and resolved a worktree-mode gotcha: the desktop Code tab defaults to git worktree mode, which only sees committed files. Switched a fresh session to non-worktree mode and the docs became visible.
- Verified end-to-end: Code tab reads all the docs correctly + CLAUDE.md.
- Committed and pushed everything to GitHub via the Code tab (Phase 0 work is now backed up + version-controlled).

**Decided:**
- Going forward, George uses the **Code tab in the Claude desktop app** for build work (not Terminal). Cowork for strategy + planning, Code for building. They share context via the docs/ folder inside the build repo.
- Worktree mode in the Code tab is OFF by default for George (less confusing for a non-technical user starting out). Can be re-enabled later when the safety net matters more.
- docs/ in the build repo is a COPY of COMPANY/ + WORK AREAS/ from CoWork workspace. They will drift if updated in only one place. Future sync is a known issue, deferred. If drift becomes annoying, write a small sync script.

**Blockers / open threads:**
- None blocking Phase 1 start. All Phase 0 prep complete.
- Drift between CoWork workspace COMPANY/ and build repo docs/COMPANY/ — to manage manually for now.

**Next:**
- New focused Cowork session to plan Phase 1's first chunk (recommendation: scaffold the Next.js project as the smallest first task).
- Then switch to Code tab to execute that chunk.
- Optional tonight: George may push a quick Next.js scaffold via the Code tab as a small win and a taste of the build flow.

## 2026-05-17 · Phase 0 complete — Claude Code installed and authenticated

**Worked on:**
- Walked George through installing Node.js via nvm (v24.15.0, npm 11.12.1), verifying git (2.54.0), installing Claude Code (`npm install -g @anthropic-ai/claude-code`).
- Created `~/Projects` on George's Mac, cloned `manhattanite` GitHub repo into it (no auth prompt — credentials cached).
- Launched Claude Code in the project folder. Authenticated automatically (existing Max session). Running Opus 4.7 1M context.
- Verified Claude Code can read files in the project folder.

**Decided:**
- Project code lives at `~/Projects/manhattanite` on George's Mac.
- Claude Code = Opus 4.7 / 1M context / Max plan. Strongest available setup.

**Blockers:**
- COMPANY/ folder is in the CoWork workspace (separate folder on George's Mac), not in the cloned git repo. Claude Code currently has no access to it. Needs to be addressed first thing next session.

**Next:**
- Open new session next time.
- Decide how to expose COMPANY/ to Claude Code (recommended: copy into the repo as `docs/`, commit to git).
- Run `/init` in Claude Code to bootstrap a CLAUDE.md for the build repo.
- Begin Phase 1 (Foundations): scaffold Next.js, wire Supabase, build the two-tier auth model.

## 2026-05-17 · Phase 0 setup essentially complete

**Worked on:**
- Walked George through the setup checklist live, step by step.
- Scrapped the old waitlist (no email export needed — he had no real signups).
- Deleted the broken Vercel project that was tied to the deleted GitHub repo. Created a fresh Vercel project from the new (empty) `manhattanite` GitHub repo. Re-attached manhattanite.com.
- Flipped the domain redirect direction: manhattanite.com is now the primary; www.manhattanite.com 308-redirects to it (the cleaner, modern setup).
- Discovered Resend was already verified for manhattanite.com from a previous setup — DNS records still in place, no need to redo.
- George confirmed Supabase, Plausible, Sentry accounts created. Configuration of these happens in Phase 1 with Claude Code.

**Decided:**
- manhattanite.com is the primary, non-www address. 308 permanent redirect from www → non-www.
- Skip Cloudflare entirely. Domain stays at George's existing registrar. Vercel handles SSL automatically.
- Resend reuse: no need to re-add domain or DNS records — they're domain-level and unchanged.

**Blockers:**
- Claude Code not yet installed on George's Mac. This is the last gate before Phase 1.

**Next:**
- Decision point: install Claude Code immediately and start build, OR pause here and reconvene later for installation.
- Whenever Claude Code is installed: begin Phase 1 (Foundations) — auth, profiles, two-tier model wiring.

## 2026-05-16 · Project kicked off, setup phase begun

**Worked on:**
- Created the project folder.
- Drafted the setup checklist (outputs/Manhattanite_Setup-Checklist_v1.md).
- Decided to drop Cloudflare from the immediate stack to reduce setup overhead. Current registrar stays. SSL via Vercel.
- Decided to delete the existing GitHub `manhattanite` repo and start fresh.
- Email addresses confirmed: `george@manhattanite.com` + `info@manhattanite.com`.

**Decided:**
- Pre-build action order: export waitlist → scrap waitlist → repoint DNS → fresh repo → service accounts → email config → ready for build.

**Blockers:**
- Need registrar name from George for exact DNS instructions.
- Need waitlist platform name from George for export instructions.

**Next:**
- Walk through Step 1 (export waitlist emails) with George.

---

*Entry format: date · short title, then sections for Worked on / Decided / Blockers / Next.*
