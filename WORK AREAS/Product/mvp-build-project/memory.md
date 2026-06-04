# Project Memory — MVP Build

Chronological log. Newest entries at the top.

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
