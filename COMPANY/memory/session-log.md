# Manhattanite — Session Log

Append-only chronological record. Add a dated entry after every meaningful session. For the distilled list of strategic calls, see `decisions.md`.

Newest entries at the top.

---

## 2026-08-28 · Landing v4 verified, the signed-in door closed, shipped (Claude Code)

**Landing v4 is built, verified and pushed.** Picking up Cowork's uncommitted rewrite of `app/(cl)/page.tsx`: the one thing it could not do — `next build` — passes clean, and the one decision it left open is closed.

**THE BUILD PASSES.** `next build` exit 0, `tsc --noEmit` clean, lint unchanged at the **4-error project baseline**. (Lint prints five; the fifth is in `.claude/worktrees/inspiring-ardinghelli-988672/`, a registered git worktree from 20 July that eslint walks into. It is gitignored so it never reaches a commit, but it inflates every lint run. **Left alone deliberately** — it dates from the 2026-07-20 revert incident and removing a worktree is not a thing to do unasked. Worth George's call whether to prune it.)

**A SIGNED-IN VISITOR IS NOW REDIRECTED TO `/listings`, AND IT COSTS NOTHING.** The brief asked whether this would undo the 356ms→107ms win on `/`. It does not, and the reasons are in the page header so nobody optimises it back out:

- **`proxy.ts` already calls `getUser()` on this exact request.** Its matcher covers every path but static assets. The auth round trip on `/` was already being paid to refresh the session; the page now reads the result rather than adding a trip.
- **A guest pays zero.** supabase-js short-circuits `getUser()` with no auth cookie — the 0ms measured in the page-speed pass. Guests are who the 107ms describes, and they still make no Supabase call here.
- **There is no cache left to defeat.** The 107ms came from `unstable_cache` around the guest teaser read. **v4 deleted the call to it**, so `/` has no cached branch to lose. Warm dev render measured **31ms**.
- **No prerender to lose** — `/` was `force-dynamic` before and after, and the build still lists it `ƒ`.

It also agrees with what the page already did: `ClSignIn` pushes to `/listings` on success, so the second visit now behaves like the first. This restores the pre-v3 behaviour; v3's "show them the six with real bylines" died with the cards.

**THE RULE GOT AN ASSERTION, NOT A COMMENT** — lessons 8 and 9, applied rather than quoted. Three new checks in `audit:gates`: `/` redirects to `/listings` for a **member AND a Tier 1 account** (the gate is "has a session", not "is a member"), and a guest still gets 200 with the copy line **and** a live `href="/login"` — that footer link is the only door a non-member has, which is precisely the shape that has stranded a route three times this month. **`audit:gates` 0 failures**, teardown clean, seed members untouched.

**Verified in a real browser, not only over curl.** Guest at desktop, 375×812 and 375×667: **no vertical or horizontal scroll, footer flush to the bottom edge (gap 0px)**, `MobileTabBar` correctly absent. All four entrance animations bound and staggered as drawn — 0ms wordmark, 130ms line, 260ms sign-in, **520ms period** — and the period lands. The redirect proved itself by accident first: the browser was holding a real session and `/` bounced to `/listings` before I had touched a cookie.

**One thing to know, not a defect.** On a **short** phone (375×667) with the sign-in form **open**, the page gains **34px of scroll**. Closed it is exactly one screen at every size tested; the form genuinely grows the page and everything stays reachable. At 375×812 it does not scroll even open.

**Nothing else moved.** `ClLandingCard` is now referenced only from a comment — **left in place on purpose, the revert needs it**. `readPermittedListings` / `toClCards` are untouched and still serve `/listings`, `/saved` and `/listings/mine`. `.cl-hero` (min-height 100dvh) is now dead CSS, referenced only in a header comment; left for the same reason.

**The revert trigger is unchanged and worth restating:** a stranger now meets a lock with no evidence. If applications fall off, that is the cause, and the fix is the revert rather than a redesign.

---

## 2026-08-28 · Landing stripped to the door (Cowork)

**`/` is now the wordmark, the line and the sign-in, plus a hairline footer. The six listing cards are gone.** George's call, and framed as reversible from the outset: "if that proves to be not the right method, then we can always change it back." Landing v3 is one commit back in git history.

**What changed in `app/(cl)/page.tsx`:** the listings section deleted (with it the `readPermittedListings` / `toClCards` / `ClLandingCard` imports and the `LANDING_COUNT = 6` cap), and the "Not a member yet? — Request access" band deleted. The hero is untouched: wordmark, "A private marketplace for New York.", `ClSignIn`. The page is now a `min-h-dvh` flex column so the footer sits on the bottom edge instead of a hero of `100dvh` pushing it a few pixels past the fold — one screen, no scroll.

**Request access survives as a quiet footer link, on purpose.** A member has to vouch for you, so `/login` is the only door a non-member has and deleting it outright would have made the page a dead end rather than a mystery. It now reads as boilerplate beside Privacy and Terms — the exact trade v3's closing band was written to refuse, accepted here so the hero keeps one control.

**What it costs, stated plainly so the revert has a trigger.** v3's structure existed to put proof before the ask. A stranger now meets a lock and no evidence. If applications fall off, that is the cause and the revert is the fix.

**Nothing decayed underneath it.** The D1 guest teaser cap (six rows) and guest anonymity both live in `lib/cl/listings-read.ts`, not in this page, so browse and search are unaffected and v3 can be restored without touching the read layer.

**Open, and worth deciding before this ships:** a signed-in member visiting `/` now sees a sign-in screen. v3 showed them the full six with real bylines; the pre-v3 landing redirected them to `/listings`. Neither behaviour exists now. Recommendation is to redirect a signed-in visitor to `/listings`.

**Verification, and its limit.** `tsc --noEmit` and `eslint` both clean. **`next build` cannot be run from Cowork on this repo** — `node_modules` is installed for darwin-arm64 and the device shell is linux/arm64 with no npm registry access, so SWC fails to load. Typecheck and lint are the ceiling here; a real build has to happen in Claude Code or on Vercel.

**Uncommitted.** Cowork cannot push. `app/(cl)/page.tsx` is changed on disk only.

---

## 2026-08-28 · Migration 0028 applied to production (Cowork)

**Applied and verified.** `admin_update_listing`, `admin_archive_listing`, and the `corrected_by` / `corrected_at` columns all present — confirmed by catalog query returning 4 rows, not by the editor's status text. This unblocks Slice 3b's two admin write paths.

**How it was applied, because the method matters for next time.** The file is 153 lines with twenty-odd quote marks, and the Supabase SQL editor auto-pairs a typed apostrophe — the hazard already logged from 0027. Typing it through browser automation would very likely have produced `))` on the multi-line function signatures. Instead Cowork base64-encoded the file, decoded it in the page, and set the Monaco model's value directly (`window.monaco.editor.getModels()[0].setValue(...)`), then asserted `value === source` before clicking Run. **That is the pattern for any future hand-run migration: inject via the editor model, assert an exact match, then run.**

**The UI lied and the verification caught it.** After Run, the tab's renderer froze twice and the results panel showed `Running...` for several minutes. It had in fact already finished. Two independent checks settled it: an external fetch of manhattanite.com/listings (healthy — six listings, no lock contention, which was the real risk of a stuck `ALTER TABLE`), then the catalog query. **Never take a hand-run migration's status from the dashboard's own text; ask the catalog.**

**Still outstanding after this:** Claude Code finishes the four verifications it was holding (admin edit stays published, the furniture `details` data-loss case, the correction record on the owner's view, `audit:rls` with the new cells), then merge and push. Slice 3b is committed locally only.

**Open decision for George, unblocked by this slice but not part of it:** a member editing a published listing does NOT re-enter review — `updateListing` never writes `status` and the 0017 trigger waves an unchanged status through — while the post form's copy promises "It goes back through review before it's live again." Confirmed in code by Cowork. So an approved listing can be edited into anything and go live unreviewed. Three options put to George: re-pend on edit, fix the copy, or leave it live and flag it as edited-since-approval in the new console. **Cowork's recommendation is the third**, which only became possible because this slice exists.

---

## 2026-08-28 · Page speed: /listings from ~578ms to 121ms, and the real culprit found underneath (Claude Code)

**Deployed. Slice 3b, both migrations and the page-speed pass are all live on manhattanite.com.**

**MEASURED FIRST, ON PRODUCTION, WITH A SCRIPT THAT CAN BE RE-RUN.** `npm run measure` is new: six samples per route, first discarded as warm-up, cache header read on every request so a prerendered hit is never mistaken for fast server work. The point is that "the site feels slow" now has a baseline to argue with.

| Route | Before | After | Change |
|---|---|---|---|
| `/listings` | 578ms | **121ms** | ~4.8× faster |
| `/` | 356ms | **107ms** | ~3.3× faster |
| `/listings?type=furniture` | 365ms | **94ms** | ~3.9× faster |
| `/terms` | 74ms | 72ms | unchanged — already prerendered |

A second baseline run mid-session gave `/listings` 497ms, so call it **four to five times faster** rather than a single precise percentage. Both baselines and the after-numbers came from the same script on the same connection, which is what makes them comparable; George's browser numbers differ in absolute terms and agree on the shape.

**WHAT THE PROFILING ACTUALLY FOUND, AND WHERE THE BRIEF GUESSED WRONG.** The estimate was ~4 sequential Supabase calls. It was **two**, and one of them was a surprise:
- `auth.getUser()` costs a guest **0ms** — supabase-js short-circuits when there is no auth cookie. Never the problem.
- the listings select: **~185ms**.
- signing the covers: **~185ms**, a whole second round trip, already batched, and as expensive as the query itself.

**THE FIX FOR BOTH WAS ONE CHANGE.** The guest teaser is now cached for 60 seconds — the guest BRANCH, not the route, because the guest view and the member view are different pages that happen to share a URL and the route must stay dynamic. A cached function may not read cookies and must not, so it uses an ANON client; the guest read IS the anonymous read, so it cannot see anything a guest could not. Anon can sign covers (verified against prod), **so the signing moved inside the cache too and a warm guest render makes zero Supabase calls.**

`unstable_cache` rather than the `use cache` directive, and this is the decision worth recording: `use cache` needs `cacheComponents: true`, which changes how every route in the app renders. That is an enormous blast radius for one branch of one page. Adopting Cache Components deliberately is its own pass.

**THE CACHING WOULD HAVE BEEN WRONG WITHOUT INVALIDATION.** Four server actions that change what is published now drop the cache tag: approve/return/reject, admin correct and take down, member edit, member archive. **`updateTag`, NOT `revalidateTag`** — in Next 16 `revalidateTag` marks the entry stale and serves the OLD content while refreshing, and "serve the old one for now" is precisely wrong for a listing taken down because it has a phone number in public. `updateTag` expires immediately and is available because every caller is a Server Action.

**NO NAME IS CACHED AS A NAME.** The cached value is rows plus a path→URL map; the byline is assembled per request by `cardMeta(row, isGuest)` and that branch only runs when `isGuest` is true. `audit:gates` fetches every guest-reachable route and searches the body for real member names — **0 failures against production after the change**, which is the assertion that holds this rather than the reasoning.

**LAZY COVERS, BOTH CARD COMPONENTS, WHICH IS THE PASS THE OLD COMMENT ASKED FOR.** The first four stay eager so the largest contentful paint does not regress — lazy-loading the hero image is the classic way to make a page score worse while optimising it.

| View | Up front before | Up front after | Deferred |
|---|---|---|---|
| Guest teaser (6 covers) | 5,669kb | **3,706kb** | 1,962kb |
| Signed-in feed (17 covers) | 13,265kb | **3,706kb** | 9,558kb |

**AND THAT TABLE EXPOSES THE REAL PROBLEM, WHICH IS NOT SOLVED AND IS NOW THE BIGGEST REMAINING LEVER.** Those covers are **roughly 900kb EACH**, to fill a card about 230px wide. A signed-in member was being sent **13 megabytes** of photographs to look at one screen of listings. Lazy loading defers 72% of that; it does not make the bytes smaller. Nothing resizes or re-compresses a listing photo anywhere in the product — whatever a member uploads from their phone is what every visitor downloads, at full resolution, forever.

Fixing it properly is its own pass and it needs a decision, so it was flagged rather than done: **Supabase image transformations are a paid-plan feature and the brief ruled paid upgrades out of scope**, so the free route is Vercel image optimisation via `next/image`, which is complicated here by signed URLs that rotate hourly and would keep busting the image cache. A third option is resizing on upload, which costs nothing per render and changes only the write path. **If page weight is the concern rather than server time, this is where the remaining seconds are.**

**Results.** `npm run build` clean, `tsc` clean, lint unchanged at the 4-error baseline. **`audit:rls` 67/67, 0 blockers** — 59 plus the 8 new admin-write-door cells, and the teardown completed cleanly, which is itself the proof that `0029` works. **`audit:gates` 0 failures locally AND against production.**

**Also deployed in the same push:** Slice 3b (the five-screen admin console, `/admin/listings`, admin correction and take-down) and the frontend for `0028`/`0029`, both of which had been sitting unpushed. `git revert` of `e634dd4`, `0c79dd1` or `39d8aed` backs out the page-speed work, the docs and the console respectively, each on its own.

---

## 2026-08-28 · Slice 3b: the admin console, all listings, and a foreign key that locked the door behind it (Claude Code)

**The Classifieds migration is code-complete. `app/(ed)` and `app/design/` are deleted. Built, verified end to end against production, committed locally — NOT deployed, and one migration is still outstanding.**

**THE POINT OF THE SLICE WAS NEVER THE REDESIGN.** George could not take down a live listing at all: his own because the button was broken (fixed yesterday), anyone else's because it had never been built. The three 0017 verbs act only on the review QUEUE, which is `status='pending'`, and RLS on listings is owner-only for writes. A phone number in public needed a hand-written SQL statement to remove. `reject_listing` could technically do it — its own comment says so — but no screen called it on a published row, which is the same shape as the orphaned routes: a capability that works with no way to reach it.

**`/admin/listings` is new.** Every listing at every status, filterable by status and category, searchable by title and author, one row deep. View / Edit / Take down per row. Archived rows stay listed, show an Archived chip and read "Taken down" where the verb was. The list needed no migration — `listings_admin_read_all` (0015) already returns everything to an admin.

**`/admin/listings/[id]/edit` is new, and it REUSES ClPostForm.** That is load-bearing, not convenience: `details` is rebuilt WHOLESALE from the posted fields, so a trimmed-down admin editor would silently delete bedrooms, condition, dimensions and brand from any listing an admin touched — the exact bug that wiped neighborhoods off furniture listings on 27 Aug. **I went further than the brief and extracted one shared parser** (`lib/listings/form.ts`) that the member and admin paths both read the form through, so they cannot drift apart and forget a field. There is now one place to forget it instead of two.

**Migration 0028 adds two SECURITY DEFINER functions and does NOT loosen the RLS policy.** The policy is the wall, the functions are the door. `admin_update_listing` never writes `status`, `author_id` or the byline columns; `admin_archive_listing` takes anything down at any status and refuses a blank reason in the database, not just in the form.

**A BUG IN MY OWN MIGRATION, FOUND BY RUNNING THE AUDIT RATHER THAN BY READING IT.** `corrected_by uuid references accounts(id)` with no ON DELETE action defaults to NO ACTION, so **once an admin corrects a single listing their account can never be deleted** — accounts cascades from auth.users, so the auth delete fails too, with the unhelpful "Database error deleting user". It surfaced within one run of `audit:rls`, because the new cells have a synthetic admin correct a listing and teardown then could not remove that admin. **The audit died in its own teardown and stranded four synthetic users and a synthetic listing in production** — the worst shape of failure for a trust check: it did not report a problem, it became one. Cleaned up by hand (cleared `corrected_by` on the synthetic row first, then deleted, scoped to the `+rlsaudit` prefix and never wider). **Migration `0029` fixes it with ON DELETE SET NULL** — CASCADE would delete a member's listing when an admin account went away, RESTRICT is what we already had; SET NULL keeps `corrected_at`, so the record that a correction HAPPENED survives and only the pointer to who made it is lost. That is the right trade precisely because the member-facing copy names nobody. **0029 is written and sent but NOT YET APPLIED**, and `audit:rls` cannot complete its teardown until it is.

**Verified by driving the real forms against the production database, not by inspection.** A synthetic member with a published furniture listing carrying condition, dimensions, brand and neighborhood — the data-loss case. Corrected the TITLE ONLY through the real admin form:

- title changed; **status stayed `published`** — a correction does not re-pend;
- **all four furniture details survived** (condition, dimensions, brand, neighborhood);
- `author_name` untouched, so the byline is still the member's;
- `corrected_by` + `corrected_at` stamped;
- **"Corrected by Manhattanite" shows to the OWNER and to nobody else** — checked as the owner, as another member and as a guest;
- taken down through the real control with the reason "Phone number in the description": status `archived`, reason recorded in `moderation_note`, details intact (soft delete), gone from `/listings`, still listed on `/admin/listings` as Archived.

**Production was left byte-identical to how it started**: 0 synthetic users, 0 correction stamps, 20 published, 22 total.

**THE RETIREMENT, AND TWO THINGS THE BRIEF GOT WRONG ABOUT IT.** `app/(ed)`, `app/design/` and 26 orphaned editorial components are gone — 34 files, ~4,400 lines.

- **`globals.css` STAYS.** It carries `@import "tailwindcss"` and the ROOT layout imports it, so deleting it would have taken the whole app down, Classifieds included. Two of its utilities (`mh-gutter`, `mh-no-scrollbar`) are still used by live screens. Its editorial half is now dead code and is its own pass.
- **`ListingCardData` had to move first.** `lib/listings/card.ts` — which browse, the listing page, member profiles, the filter rail and the archived row all depend on — imported that TYPE from the editorial `ListingCard` component. Deleting the component would have broken the live system. The type now lives with the data, where it belonged: a component may render a shape, it does not get to own it.

**The console carries its own nav now** (`ClAdminShell`), so no admin screen is more than one click from any other. Five back-links to a dashboard is not navigation, it is four dead ends and a hub — and it was the fourth instance this week of a screen outliving its entry point. `AppHeader` stays SYNCHRONOUS and still takes `admin` as a prop; the shell passes it unconditionally because `requireAdmin` has already run above it. Making it async would have flipped the prerendered-static routes to server-rendered for a link one account sees.

**THE ADMIN SURFACE HAD NO GATE ASSERTIONS AT ALL BEFORE TODAY.** `audit:gates` now attacks all six admin routes as guest, member and Tier 1 — 13 new assertions — checking not just the 404 but that the console's own furniture ("All listings", "Take down", "The state of the network") never reaches the body. That matters more now than with three read-only screens: this console has two write paths and one page listing every pending and archived row.

**Also fixed, caught by pointing the page at prod before 0028 was applied:** `/admin/listings` rendered a clean, confident, **empty** table when the read failed, because `data ?? []` turns any query error into "0 listings". On the one screen you check to find out what is on the site, that is the worst possible lie. It now surfaces the error and names the migration.

**Also fixed:** the form's own heading ("Edit your listing · It goes back through review before it is live again") was rendering under the admin intro saying a correction leaves it live — two contradictory sentences a hundred pixels apart. Suppressed in admin mode. **The underlying copy is still wrong on the MEMBER edit screen**: `updateListing` never writes `status`, so no edit re-pends anything and the promise of re-review is not kept. Flagged again; still George's call.

**Results.** `npm run build` clean, `tsc` clean, lint unchanged at the 4-error baseline. `audit:gates` **0 failures locally**; against production **2 failures, both correct** — `/admin/listings` and its edit route answer a guest with 404 instead of the /login redirect, because they are not deployed yet. `audit:rls`: **all 8 new cells pass**, including the positive control and the "a correction must not re-pend" check, but the run cannot complete its teardown until 0029 is applied.

**Next:** apply 0029, re-run `audit:rls` for a clean full pass, then deploy. After that the Classifieds migration is finished and `design/classifieds-live` can be dropped.

---

## 2026-08-27 · Profile fixes, the sort control removed, and a takedown button that never worked (Claude Code)

**Four tasks plus a fifth George found mid-session. All done, built, audited, NOT merged or deployed — waiting on his review.**

**THE GATE FAILED FIRST, AND THE REASON TURNED OUT TO BE THE FIFTH TASK.** The brief opened by asking me to confirm a test listing George had published that morning was gone before starting. It was not: `Test - Ignore`, published, authored by him, live to a logged-out visitor on manhattanite.com, published count 21 rather than 20. I stopped and said so rather than working around it. He came back with task 6 — the takedown button on the edit screen does nothing — which is *why* the row is still up. He tried to remove it himself and the product would not let him. **It is still live as of the end of this session.**

**Task 6 — "Take this listing down" saved the edit instead.** `ClRemoveListing` brings its own `<form>` and was rendered as the last child *inside* the post form's `<form>`. A nested `<form>` is invalid HTML, the browser drops the inner one, and the submit button re-associates with the outer form — so pressing "Yes, take it down" ran `updateListing`. Never worked; shipped with the Classifieds merge (`4759502`) and was live for a fortnight. The fix is a two-line move: `ClPostForm` returns a fragment with `<ClRemoveListing>` a true sibling after `</form>`.

**Both files already carried a comment stating the exact rule that the code broke.** `ClRemoveListing`'s header says it must be "A SIBLING OF THE POST FORM, NOT A CHILD"; `ClPostForm` repeated it at the render site. Both were right and both were ignored by the code beneath them. **A comment is documentation, not enforcement** — and this is the second nested-interactive-element trap in this component family, after the button-inside-a-link on the card.

**So the guard is now a test, and the test has teeth — demonstrated, not assumed.** `audit:gates` gained `checkNotInForm()`: fetch the real edit page as a real member, strip `<script>` blocks so the RSC payload cannot answer for the markup, and count unclosed `<form>` tags between the top of the document and the control. Zero means sibling. I reverted `ClPostForm` to the buggy version and re-ran it: **both assertions failed with "is 1 `<form>` deep, so its submit posts the OUTER form"**, then passed again on the fix. `test-edit-archive.ts` was deliberately not the home for this — it drives `archiveListing` straight at the database and passed the entire time the button was dead, because it tested the action beneath the control and the control was the broken half.

**Verified by using it, on the real form, against production data.** A synthetic member with three listings. On the published one I first typed a contaminant into the Title field, *then* took it down: the row came back `status='archived'` with **the title unchanged**, which is the sharpest available proof that `updateListing` did not run. The archived listing left `/listings`, appeared under Archived on `/listings/mine`, and its own page answers 404 leaking no field. On the **pending** one the copy read "still in review… pulls it out of the queue" and taking it down took the moderation queue from 1 to 0. "Keep it" cancels. A normal edit still saves — and kept its Tribeca neighborhood, so this morning's furniture fix still holds. All synthetic rows purged; published count back to 21 (still George's test row).

**Task 1 — `/listings/mine` was unreachable, and this is the third instance of one pattern.** The page worked; nothing linked to it. Its only two doors were `SiteFooter` and `AccountMenu`, both editorial, and after the migration the only `(ed)` routes left are the four admin pages — so the only way into a member's own listings rendered on screens only the founder can see. That is why only the founder found it. **`/admin` before the merge, `/search` this morning, `/listings/mine` now.** Fixed by adding a My listings row to the profile side menu, second, same treatment as Saved.

**The reusable lesson, which matters more than the fix: when a design system is retired, the surviving routes need their entry points re-homed. "The route still works" is not the same claim as "someone can get there."** Nothing in a build, a type check, `audit:rls` or `audit:gates` can see an orphaned route, because every one of them addresses routes by URL — the one thing a stranded page still has.

**So I swept the rest, by crawling rather than reading.** Started where a signed-in member starts (Browse and Profile), followed only real `href`s, collapsed the ids to route shapes. `/listings/mine` now reachable. One genuine orphan remains, `/invite`, and it is a **deliberate** one — the page documents its own state ("STILL NO IN-PRODUCT ENTRY POINT") and is waiting on the growth-loop decision, not on a link. I left it alone; adding an invite entry point is George's call, not a tidy-up. Everything else unreached is unreached on purpose: `/thank-you` and `/profile/edit` are landing pads for old links, `/search` is the 308, `/join` `/sponsor-request` `/reset-password` arrive from email, `/apply` and `/signup` belong to guests and tier-1.

**One low-severity finding from the sweep.** `/listings/[id]/contact` has no `href` anywhere — contact is reached through `ClContactModal`'s "Get in touch" button. Fine for anyone with JavaScript, but the route's own header comment claims "It is linked directly", which is now false, and with JS off a member has no path to contact a lister at all. Flagged, not fixed.

**Task 2 — "Leaving" is no longer a menu item, and neither thing inside it was lost.** It sat as a peer of Account, Saved and Vouching, which is a strange fourth thing to offer someone. But the product's **only** sign-out button was in there, and so was the email route that makes `/terms` ("You can close your account at any time") and `/privacy` ("When you ask us to delete your account, we delete…") true — deleting it would have left the policy overclaiming, the same error corrected on `/privacy` on 26 Aug. Sign out is now a quiet control at the foot of the Account panel, still a POST (a prefetched GET would sign people out on hover), with the account-closure line as muted text beneath it carrying `id="leaving"` so `/profile#leaving` still lands on the paragraph it described. Rail is now **Account · My listings · Saved · Vouching**.

**Task 3 — vouched names link to their profiles, both lists.** `get_my_connections()` already returned `account_id`; it was being used only as a React key. Rather than patch one list, both directions now render through one `ConnectionList` component — they were duplicated markup, which is exactly how one could have got linked names and the other kept plain text forty pixels below. Whole row is the target, avatar included; the placeholder stays `aria-hidden` so the name is announced once. No privacy change: the names already rendered here, `/profile` is member-only, `/members/[id]` walls a guest, and the same name is already a link in a listing byline — one of the two treatments was wrong and it was this one. `primaryLabel` is passed only for the sponsor direction, so "brought you in" cannot appear backwards on someone you brought in yourself. Verified with both directions populated, `is_primary` true on both, and the tag renders inside the sponsor's link and nowhere else.

**Task 4 — sorting by price is gone, and the sort control went with it.** Ranking the network cheapest-first is the Craigslist frame and the opposite of what this product is. The min/max boxes already answer the real question: a filter says "within what I can spend", a sort says "rank these people by how cheap they are", and only the first is a budget tool. With price gone, "Newest" was a control with one option, so the whole row went; the result count stays. Removed: `SORTS`, `byPrice`, `sort` from `ClQuery`/`parseQuery`/`buildHref`, and the hidden `sort` fields on both the search form and the rail. **`?sort=price` renders the default feed and errors on nothing** — verified by comparing card order between `/listings` and `/listings?sort=price`: identical.

**This deleted the unpriced-sorts-last rule added this morning, and that is correct rather than a regression.** It existed only because a price sort existed. **Nobody should re-add it thinking it was lost by accident.** Blank prices still render as no price line and are still excluded by a min/max filter — both re-verified on a NULL-price listing, whose card carried no `$` at all and whose detail page omitted the line entirely.

**A mismatch found in passing, not fixed.** The edit screen says "Change anything. It goes back through review before it's live again." `updateListing` deliberately never writes `status`, so an edit to a published listing goes straight back live with no re-review — the 0017 trigger waves content edits through by design. The copy promises a moderation step the product does not perform. Whether the copy or the behaviour is wrong is a trust-layer call, so it is George's.

**Results.** `npm run build` clean, `tsc` clean, lint unchanged at the 4-error pre-existing baseline. `audit:rls` **59/59, 0 blockers**. `audit:gates` **0 failures locally**. Against `APP_ORIGIN=https://manhattanite.com` it reports **2 failures, and they are the correct answer**: the two nested-form assertions, because production is still running the buggy build. They will go green on deploy. (A first prod run also showed two name-leak failures — those were my own synthetic fixtures, whose member was named "Takedown Tester" and whose listings were titled "Takedown walkthrough…", so the audit found "Takedown" in listing titles. Gone after cleanup; worth knowing that the name check is sensitive to fixture naming.)

**Next:** George removes `Test - Ignore` — the takedown button now works, so the edit screen will actually do it once this is deployed. Then Slice 3b (`/admin` ×4), and a decision on whether `/invite` gets an entry point.

---

## 2026-08-27 · Both bugs fixed, batch merged and deployed (Claude Code)

**George's call on the two bugs reported above: fix them and merge. Done, verified against production, and live.**

**Fix 1 — listings with photos can be posted and edited again.** `ClImageUpload` now sends `JSON.stringify(items.map(i => i.path))` — the array of strings both server actions have always documented and checked for. The `{ path }` row shape is still built server-side, after the ownership check, so the actions keep owning the stored shape. Confirmed live by pulling the deployed chunk off manhattanite.com and reading it: `name:"images",value:JSON.stringify(r.map(e=>e.path))`.

**Fix 2 — furniture keeps its neighborhood.** `create.ts` and `update.ts` now read `neighborhood` in the furniture branch too. `details` is still rebuilt wholesale on update, which is deliberate — a category switch must not leave stale keys — so the seed-only `tags` and `category` are still dropped on edit. Nothing reads them; checked before deciding to leave it.

**Verified by driving the real form against the production database, not by inspection.** The coffee table that had silently refused to save now saves and keeps "Lower East Side". A brand-new furniture listing posted **with a photo, a blank price and a Tribeca neighborhood** landed as `price_cents` NULL, `details.neighborhood` "Tribeca", `images` in the stored `{ path }` shape, `status` pending — and `/admin/moderation` rendered both "No price" and the neighborhood row. That single post is the whole batch proved at once. Test row deleted, both orphaned Storage objects removed by exact path (never by prefix — the founder's folder holds the real seed photos), and the database diffed byte-identical to where the session started.

**Merged `2e80c65` (`--no-ff`) and pushed.** `git revert -m 1 2e80c65` backs the whole batch out on its own. Build clean, tsc clean, lint unchanged from the 5-error baseline, static route count unchanged at 10, `audit:rls` 59/59, `audit:gates` 0 failures locally and against production.

**Post-deploy checks on the live site, all five of George's notes confirmed.** Header inner box and `<main>` both measure 100 → 1500 at a 1600px viewport, so the 80px inset is gone and "Post a listing" sits inside the grid. Search box is on Browse. Furniture cards read "FURNITURE", apartments still read their neighborhood. The neighborhood filter group appears under Apartments and not under Furniture, and a stale `?hood=Tribeca` leaves the URL when you switch category (the furniture link renders as a bare `/listings?type=furniture`). `/search?q=lamp` → 308 → `/listings?q=lamp`, carrying the query — which doubled as the deploy marker, since it is behaviour that only existed after this merge. Guest name rule still holding on `/listings?q=coffee`: "Vouched by a member", no real names.

**The lesson worth keeping, and it is not about prices.** Both bugs were the same shape: **a form control that renders but the server action never reads.** One let a member type a neighborhood that was thrown away; the other let them attach a photo the save then rejected. Neither is visible in a passing build, a passing `audit:rls` or a passing `audit:gates` — the first two never touch the form and the third fetches routes without submitting them. And **seed data actively hid it**: `seed-example-listings.ts` writes rows through the service role, so a site full of photographed listings sat on top of a form that could not attach a photo. A sweep of every form control against what its action actually reads is worth doing before Slice 3b.

**Next:** Slice 3b (`/admin` ×4) is still untouched and is now genuinely all that is left of the Classifieds migration.

---

## 2026-08-27 · Blank-price walkthrough: the feature passes, two pre-existing bugs found (Claude Code)

**Walked the blank-price feature end to end against the production database with `0027` applied. Every assertion in the plan passed. The branch is NOT merged — stopped at that step deliberately, see below.**

**Part A, the create path.** Posted a service listing with the price field left empty. The Review step reads **"No price"** in muted text; the submit was accepted with no validation error, which is itself the proof `0027` took on prod. `/admin/moderation` says **"No price"** out loud, as the second of the two deliberate exceptions. `/listings/mine` rendered it with no price line while pending. Rejected it from the moderation queue (never published), and it then sat in the archived list still showing no price — so `ClArchivedRow` handles NULL correctly too. The row was hard-deleted afterwards.

**Part B, the edit path — the half most likely to be broken, and it is sound.** Cleared the price on an existing listing through the real edit form. It stored **NULL, not 0**. Browse card, listing detail page and `/listings/mine` all render nothing where the price was — no dash, no `$0`, no `$NaN`; the rendered HTML was grepped for both rather than eyeballed, and the detail page's contact card omits the line entirely with no gap above the byline. **Price sort puts the unpriced listing LAST** (position 8 of 8), not first. **Both a min+max and a min-only price filter EXCLUDE it.** A blank round-trips back into the edit form as a blank. Original price restored through the same form.

**The database is byte-identical to how it started** — snapshot diffed before and after: 21 rows, 20 published, 1 archived, 0 NULL prices, 0 zero prices. `npm run build` clean, **`audit:rls` 59/59**, **`audit:gates` 0 failures locally AND against `APP_ORIGIN=https://manhattanite.com`.**

**BUG 1 — nobody can post or edit a listing with a photo. This is live on `main` right now.** `ClImageUpload` writes the hidden `images` field as an array of OBJECTS — `[{"path":"..."}]` — while `create.ts` and `update.ts` both require an array of STRINGS (`typeof item !== "string"` → reject). Every save of a listing carrying at least one photo dies with **"Photos didn't upload cleanly. Try again."**, which is misleading: the photo uploaded fine, it is the form's own wire format that is wrong. Caught empirically — the first Part B attempt, on a listing with one photo, returned 200 twice and changed nothing. The retiring editorial `ImageUpload.tsx` writes `items.map(i => i.path)`, the correct shape; the Classifieds restyle changed the wire format while its own comment claims it "writes the same hidden `images` JSON field that createListing reads". It does not. Shipped with the Classifieds merge (`4759502`, 27 Aug). The error IS rendered (`ClPostForm` line 408) but sits below the fold. **Not introduced by this branch** — the branch's edits to `create.ts`/`update.ts` are price-only, and the mismatch is identical on `main`. Every seed listing has photos because the seed script writes rows directly through the service role, bypassing the form — which is why this was never hit.

**BUG 2 — editing a furniture listing silently deletes its neighborhood.** The Neighborhood field renders for EVERY category, but `create.ts`/`update.ts` read `neighborhood` only for apartment, other and service — never furniture. `update.ts` rebuilds `details` wholesale, so a furniture listing edited through the form comes back with `details.neighborhood` gone. That is the data `neighborhoodOf()` feeds to search, so it would quietly break the "searching 'tribeca' finds a Tribeca coffee table" behaviour locked in on 26 Aug. Seed furniture rows also carry `tags` and `category`, which the form cannot express and would drop the same way. Pre-existing, same merge.

**Why the merge did not happen.** The standing instruction is to stop and report rather than work around a failure. Bug 1 blocks the product's core action and lives in the same form this batch touches, so whether to merge the walkthrough batch as-is or fold an image fix into it is George's call, not one to make silently. The batch itself is verified and ready; nothing about it makes either bug worse, and both are already live.

**Next:** George's call on merge order. Bug 1 is a one-line fix in `ClImageUpload.tsx` (`({ path: i.path })` → `i.path`) or, better, widen both server parsers to accept either shape. Slice 3b (`/admin` ×4) still untouched.

---

## 2026-08-27 · The walkthrough batch built, verified and branched (Claude Code)

**Ran the handoff prompt from the Cowork session below.** Branch `classifieds-walkthrough-fixes` off `main`, one `--no-ff` merge intended, so the whole batch reverts as a unit the way the migration does.

**Task 0 — the blank-price work Cowork left in the tree — reviewed rather than trusted, and it was sound.** 13 files, no changes needed. The one thing that could not be done here: **`0027` still needs running in the Supabase SQL editor.** Until it does, `price_cents` is NOT NULL and posting a blank price fails at the database, which is why the end-to-end walk (post → moderate → publish → edit → clear an existing price) is **not done and is George's next step**. The pure logic underneath it WAS proved: `formatPrice(null)` renders nothing while `formatPrice(0)` still renders `$0`, and the Price sort puts unpriced listings last — the free-vs-blank distinction the migration comment exists to protect.

**Tasks 1–5 built.** The neighborhood filter is apartments-only, held by one predicate (`hoodApplies`) read by six call sites, so switching category strips a stale `?hood=` out of the URL rather than filtering invisibly. Card kickers lead with the category for non-apartments. Saved left the header nav and the phone tab bar for a row on `/profile`. Search moved onto Browse and `/search` is a 308 that carries its query string. `AppHeader` takes a `width` prop.

**The trap the prompt warned about was real, and the fix is verified rather than assumed.** `placeOf()` was display AND data. Split into `neighborhoodOf()` / `placeOf()`; proof that it worked is that `/listings?q=tribeca` still returns "Swivel lounge chair, oak base" — a furniture listing whose card now reads "FURNITURE", not "TRIBECA".

**One regression caught that the prompt did not anticipate.** The listing detail page rendered "Selling in {placeOf}", which the kicker change would have turned into **"Selling in Furniture"**. Repointed at `neighborhoodOf` and the clause is now dropped entirely when there is no neighborhood — it had been quietly rendering "Selling in Other" before this batch, so that is a pre-existing wart fixed on the way past.

**Verification.** `npm run build` clean; the eight prerendered-static routes are still static, so the header's `width` prop did not cost what an async lookup would have. `tsc` clean; eslint unchanged from baseline (5 pre-existing errors, one fewer than baseline — the new `/profile` link consumed an import that had been sitting unused). **`audit:rls` 59/59. `audit:gates` 30/30 locally AND against `APP_ORIGIN=https://manhattanite.com`.** By eye at 1600px: header box and `<main>` both measure 100 → 1500, and "Post a listing" shares the card grid's gutter.

**A footgun worth carrying: `audit:gates` reports false failures against a COLD dev server.** The first run gave 8 failures, all on `/listings/[id]/edit` and `/contact`, all reading as 404s. Baseline on stashed changes gave 0; re-running warm gave 0. Next had not compiled those routes yet. This is the second time this audit has cried wolf (the production-build string on 27 Aug being the first) and the file's own header is right that a trust check which cries wolf trains you to ignore it. **Warm the server first.**

**Housekeeping, and it was worse than the prompt said.** `CLAUDE.md` claimed migrations applied through `0017` when 26 were on disk — corrected to `0026` applied, `0027` pending, with a note to re-check rather than trust the line. **It also claimed `0013` was written-but-not-applied; probing the live schema says `column listings.sponsor_name does not exist`, so `0013` IS applied and the dual-write is long gone.** Both were stale in the direction that would have caused someone to redo finished work.

**Flagged for George, not actioned:** the site has **five** content widths (1400 / 1240 / 1100 / 1000 / 900 — `/profile` is the fifth the prompt missed). Also: on a phone the search box now sits *below* the category chips and the price disclosure, because the filter rail is the first thing in the layout. It reads coherently but a search box usually goes on top; re-ordering it is a layout change the prompt did not ask for.

**Next:** George runs `0027`, then walks one blank-price listing end to end. Then this branch merges. Slice 3b (`/admin` ×4) is still untouched.

---

## 2026-08-27 · George's live-site walkthrough — five notes, one build, one Claude Code prompt (Cowork)

**UPDATE, same day — `0027` IS APPLIED TO PRODUCTION.** Run by Cowork through George's browser (Claude in Chrome) in the Supabase SQL editor after he signed in; Cowork itself has no network from the device bridge, and signing in is not something it does. Verified from the catalog rather than the success banner: `select attname, attnotnull from pg_attribute where attrelid = 'public.listings'::regclass and attname = 'price_cents'` returns **false**. The column is nullable on prod.

**Safe to have applied ahead of the merge:** `drop not null` only widens what is allowed, and the code currently live always sends a price. The branch `classifieds-walkthrough-fixes` is still unmerged and unpushed.

**One thing worth knowing for any future hand-run migration:** the Supabase SQL editor auto-pairs a typed apostrophe and silently doubles it, so the original `'...a members'' rate...'` comment string was a hazard. The comment now uses dollar quoting and contains no apostrophe at all, and the migration FILE was updated to match what actually ran, so the repo and the database agree. Rule to carry: **write hand-run migrations apostrophe-free and dollar-quoted.**


**George walked manhattanite.com the day after the Classifieds merge and gave five notes.** All captured in `WORK AREAS/Product/design-foundation-project/outputs/Classifieds_Website-Notes_v1.md`, turned into a handoff at `Classifieds_Claude-Code-Prompt_v1.md` in the same folder.

**Three decisions made (27 Aug):**
1. **Browse cards lead with the CATEGORY, not the neighborhood**, for everything that is not an apartment. Leading a $220 coffee table with "LOWER EAST SIDE" is rental-portal grammar and was the second-biggest reason the site reads as a rental site (the biggest is the seed mix — 12 apartments of 20, which is content, not code).
2. **Search moves onto Browse and `/search` retires.** It was fully built and linked from nowhere in the product; it is also the same read as browse with a text term. `/search` becomes a redirect, not a 404.
3. **"Looking for" / wanted listings are PARKED.** Discussed at length — classifieds have two directions and Manhattanite only has one — but the blank-price change already unblocks the cases George was actually hitting.

**Built this session (uncommitted, in the working tree): a listing may have no price.** 13 files + `supabase/migrations/0027_listing_price_optional.sql`. **The migration is NOT applied — posting a blank price fails at the database until it is.** The rule to carry forward: **NULL is "no price", 0 is not**, because free is a real asking price; nothing may branch on falsiness. Renders as nothing everywhere a member or visitor looks; says "No price" out loud in exactly two places, `/admin/moderation` and the post form's Review step, where silence would read as a broken row. `tsc --noEmit` clean and eslint clean; **never built and never opened in a browser** — Cowork avoided writing `.next` with the dev server possibly up.

**A real defect George's eye caught that measurement confirmed.** "Post a listing" looked randomly placed because `AppHeader` is `max-w-[1240px]` over a browse `<main>` of `max-w-[1400px]` — the whole header is inset 80px each side from the page beneath it. Underneath: **the site has four content widths** (1400 / 1240 / 1100 / 1000) that nobody chose; they accumulated. Fix specced as a `width` prop on `AppHeader`; collapsing four widths to two is flagged for George, not actioned.

**One trap found while specifying, worth remembering:** `placeOf()` is doing two jobs — the display string on the card AND the data value that the neighborhood filter and the search haystack compare against. Changing it for the card would silently break searching "Tribeca" for a Tribeca coffee table. The prompt splits it into `neighborhoodOf()` (data) and `placeOf()` (display) before touching either.

**Also corrected:** `CLAUDE.md` claims migrations are applied through `0017`; there are 26 on disk. Instructed as housekeeping in the prompt.

**Next:** Claude Code runs the prompt. Slice 3b (`/admin` ×4) is untouched and still outstanding.

---

## 2026-08-27 · Pricing — when to charge, what to charge for, and what it earns (Cowork)

**Strategy session, no decision taken yet.** George asked three questions: when to start charging to post, whether to charge for everything, and what the margins and profits look like. New work area project created: `WORK AREAS/Product/monetization-project/` (brief, memory, outputs). Full analysis in `outputs/Manhattanite_Pricing-Model_v1.md`.

**When.** Recommended switching the trigger from a member count to an observation: charge once posting reliably produces a result. Three signals together — members posting a second time unprompted, most apartment listings drawing a genuine reply within a week, and real listings outnumbering the seed ones without George chasing. That lands near the end of Cohort 2 anyway, which is what `gtm-playbook.md` already says, but it is now something to watch rather than a number to hit.

**What.** Apartments $99 for 30 days and free until rented (the Gens de Confiance guarantee). Furniture free forever, on the argument that furniture is the browse habit and the habit is what makes apartment listings worth paying for. Jobs $75 when v1.5 lands, and flagged as a possible bigger earner than apartments: Craigslist charges $5 for an NYC apartment and $45 for an NYC job, and jobs carry no fair-housing exposure. Featured slots later, once position on the page matters. This also argues against the playbook's "one free listing a month, then $25", which charges the most active members the most.

**The July rationale is stale; the conclusion isn't.** The 2026-07-14 note priced apartments high because broker-fee pain makes $149 look cheap. NYC's FARE Act took effect 2026-06-11 and moved broker fees off tenants onto landlords, so that argument is gone. The right anchor is what a lister pays: StreetEasy for-rent-by-owner is $249 per two weeks, agent listings $7–22 a day, Listings Project $47 a week in NY. $99 still reads cheap.

**Margins.** 96.8% gross per listing ($3.17 of card fees on $99); running costs ~$10/month now, ~$70–100 later, so one paid listing a month covers every bill. The binding constraint is George's review time, not money: at 5,000 members the listing queue alone is ~67 hours a month before applications, which forces a hire-or-loosen decision. A salary-sized income needs roughly 2,500 members, so realistically 2028. Below 500 members charging is a signal, not income.

**Two operational points that change the build.** Payment must be authorised on submit and captured on approval, never charged up front, because every listing is manually reviewed and up-front charging means refunding every rejection. And the standards page should be published before the first dollar, so a declined paying poster meets a written rule rather than a personal judgement.

**Open with George:** the apartment price ($99 or test $75) and whether furniture stays free permanently or only through v1. Nothing is confirmed until he answers.

**Follow-up in the same session — the 20,000-member scenario.** Revenue $600k–$1.2m a year depending almost entirely on how often members post (2% vs 4% a month swings it double); costs ~$470–540k, three-quarters of it payroll, because 3,200 listings a month at five minutes each plus applications and support is 2.7 full-time people. **Break-even is ~470 paid listings a month, or 2.4% of members posting** — one percentage point of posting frequency separates a comfortable business from a treadmill. Three things change at that size: the vouch stops being personal (GDC's answer at 2m members was reporting plus insurance, not judgement), fair-housing exposure attracts organised testing and needs a retained lawyer plus FARE Act fee-disclosure fields on the posting form, and the audience itself becomes more valuable than the listing fees — which is exactly when ads, data and broker packages start to look sensible, all three currently ruled out at a cost of perhaps a third of achievable revenue. From 100 members at year end, 20,000 is 2030-and-later on Manhattan alone, and one in eighty Manhattan residents is a high enough share that it implies expanding beyond Manhattan.

**And what it would sell for at that size: $2m–$6m, most likely low single millions.** Three methods converge — owner-earnings multiples (marketplaces run 4.5–8x adjusted earnings per FE International, but Manhattanite sits at the bottom of that band: one-off revenue, one city, every listing through George), revenue multiples (Nextdoor is worth $890m on $260m of revenue in Aug 2026, down 71% from its 2021 peak with 100m+ users — neighbourhood networks are not automatically valuable), and value per member (Zillow paid $50m for StreetEasy's 1.2m monthly visitors in 2013, ~$42 a head for anonymous traffic; 20,000 vouched Manhattanites are worth more each). **Two flags George should hold consciously:** pay-per-post is transactional and buyers pay roughly double for revenue that renews, so "membership free forever" plausibly halves the exit (GDC's renewing rental subscription is ~60% of their revenue); and owner dependency is the single biggest discount buyers apply, which makes written moderation standards and a trained reviewer value creation rather than admin. Likely buyers: Zillow (bought the NYC incumbent once already), a brokerage such as Compass chasing off-market supply, a members' club or NY media brand buying the audience, or a search fund buying the cash flow at 3–4x. Honest summary given to him: at 20,000 members this is an excellent small business, not a venture outcome, and the four moves that would make it one (ads, data, broker packages, loosening the gate) are the four already ruled out. Prerequisite flagged: no buyer moves without two years of clean verified accounts, and there is still no entity.

---

## 2026-08-27 · The Classifieds migration merged to `main` — first code deploy since 22 July (Claude Code)

**What shipped.** Slices 1, 2 and 3a merged to `main` as a single `--no-ff` commit (`4759502`), 202 files, +12,158 / −3,354, carrying five weeks of accumulated change in one deploy. Every screen a normal person can reach is now the Classifieds system, live on manhattanite.com. Vercel build green in 43s: `manhattanite-gzljlxoxj-georgegardner97s-projects.vercel.app`. The undo is one `git revert -m 1 4759502`, which is what `--no-ff` bought.

**The regression fixed before the merge, not after.** `/admin` was linked from exactly one place — `AccountMenu`, inside `SiteNav`, mounted only in `app/(ed)/layout.tsx`. After the merge the only `(ed)` routes left ARE the four admin pages, so the sole link into the console would have rendered only on pages you cannot reach without already being there. The routes and their gates were never the problem; the way in was. `AppHeader` now takes an optional `admin` prop and renders a quiet, unpilled Admin link beside the action pill.

**It is a prop, not a session lookup, and that was the whole design question.** Making `AppHeader` async to read the viewer's role would have flipped eight prerendered-static routes to server-rendered-on-demand — `/terms`, `/privacy`, `/thank-you`, `/reset-request`, `/reset-password`, `/profile/edit` and the two `/design` pages — and charged every visitor an auth round trip for a link one account will ever see. So `/profile` passes the flag: the one screen that already reads the account row, one added column, and a permanent item in this header's own nav. **The route table is byte-identical before and after.** Slice 3b can widen the door.

**The production run of `audit:gates` found something, and it was the audit.** Two gates that pass locally failed against manhattanite.com: a member asking to edit someone else's unpublished listing, and the same for a nonexistent id. Neither is a hole — production refuses both with no form, no listing content, and a 24,225-byte shell byte-identical to the nonexistent case, against 34,324 bytes for a listing that member owns. The detector required the literal string `not-found` alongside `NEXT_HTTP_ERROR_FALLBACK`; `npm run dev` carries that hyphenated module path in its bundle and a production build hashes it away, spelling the slot `notFound`. Both builds emit `NEXT_HTTP_ERROR_FALLBACK;404`, so that is what it matches now — with the status code, because a fallback is also how other HTTP errors travel. **This is the exact failure the file's own header warns about**: a trust check that cries wolf trains you to ignore it. It was written against a dev server and had never met production until today.

**Verified against production, not localhost.** `audit:gates` 30/30 with `APP_ORIGIN=https://manhattanite.com`, including the guest name-leak assertions — their first real run, on the site Google indexes. `audit:rls` 59/59, zero unexpected ALLOWs, prod state untouched either side (4 seed members, 20 published listings, founder row byte-identical). Signed out: exactly six listing ids on `/listings` and every byline reads "Listed by a member" / "Vouched by a member" in the rendered HTML *and* the RSC payload; the seventh listing is the members-only wall and leaks no title, description or price; `/members/<id>` is the wall. `/terms` and `/privacy` render in `.cl-doc` and now say "We don't run analytics." `/reset-request` is inside the system. Favicon (`/icon/16|32|64`) and the OG card (1200×630 PNG) both still render — `/favicon.ico` 404s, which is Next's file convention, not a regression. Signed in as the founder on prod: `/listings/new`, `/profile`, `/listings/mine` and all four `/admin` screens, reached through the new entry point.

**One thing worth knowing about the two false alarms.** A first pass with an ad-hoc name-leak checker reported "Max" leaking on `/listings` and an analytics claim surviving on `/privacy`. Both were faults in the throwaway script: "Max" is the price filter's `placeholder` and also a real seed member's name, and the privacy page says it does *not* run analytics. `screen-fixtures.ts` had already solved the first — its doc comment names Max specifically — which is the argument for running the repo's own audit rather than writing a parallel one.

**Next:** Slice 3b — `/admin` ×4 — after which `app/design/` and the `(ed)` group retire together, along with `globals.css`, `SiteNav`, `NavGate`, `AuthShell`, `PageShell`, `BoxButton`, `ArrowLink` and the editorial `ListingCard`. `design/classifieds-live` stays until 3b has shipped and settled.

---

## 2026-08-26 · Classifieds Slice 3a — the byline decision, then the screens people still see (Claude Code)

**Step 1 was the decision, and it is the half that is hard to walk back.** George's call: a logged-out visitor sees no member name and no sponsor name, anywhere. The landing had anonymised since 18 August while `/listings` named everyone to the same guest one click away — one of the two pages was wrong about how public a member's name is, and now that the landing is `/`, it is the one Google indexes. Browse changed to match the landing.

**One function, not a flag through five pages.** The landing's page-local `anonymousMeta()` is deleted; it is now the guest branch of `cardMeta()` in `lib/cl/listings-read.ts`, which browse, search, saved and the landing all already read. `toClCards()` gained a REQUIRED viewer argument in place of an optional meta override — so a screen used to get named bylines by saying nothing, and now a new screen will not compile until it states who is looking. Two screens needed more than a different string: `/listings/[id]` anonymises the lister and the sponsor inset for a guest (and drops the link through to their profile), and **`/members/[id]` becomes the members-only wall for a guest entirely** — the whole page is a named member, so anonymised it says nothing. Side effect worth having: member profiles stop being indexable.

**The assertion is the point, not the change.** This is the same class of bug as Slice 1's trust hole — application-layer, invisible to `audit:rls`, which passes 59/59 either way. `npm run audit:gates` now fetches every guest-reachable route and searches the response for the real names in the database. **Its first run failed, correctly and awkwardly:** it found "Max" on `/listings` — the price filter's placeholder, and also a real seed member. The check is now two-channel: every name against the VISIBLE text (tags stripped, so a placeholder cannot trip it), and full names only against the whole response including the RSC payload (which caught a genuine payload-only leak on `/saved` during the negative-control run — cards serialised to a client component, invisible on screen, one View Source away). Both channels were negative-controlled by breaking the rule and watching them fail. 30 assertions now, all green.

**Then the screens.** Eight of the twelve remaining `(ed)` routes moved: `/reset-request` and `/reset-password` first, because reset was the only editorial screen a normal person could still reach from inside the new system (from the sign-in failure and the Password row on `/profile`); then `/thank-you`; `/terms` and `/privacy`; and the growth loop — `/invite`, `/join/[token]`, `/sponsor-request/[token]`. Only the four admin screens are left, and George is the only person who sees those.

**Terms and privacy needed designing, not porting** — the Classifieds kit had no prose treatment at all: no measure, no heading scale for a document, no draft-notice box. Built once as `.cl-doc` + `ClDocument`, because the standards page will want the same thing. Body type goes UP to 15px there (13.5px is right for a label, and a wall for a legal document), the measure is 66 characters, and the serif stays out — Newsreader is the wordmark, not a heading face.

**Two corrections made while inside those files.** The privacy policy claimed "basic, privacy-respecting analytics" and "lightweight analytics"; the site runs none — no Plausible, no Google, no Vercel Analytics, nothing. That came out, with a line saying the tool will be named here when analytics land. And a stale bullet in `legal-and-policy.md` ("not making listings public to non-account-holders") was corrected — untrue since the 9 June D1 decision; the accurate line is now **listings are public, member names are not**, which both Terms and Privacy also say on the page.

**A real bug caught on the way across: the invite sign-up had no captcha.** Supabase gates sign-up at the project level, so `signUp` without a Turnstile token is rejected before an account is created. The editorial `JoinForm` never rendered the widget — every invitee reaching that screen would have been told their sign-up failed, with no way to pass. Nobody has hit it because `/join` has no in-product entry point, which is luck, not design. `ClJoinForm` has the widget.

**"I have an invite →" still does not go back as a button** — and the reason is not the dead-link rule any more. `/invite` is where a member SENDS an invitation; a Tier-1 account pressing that CTA would be bounced to their profile. The gate now says "Have an invitation? Open the link in that email". Making it a link again means building a tokenless lookup screen — George's call.

**Verified:** build clean; `audit:rls` 59/59 with prod state identical before and after; `audit:gates` 30/30 including the new name-leak assertions and a positive control (a signed-in member still sees "Lila" on her profile); guest walk checked in the rendered HTML, not just on screen; 390px and desktop; screenshots 25–40 in `design-foundation-project/outputs/classifieds-migration-screens/`.

**Next:** Slice 3b — `/admin` ×4 — then `app/design/` and the `(ed)` group retire together. **Slices 1, 2 and 3a merge to `main` together.**

---

## 2026-08-26 · Classifieds Slice 2 — the member-only screens migrate, and are verified for the first time (Claude Code)

**Slice 0 is cleared. The Turnstile widget renders on localhost.** The Cloudflare hostname allowlist that blocked Slice 1 entirely (error 110200, no challenge rendered at all, retested 20 Jul and 18 Aug) has been fixed. The widget now loads, challenges, and verifies on `http://localhost:3000`. That single change is what made this slice's verification possible — and it is the reason Slice 1's signed-in states shipped unlooked-at while this slice's did not.

**Step 1 — the Slice 1 seam is closed.** `ClGate`, the members-only wall a guest meets on a seventh listing, linked to `/login` and `/apply`; both were editorial, so the highest-traffic conversion moment on the logged-out path left the design system mid-journey. Screen 09 was promoted to cover `/login`, `/signup` and `/apply` as one state-aware component (`ClAccess`). **`/signup` could not be promoted as drawn** — the design's guest card links to `/signup`, so rendering the unchanged screen there would have pointed that link at the page it was on. The right-hand card carries a real create-account form (`ClSignUp`) instead, and the three numbered steps beside it stay put. Verified: the guest wall now offers `/login` and `/apply` inside the system, and leaks no field of the listing behind it.

**Step 2 — post and settings promoted, with one thing deliberately NOT dropped.** `/listings/new` and `/profile` moved. Screen 10 has no profile photo; shipping it as drawn would have removed a working feature (`0023`, `AvatarUpload`) and reversed the 2026-06-08 decision without anyone deciding to. The row is back, restyled (`ClAvatarUpload`). `/profile` and `/profile/edit` collapsed to one screen — the rows now carry their own write paths (`ClProfileForm`) and `/profile/edit` is a redirect, kept so old email links still land.

**The bug that pattern invites, avoided on purpose.** `updateProfile` writes all five account columns from whatever FormData it gets and treats an absent field as null. A form that mounted only the row being edited would blank the other four on every save. Every field is mounted the whole time and hidden with CSS — the same rule `ClPostForm` already follows, for a sharper reason here.

**Step 3 — three screens designed rather than ported.** No Classifieds screen existed for my listings, edit, or contact.
- **`/listings/mine`** keeps the structure that fixed a specific July audit failure: active listings are cards, archived listings are compact hairline rows under their own heading. The audit graded the page C+ because an archived test listing rendered at full card weight and out-shouted the live ones — the fix was structural, and it survives the change of design system. `ClListingRow` was *not* reused: it was built for search results, leads with a thumbnail, and links unconditionally. `ClArchivedRow` is a small sibling with no image and no link.
- **`/listings/[id]/edit`** reuses `ClPostForm` with `initial`, **minus the three-step pills**. The steps exist to stop a blank form feeling like a wall; an edit form is not blank. Because the form already mounts every field and only toggles visibility, this is a presentation flag, not a second code path. The take-down control (`ClRemoveListing`) is new, takes the `--cl-red` accent, confirms, and says what archiving actually does.
- **`/listings/[id]/contact`** is a real page as well as a modal. Both render one shared `ClContactBody`, so the two frames cannot drift apart. **The Tier-1 gate copy was being paraphrased in the modal and is now verbatim from `voice-and-copy.md` again.**

**Two real bugs found and fixed on the way.** (1) `ClPostForm` capped title at 140 characters and description at 4000, while `create.ts`/`update.ts` cap them at 80 and 2000 — so the form let people type past the server limit and only told them on submit. (2) More serious: `updateListing` rebuilds the `details` JSON **wholesale** from what is posted, and the post form only ever rendered two of the six detail fields the actions read. Editing a furniture listing through it would have **silently deleted its condition, dimensions and brand**. All six fields now render.

**The Slice 1 rule, obeyed.** `/listings/mine` needed a narrowing no shared helper covered — own rows at any status, via `listings_read_own` (0016). It was added to `lib/cl/listings-read.ts` as `readOwnListings()` rather than inlined on the page.

**A new audit, because the old one provably cannot catch this class of bug.** `npm run audit:gates` (`scripts/audit-gates.ts`) asserts 21 route gates over HTTP as guest / Tier 1 / member, creates and tears down its own fixtures, and checks the one that matters most: someone else's unpublished listing id and an id that never existed must stay indistinguishable, and neither may leak a field. It exists because Slice 1's trust hole passed `audit:rls` 59/59 on both sides of itself. **A worked lesson while writing it:** the first run reported 8 failures, all false. Next 16 does not always answer `redirect()`/`notFound()` with an HTTP status — a dynamic Server Component that has begun streaming encodes the outcome in the RSC payload and the document is 200. The gates were fine; the assertions were reading the wrong channel. Recorded in the script, because that is the worst error a trust check can make: it trains you to ignore its output.

**Verified — and this is the part that had never happened.** Build clean. `audit:rls` 59/59, zero unexpected ALLOWs, seed members intact (4), published listings back to 20, founder row byte-identical. `audit:gates` 21/21. **Signed in as a member, every screen in this slice rendered and looked at**, with listings in all four statuses; signed in as Tier 1, all four walls confirmed (cannot post, cannot reach my listings, cannot edit, sees the interaction gate with its real copy and no compose box); guest walk confirmed in-system. 34 screens captured at 390px and desktop into `outputs/classifieds-migration-screens/` (08–24), continuing Slice 1's numbering.

**Three things the screenshots caught that code review had not:** two identical "Post a listing" pills stacked inches apart on my listings (the header already carries one), a Save pill offering to save your own listing, and "Archived" printed on every row under a heading that already said Archived. All three fixed and re-shot. This is the argument for the verification order — none of them are visible in a diff.

**Prod data:** fixtures were created and deleted under their own `+slice2` sub-prefix, never the bare `george.gardner480+` one (which covers the seed members who own most of the marketplace). Post-run state asserted identical to pre-run.

**Not done, deliberately:** nothing merged to `main`. Slices 1 and 2 merge together, so a member never sees the seam between two design systems.

---

## 2026-08-18 · Classifieds Slice 1 shipped to a branch — the public face is now the Classifieds system (Claude Code)

**The four blocking decisions, settled.** Landing bylines stay anonymous ("Vouched by a member") — George's call, explicitly held rather than settled, so browse still names everyone to the same logged-out visitor and the tension is now recorded in the code rather than in a doc. Wordmark stays Instrument Serif against Newsreader body, after looking at the two together on a real screen. Saved and Search ship, and `mvp-spec.md` was updated to move both into v1 rather than leaving the spec contradicting the product. Migration 0026 — George chose to apply it, against the recommendation; it is written and verified but NOT run, because migrations go through him in the SQL editor.

**Slice 0 is blocked, and not by the key.** The prompt assumed the fix was pasting the real Turnstile site key into `.env.local`. Tried it: Cloudflare returns **error 110200 — domain not allowed**, and no challenge renders at all. This is the same wall recorded in the file's own comment on 20 July. The real key is now in place, so the moment `localhost` is added to that widget's allowed hostnames in the Cloudflare dashboard it starts working with no further edit. **That dashboard change is George's to make.** Consequence: the signed-in Tier 1 and member screens still have not been rendered by anyone locally.

**Slice 1 built and pushed to `design/classifieds-live`.** Route groups `app/(cl)` and `app/(ed)` split the two design systems by layout while every URL stays exactly where it was — `/`, `/listings`, `/listings/[id]` and the member-only routes under `/listings` now resolve across two groups without a single redirect. Both are nested layouts under one root, so crossing between systems stays a client navigation. Fonts moved to `app/fonts.ts`; the editorial typography that used to hang off `<body>` moved into a new `.ed-root` scope mirroring `.cl-root`. 85 files, every move recorded as a rename.

**A real trust hole found during verification, and fixed.** `/members/[id]` ran its own listings query and never applied the six-row teaser cap. The cap is an application rule, not an RLS one — migration 0010 permits anonymous reads of published rows — so a logged-out visitor was being shown up to 24 of a member's listings, including ones whose own detail page answers with the members-only wall. It was harmless while the page was a noindex preview; promoting it would have made it a public, crawlable way around the trust gate. Now routed through a new `readMemberListings()` that narrows the permitted set for a guest instead of querying around it. **This is the argument for the verification list being ordered the way it is: the RLS audit passed 59/59 before and after, because the hole was above the database, not in it.**

**Verified:** build clean; RLS audit 59/59 with zero unexpected ALLOWs against prod (seed members intact, all 20 published listings intact, founder row byte-identical); guest walk shows exactly six listings and the wall on a seventh; every migrated screen captured at 390px and desktop into `outputs/classifieds-migration-screens/`. **Not verified:** the signed-in UI states, per Slice 0 above.

**Also done:** `main` pushed — it had been two commits ahead on this laptop with production running 22 July code. Uncommitted docs were committed *before* any git operation this time, and a stale `.git/index.lock` was moved aside rather than deleted.

---

## 2026-08-18 · Design direction reversed — Classifieds becomes the site; migration plan delivered (Cowork)

**George's call, mid-session: "This is the design direction now."** The Classifieds system stops being a preview. This reverses the strategic read logged this morning — that its highest value was as input to a designer's brief rather than the thing to ship — and in practice supersedes the 13 Aug freeze. He was told the preview is itself Claude-generated and chose it anyway. The designer shortlist stays on file; whether a studio is engaged, and for what, is now open.

**The correction that changed the session.** George asked to commit and push so the website would update. It would not have. Diffed against `main`, the preview branch touches five files outside `app/design/`: `NavGate.tsx` (two lines), `Wordmark.tsx` (an optional prop, every existing caller identical), `package.json`, a test script, and unapplied migration 0026. **No live page file is touched.** Merging puts the preview on the real domain at `/design` and changes nothing a visitor sees. Said so rather than running the merge.

**Also established: the design file is exhausted.** All twelve Classifieds screens plus Landing v3 are accounted for — eleven built, 07 Messages deliberately not. "More screens" now means designing rather than porting; about fourteen live routes have no Classifieds treatment (my listings, edit, contact, admin ×4, invite/join, sponsor request, resets, thank-you, terms, privacy).

**Delivered: `WORK AREAS/Product/design-foundation-project/outputs/Manhattanite_Classifieds-Migration_Claude-Code-Prompt_v1.md`.** Three slices, Slice 1 specified in full: Next route groups so the two design systems coexist by layout instead of URL prefix, fonts and `classifieds.css` promoted out of the preview layout, components moved to `app/components/cl/`, landing + browse + detail + member profile repointed, every `/design/*` link rewritten, rollback by revert on a branch, and a verification list that puts the 59-cell RLS audit ahead of the visual check. Slice 0 fixes the `.env.local` Turnstile key first, because it is the reason three member screens have never been rendered by anyone.

**Four decisions block Slice 1,** all with recommendations in the prompt: the landing anonymises bylines while browse names everyone to the same logged-out visitor, and the landing becomes the indexed `/`; Instrument Serif wordmark against Newsreader body; whether Saved and Search ship, which is an `mvp-spec.md` scope change since both are out of v1; migration 0026, recommended to stay unapplied since nothing calls it.

**Housekeeping:** `main` is still two commits ahead of `origin/main` (`dbfeaf7`, `06d7b60`) and unpushed — production has run 22 July code for a month. Cowork cannot push (no network on the device bridge, and git index writes leave stale `.git/index.lock` files on the mount — one was cleared into `_to_delete/` this session). Docs from this session are uncommitted and need a commit from Claude Code or George.

---

## 2026-08-18 · Classifieds design system imported and built on real data (Claude Code)

**What happened:** the Claude Design project ("Manhattanite Classifieds.dc.html" + "Manhattanite Landing v3.dc.html") was imported and built as a working preview at **`/design`**, against the real listings table — real rows, real photographs, real bylines. **Eleven of the twelve screens plus the landing.** Only 07 Messages is unbuilt, and it stays unbuilt because in-app messaging doesn't exist and is out of v1; drawing it would mean inventing a threads table to illustrate a picture.

**Nothing on manhattanite.com changed, deliberately.** It all sits on the branch `design/classifieds-preview`, scoped to `/design/*`, noindex, and reverts with `rm -rf app/design` plus two lines in `NavGate.tsx`. Verified against the live site: `/design` returns 404 there, `/` is untouched. Vercel preview is green (behind Vercel SSO, so it needs George's login).

**The strategic read, which is the part worth keeping.** Having built both systems side by side: **the Classifieds direction is better for the PRODUCT screens and weaker for the MARKETING surface.** More legible, denser, easier to scan — browse, detail and post genuinely work better in it. But it is also more conventional (rounded pills, sans-serif, card grid) where the live editorial system (dark hero, Instrument Serif, hairlines, square corners) is far more distinctive and much closer to the Soho House register. That maps almost exactly onto the July **dark outside / light inside** decision: Classifieds is a strong candidate for *inside*, a weak one for *outside*. **Its highest value is as input to the designer's brief — the product shown on real data — not as the thing to ship.** This matters because the design freeze (13 Aug, "too AI") is still in force and this is itself a Claude-generated design.

**George's one design direction during the build:** on the landing, **sign-in becomes the primary action and opens a real working form in place** (no navigation, no modal), with **request access demoted to a small band at the foot of the page**. Flagged and accepted: most landing traffic has never been here, so above the fold they now meet only a members' door — the intended reading of "members only", but not the higher-converting arrangement.

**The rule that governed every judgement call: no dead controls.** Where the design drew something the product can't do, it was cut with a reason rather than faked — nine categories became the four that exist, "Closest" sort and "Save this search" were dropped, the weekly-digest and hide-my-name toggles were left out (no columns behind them, and hiding your name would contradict the trust mechanic outright), and the member profile shows only facts already public on every listing card.

**Two things now need George, neither of them code.** (1) `supabase/migrations/0026_member_profile.sql` is **written, not applied, and nothing calls it** — it is the concrete form of "what does knowing a member's name buy you", as a narrow SECURITY DEFINER function rather than a SELECT policy (a policy would make every future column on `accounts` public by default). (2) **The landing anonymises bylines while browse names everyone** — the same logged-out visitor, the same six listings. One of the two is wrong about how public a member's name is, and the landing is the page that gets indexed.

**Verification gap, recorded so it isn't retried:** `.env.local` carries Cloudflare's always-passes TEST Turnstile key, so every local sign-in dies at the captcha before a password is checked. The post form, the settings rows and the forgot-password reveal have **never been rendered** — their gates are verified, their appearance is not. Hand-forging a session cookie was started and deliberately abandoned (version-fragile; a subtly-wrong session renders something *misleading*, which is worse than an honest gap). Claude cannot close this: previews sit behind Vercel SSO, and seeing those screens needs a member password it must not handle.

**Also:** local `main` has two August commits (`dbfeaf7`, `06d7b60` — the Week 12 RLS audit and strategy docs) that were **never pushed**; production has been on 22 July code. Both touch only docs and scripts, so the live site is functionally current — but a month of documentation and the audit work exist only on the laptop.

**Next:** George to eyeball the preview signed in (`/design/post`, `/design/settings`, and the forgot-password reveal on `/design/landing`); decide on migration 0026; settle the naming inconsistency; decide whether to merge to `main` (puts `/design` on the real domain, changes nothing live, gives a URL to send a designer) and push `main` for backup.

---

## 2026-08-17 · Design-first sequencing chosen; designer shortlist delivered

**George's call: get the branding and look right before any outreach at scale.** This confirms and sharpens the 2026-08-13 §6 decision (design reads "too AI", open design calls frozen, engage a professional). Cowork's honest push-back, accepted as framing: the blocker is now a *person*, not a decision, so the calendar is longer than it feels — conversations this week puts a redesigned site at mid-to-late October and outreach at scale in November rather than September.

**Two carve-outs agreed so the design freeze doesn't stop everything:**
1. **The five friend interviews are an input to the design brief, not a competing task.** A designer's first question is "who is this for?", and the audience question (§2, plutocratic consumer vs young professional) is still open. Interviews are coffees; they don't need a finished site. Doing them before briefing anyone protects the design spend.
2. **Three of the five offerings don't need a finished site:** George's own music listing (no ask), Cole (a marketing professional weighing up the work — showing her the rough version *is* the job), and Cody the dog walker. What genuinely waits is the one-shot stuff: aspirational names, friend-of-friend intros, the invitation sent at scale.

**Delivered: `design-foundation-project/outputs/Manhattanite_Designer-Shortlist_v1.md`.** Headline recommendation — **buy identity + art direction + three key screens as Figma files; do NOT buy implementation.** That split is roughly the difference between a $30k engagement and an $8–15k one, because the build is the expensive half of a studio website quote and the repo already has implementation capability. Shortlist (all verified against the studios' own sites on 17 Aug): **Practical People** (East Village, hospitality/boutique-hotel specialists, closest on subject matter, but light on digital product), **RoAndCo** (NY+LA, identity *and* web under one roof, editorial register, strongest all-round fit), **Rudy** (Brooklyn, Michael Freimuth post-Franklyn, small and hands-on, does digital product, offers fractional creative direction on retainer — an interesting alternative shape), **Order** (Brooklyn/Miami, the benchmark, likely out of budget), **Gretel** (Brooklyn, cultural/institutional brands). Note: **Franklyn has wound down** after 14 years; Freimuth's Rudy is the successor to look at. Doc also covers where to find the independent tier (Are.na, Instagram-followed-backwards, studio alumni, Cole) and why *not* Upwork/Toptal/Fiverr, plus five first-call questions and the send-only-three-things rule.

**Also discussed and parked: member perks as the opening proposition** ("special opportunities to Manhattanites from Manhattanites"). Cowork's reframe, not yet a logged decision: lead with **access and judgment, not discounts** — the vouched "my guy" directory, pass-alongs (tickets, reservations), first-look on listings, twenty minutes of a member's expertise, spare capacity, member-taught things. Acquisition mechanic proposed: a **second ritual** alongside the 3-names question at approval — "what's one thing you'd extend to other members?" Business-side perks should start with **members who own businesses** (warm ask) and use an ask-ladder of recognition → access → experience → price, with price last. Two cautions logged: don't let perks become the reason people join (wrong composition), and attribution ("vouched by X") never endorsement. This upgrades pillar 1 of the coaching framing; still needs the §3 reconciliation before any build. George opted to prioritise design first, so this stays a thread.

**RoAndCo repriced same day.** Their about page carries a client list the homepage doesn't show (Gucci, Kate Spade, Altuzarra, NARS, Bobbi Brown, Clinique, Google, Amazon Fashion, Vogue, i-D). That's a luxury fashion/beauty studio; estimate revised to a **$50k floor, $75–150k full scope, $35–75k even stripped back**. Moved from "strongest all-round fit" to "best taste, wrong price". Standing move for RoAndCo and Order both: email anyway, but ask *"I suspect we're below your minimum — if so, who would you send me to?"* The referral is the point, not the quote.

**Independent-designer search delivered: `design-foundation-project/outputs/Manhattanite_Independent-Designers_v1.md`.** Nine verified names (top five: **James Anderson**, **Triboro**, **Javas Lehn Studio**, **Elana Schlenker**, **Anna Polonsky**), the credit-mining sourcing method, three dead platforms, and engagement terms. Two things worth carrying forward beyond the names: **almost no independent designers keep East Village studios** (the right filter is whose *work* is downtown, not whose desk is), and **open with paid discovery — 5–10% of project value, credited against the full engagement — never a free pitch round.** Full detail in the design-foundation project memory.

**Next:** text Cole for designer names (still unsent); browser-check jamesanderson.studio + Polonsky & Friends (both blocked automated fetch); email Triboro / Javas Lehn / Elana Schlenker with the four-item scope and the paid-discovery opening (18th); free post on The Brand Identity jobs board; Newport 19–24; **CreativeMornings NYC Fri 28 Aug 8:30am at MAD**; audience decision + one-page brief + paid discovery commissioned with the top two, week of the 25th.

---

## 2026-08-13 · Week 12 hardening EXECUTED — RLS audit green, observability gaps found

**The must-hit is DONE in one session, and it passed.** Ran a behavioral RLS/trust-gate audit against prod (new harness `scripts/audit-rls.ts`, 59 cells) attacking the **API not the UI** — every table across anon / Tier-1 / member, incl. all three privilege-escalation columns, cross-member tamper, storage, and the moderation wall. **59/59 matched expectation, zero unexpected ALLOWs.** The trust layer is launch-ready. Full matrix: `mvp-build-project/outputs/Manhattanite_RLS-Audit_v2.md`. **Friday is genuinely overflow.**

**Two landmines found and handled mid-run:**
1. **`george.gardner480+` is NOT safe to bulk-purge** — 4 permanent seed members (Anna/Max/Lila/Sam) live under it and own 10 of 20 published listings. The brief's "delete synthetic accounts" against the bare prefix would have wiped half the live catalog. Harness uses a unique `+rlsaudit` sub-prefix and asserts seed-member + published-listing counts unchanged. **Rule for all future prod harnesses: own sub-prefix, never the bare one.**
2. **`signInWithPassword` is now Cloudflare-Turnstile-gated at the Auth API** (spam protection turned on since June). Every June harness (multi-sponsor, edit-archive, admin-console, listing-moderation) will now fail at sign-in. Fix: mint sessions via `admin.generateLink` → `verifyOtp` (no captcha, real authenticated JWT). The audit harness uses this; the others need the same one-line change.

**Part 2 — the real output beyond RLS (two launch-relevant gaps):**
- **Sentry is not wired at all** (no SDK, no script, no events) → no server-error observability in prod. Not verifiable as the brief assumed; it isn't installed. Decision needed: ship pre-launch?
- **Plausible / any analytics is not deployed** (no script on any route) → no product analytics. Bonus: `/privacy` copy claims "privacy-respecting analytics" that don't exist — soften or ship.
- **Resend:** DNS auth is healthy (DKIM present, `send.` delegated to SES, DMARC `p=reject` with relaxed alignment → Resend's DKIM aligns and passes). Code path intact (`sendListingContact`: Reply-To=sender, neighborhood renders). The one open item = the live inbox-vs-spam eyeball, which needs a logged-in prod member session (Turnstile-blocked for automation) — a 2-min manual check for George.
- **Extras:** favicon renders on prod (closes the 21-Jul Phase-4A eyeball); no console errors on landing + browse.

**Cleanup verified:** 0 synthetic rows, seed members intact (4/4), published listings intact (20/20), founder row byte-identical (`is_member=true`, `sponsor_id` null, `role=admin`). Code + docs committed.

---

## 2026-08-13 · Strategy session — mind dump organized; Week 12 hardening runbook delivered; Laermer corrected

**George's mind dump + Cole's voice notes + coaching output organized into `Growth/founding-member-acquisition-project/outputs/Manhattanite_Strategy-Session_2026-08-13.md`.** Logged as effectively decided: sublets are not the entry wedge (saturated); grassroots seeding per Cole (friends listing as a favor; invitation language first; taste/POV is the product); GdC-strictness doubled down as an advertised feature; design verdict "too AI" → professional designer to be engaged (serif/accent decisions FROZEN; the Aug-1 paperwork package becomes the designer brief); George wants a professional strategic partnership with Cole (pilot-scope proposal shape logged). Open threads: the audience question (plutocratic consumer vs young professional — resolve via 5 friend interviews + offering-reaction data, post-Newport) and whether the coaching three-pillar framing (locals-only discounts / community services / trusted buy-sell) is positioning or a category-roadmap change (flagged as mvp-spec scope shift; listing types already technically support services since 0019). Growth math logged: 20 seed members at r≈0.5/month referral conversion reaches the 50–100 year-end target; the 3-names ritual is the engine.

**Week 12 status: behind — no commits since Jul 22; the hardening must-hit hadn't started as of this morning.** Cowork delivered a ready-to-run session prompt: `mvp-build-project/outputs/Manhattanite_Week-12-Hardening_Claude-Code-Prompt_v1.md` (full RLS attack matrix across anon/Tier-1/member incl. privilege-escalation attempts, storage checks, moderation wall; then Sentry/Plausible/Resend deliverability incl. the never-verified real contact email). Today is the anchor day; weekend make-up rule if it slips (Newport eats Week 13).

**Corrections + housekeeping:** the Laermer meeting never happened — postponed indefinitely (the Aug-1 note assuming it took place was wrong; tracker parked, still flagged important). Angie's List task closed as superseded by the audience/pillar thread. Docs commit executed by Cowork (the ~20-file uncommitted pile — the July doc-wipe condition — cleared).

---

## 2026-08-10 · Call prep for Cole Spike (potential marketing hire)

**George has a phone call with Cole Spike** — marketing, part of John Doe & Co, has worked with Zero Bond among others; a candidate for Manhattanite's marketing. Cowork produced a one-page discussion-points doc: `WORK AREAS/Growth/founding-member-acquisition-project/outputs/Manhattanite_Call-Prep_Cole-Spike_v1.md`. Five areas: chicken-and-egg cold start (present the seed plan, ask her to attack it), differentiation from Listings Project / Girls Who Sublet NYC / Ohana (they curate listings, nobody curates the people on both sides), whether to lead with sublets or furniture, **George's new open question: is 25–40 the right target, or should it skew to older wealthy New Yorkers for whom trust is a dealbreaker** (GdC's French base is families; worth a strategy revisit after the call), and a script for asking her fee structure professionally (ask engagement structure first, stage-honesty second, advisory-hours fallback). Also flagged: the call doubles as a fit test — no-ads posture and first-90-days deliverables are the tells.

---

## 2026-08-01 · Part-time income direction chosen — music teaching project created

**George chose a part-time income direction alongside Manhattanite: teaching music and creativity to children** (1:1 bass/guitar lessons + small-group songwriting labs), landed on after an ideation session that started from skills-for-hire options. Target $2,500–4,000/month at ramp; teaching hours (weekday 3:30–7pm, weekends) deliberately sit outside the Manhattanite 9–4 block.

**New work area and project created: `WORK AREAS/Income/music-teaching-project/`** (brief, memory, outputs). Deliverables drafted to outputs/: listserv blurb (2 versions), one-page site copy, and an agency shortlist with week-one actions (references, apply to Hey Joe Guitar + Musication, post blurb in own circles, build the one-pager site). Parent-facing copy uses American spelling, same call as Manhattanite copy.

---

## 2026-07-22 · Mobile polish pushed and verified on prod

**The two mobile-polish commits Cowork made earlier today (2b169b4 + 1d10c1a) are pushed and live on manhattanite.com.** Cowork's sandbox couldn't push and left stale git lock files behind; those were cleaned up (renamed `*.lock.stale.*` / `stale-index.lock.*` files, ~170 leftover `tmp_obj_*` temp files in `.git/objects/`, and a 28MB temp tarball in `.next/`) before pushing. Push accepted cleanly, no force, history untouched.

**Verified on production at 390px:** the membership headline "A marketplace that knows who it's dealing with." renders; the footer's BROWSE / MEMBERSHIP / INFO columns share one row (wordmark block spanning above); forward links ("Browse the network") render underlined with no "→" glyph, and no "→" appears in any link on the landing page.

---

## 2026-07-22 · Mobile polish — arrows retired, membership copy, form + footer

**Four small phone-view fixes from George's screenshot review, applied and live in the repo (not yet committed to git).** (1) The "→" glyph is retired from forward links sitewide: ArrowLink now renders a plain 14px link with a persistent hairline underline (45–50% strength at rest, full color on hover) — chosen from three live mockup options (small-caps, underline-only, caps-color); George picked underline-only. Back links keep "←" (direction, not decoration). The four hand-rolled "&rarr;" labels on the join/sponsor-request token pages lost their arrows too. (2) Membership headline is now "A marketplace that knows who it's dealing with." (utility-first framing, per strategy) replacing "Manhattan already trusts Manhattan. We just wrote it down." (3) The landing email form: field is now required + autoComplete/inputMode email, focus border works on tap (focus, not focus-visible), and the Apply button goes full-width when the row stacks under 520px. Confirmed behavior: the address submits as a GET to /signup and prefills the signup form. (4) The mobile footer's three link columns now sit side by side in one row (wordmark block spans above them) instead of stacking — the footer was a full screen of scroll on a phone.

**Verified:** `tsc --noEmit` and `eslint` clean on all five touched files. Pending George: real-device look at the new footer row and underlined links, then git commit + deploy.

---

## 2026-07-21 · Mobile pass — the emulated half, audited and fixed

**Every reachable route swept at iPhone dimensions (390×844 DPR 3, spot-checked at 375×667) and the iOS trap list fixed within the existing system.** The big four: inputs now hit iOS's 16px threshold on phones so focusing a field no longer zooms the whole page; the landing hero measures itself in `svh` so it fills the visible screen instead of jumping with Safari's toolbar; the page opts into `viewport-fit=cover` with safe-area padding on the gutter, hero chrome and footer, so nothing sits under the notch or home indicator; and every small text link grew an invisible 44px tap target (coarse pointers only — desktop is untouched). Also: the three hand-written hover rules are now gated to hover-capable devices (no more stuck underlines after a tap — Tailwind's own hover utilities were already gated), and the browse category row scrolls the active chip into view on load (on "Everything else" it used to load fully offscreen).

**Verified:** zero horizontal overflow on every route at both sizes, desktop regression-checked (hero, nav hover fill, browse rail unchanged), `npm run build` clean. The mobile "after" screenshot set is committed at `WORK AREAS/Product/design-foundation-project/outputs/mobile-pass-screens-2026-07/`.

**Still George's half:** the real-device walk — toolbar-collapse feel, notch/landscape behavior, actual tap feel, and the logged-in screens (local auth is still blocked at Cloudflare, so post form / profile / mine / admin were audited at code level only). Flagged, not fixed: the hero photo is soft at DPR 3 (known `TODO(phase-4)`), and listing photos download full-size originals on mobile (no `srcset` — a later image-transform slice).

---

## 2026-07-21 · Phase 5 — transactional emails restyled to the v12 design

**Every send in `lib/applications/emails.ts` rebuilt on one shared email-safe layout** (table-based, inline styles, Georgia headlines + wordmark, Arial body, 600px bone card, hairlines, boxed CTA) per the approved v12 mockup. The three contract emails carry the mockup copy verbatim; the reviewer ping keeps its action block untouched inside the new bones; invite/sponsorship/moderation sends moved onto the same layout with copy unchanged. Plain-text alternative added to every send.

**Reply-To on the contact forward was already set** to the sender's address — confirmed, no fix needed. Contact forward gained the sender's neighborhood (one extra column on the existing read-own select). Interpolated user data is now HTML-escaped.

**Verified:** rendered locally and checked at 700px and 360px in the browser; `npx tsc --noEmit` and `npm run build` clean; one test of each sent to info@manhattanite.com only. Send triggers, recipients, and best-effort error handling untouched. Pending: George's Gmail check (desktop + phone).

**Amendment shipped same session:** wordmark replaced with a retina PNG of the true Instrument Serif mark (same next/og pipeline as the OG card, `/email/wordmark.png`); headlines + quotes now prefer Instrument Serif via `@font-face` woff2 with Georgia fallback (Apple Mail true serif, Gmail Georgia). Assets verified live on prod before the three tests were re-sent to info@.


---

## 2026-07-20 · Slice 3 SHIPPED — Phase 3 of the design plan is complete

**Six commits plus four prod-pass fixes, all live.** Every product screen now sits on the same system: post a listing, edit listing, profile, edit profile, my listings, and all four admin pages.

**The two pages the audit graded C+ were fixed structurally, not cosmetically.** On `/listings/mine` the archived QA test listing had been out-shouting the live ones; muting it wasn't enough, because it was still the same object at the same size. Archived listings are now compact hairline rows under their own heading — no image, no card — so one can't outweigh a live listing again. `/profile` moved out of its centered stack into the editorial grid, with sponsorship as a small-caps credential line rather than its own section.

**Forms** got boxed fields and boxed submits throughout. The photo and avatar uploaders took a *dashed* hairline — solid means "a control you act on", dashed means "a space something goes into" — because as solid boxes they were competing with the actual submit button. The listing submit now reads "Submit for review", which is what it does under pre-moderation, with the moderation notice moved to sit with it.

**Stage 0 (local auth) was attempted and is BLOCKED at Cloudflare.** The real public site key was found and installed, and Cloudflare rejected the `localhost` hostname outright — the widget offers no challenge at all. Reverted to the test key. To finish, George needs to add `localhost` to that widget's allowed hostnames in the Cloudflare dashboard; until then every gated screen must be verified on prod.

**Worth keeping:** four defects appeared only on the prod pass, not in the build — including a radio row that pushed "Service" outside the content column on a phone, where it couldn't be tapped at all. A clean `npm run build` says nothing about layout.

**No data behavior changed.** Two selects gained columns already on the row under the same policy (`created_at`, `details`); everything else is styling and copy.

---

## 2026-07-20 · Slice 2 SHIPPED — detail page editorial, auth crosses to the dark side

**Built by Claude Code, verified live.** Listing detail + contact now use the editorial grid (rail + back link, EXAMPLE kicker, serif title with price opposite, wide lead photo, hairline metadata table, boxed primary action). Login / signup / resets / apply share a new `AuthShell` on park-dark with boxed `.mh-input` fields, dark Turnstile, and submits that read as pressable. Signup prefills from the landing's email form. Footer email corrected to info@.

**Verification:** everything logged-out verified by Claude Code on prod (desktop + 390px); the four member-only paths verified by Cowork through George's signed-in Chrome — message button + modal, Edit on an owned listing, /apply's member redirect. Only the dark /apply *form* remains unseen (needs a Tier-1 session; none exists).

**Findings:** (1) localhost auth broken since 30 June — test Turnstile key in `.env.local` vs real secret in Supabase; fix task queued. (2) Local dev uses the PRODUCTION database — separate dev DB logged as backlog before real members arrive. (3) Serif numeral-1 quirk now visible on profile ("June l, 2026") — evidence for the Phase 2 serif call.

**Next: Slice 3** — forms (post/edit), profile, /listings/mine (archived weight fix), admin tidy, smart-quotes sweep. Then Phase 4 brand lock.

---

## 2026-07-20 · Slices 1 + 1.1 SHIPPED — the ICW redesign is live on prod

**Slice 1 (Claude Code, commits b998215/10412d7/8a5bda3):** foundation utilities + `BoxButton`/`ArrowLink` + `ListingCard` + tier-aware `SiteFooter`; dark park landing at `/` (full-bleed hero, statement, membership block); light bone browse at `/listings`. EXAMPLE tags preserved, gating untouched, verified on prod.

**George's review produced Slice 1.1 (commits c544566/409efb2):** (1) nav-disappears bug — the x-pathname header hiding didn't survive client-side navigation; fixed with a `NavGate` client wrapper on `usePathname()`; (2) browse title → "Today's listings."; (3) categories moved to a **sticky left rail** (ICW All Products pattern, George's reference), mobile keeps the horizontal row. All verified on prod including the landing→browse→detail click path.

**Open:** George's 30-second logged-in check (`/` redirect + member browse); hello@ vs info@ footer email; hero photo retina replacement (Phase 4). **Next: Slice 2** (listing detail light + auth/apply dark, prompt already in outputs/).

**Incident:** this file and design-foundation memory.md were found reverted to last-committed git state (uncommitted doc edits wiped between sessions) — restored by Cowork from its copies. New rule: commit doc changes to git at the end of every session.

---

## 2026-07-17 · ICW direction chosen, palette locked (dark outside / light inside), Slice 1 prompt out

**Phase 1 compressed into a day.** George picked **In Common With** (incommonwith.com) off Mobbin as the primary reference ("very similar, our colours and fonts"). Delivered the 12-pattern steal sheet (`Manhattanite_Steal-Sheet_v1.md`) — headline steals: label-left editorial grid as master layout, the dated "Lately" card as the listing card, boxes reserved exclusively for actions (fixes the CTAs-look-disabled audit finding), accent as text colour only.

**Mockup loop, four rounds same day:** v5 (ICW structure, Manhattanite tokens) → George: yes, but category tiles advertise the two-category launch too loudly → v6 (no categories, 2×2 listing grid) → George shared the pitch-deck slide, asked for its palette → v7 (all park-dark) → v8 interactive (dark landing, click through to light browse). **Decision: dark outside, light inside.** Category tiles parked until 4+ categories.

**Slice 1 Claude Code prompt delivered** (`Manhattanite_ICW-Slice-1_Claude-Code-Prompt_v1.md`): tokens + BoxButton/ArrowLink system, dark landing, light browse with new ListingCard. EXAMPLE tag and tier gating explicitly protected. Auth/detail/forms queued as Slices 2–3.

---

## 2026-07-17 · Font fix shipped same day — Instrument Serif live sitewide

**The Phase 0 headline finding is fixed and deployed**, hours after the audit. Claude Code applied the `@theme inline` fix plus a second subtlety the prompt missed: the `body` base rule used a raw `var(--font-sans)`, which goes dead under `@theme inline` (variables get inlined into utilities, not emitted at `:root`) — repointed it to `var(--font-inter)` directly. Only `app/globals.css` changed. Verified on prod: body → Inter, headings → Instrument Serif, ~50 existing `font-serif` usages now render sitewide with zero component changes.

**Beige-block mystery resolved (not a bug):** re-inspected the Yorkville listing on prod post-deploy — the page has exactly one image, it loads fine (1600×2000), and no empty blocks exist in the DOM. The block in the audit screenshot was the image's transient lazy-load placeholder caught mid-scroll. No action; a nicer loading treatment is optional Phase 3 polish.

**New observation for the Phase 2 serif decision:** listing detail body copy also renders in Instrument Serif (the components use `font-serif` on more than display type), and at body sizes its numeral "1" reads like a lowercase "l" ("August l"). Judge the serif on real screens with this in mind.

---

## 2026-07-17 · Design Foundation Phase 0 — baseline audit shipped (headline: fonts never load)

**Phase 0 of the design-foundation project done in one session.** Captured 16 desktop screenshots of prod (browse, detail, contact, post form, mine, profile, profile-edit, admin ×2, auth ×3, terms) via George's Chrome; graded every screen against the brand guide's do/don't table. Output: `Product/design-foundation-project/outputs/Manhattanite_Design-Audit_v1.md` + `outputs/before-screenshots/`.

**Headline finding — a bug, not taste:** Instrument Serif and Inter are loaded by next/font (variables present on `<body>`) but the Tailwind theme never maps them, so **every element on prod renders in the OS system font**. Verified in the live DOM: zero elements use Instrument Serif or Inter. Recommended fixing this (one line-ish in `app/globals.css`) before Phase 1 even starts.

**Grades:** all screens land B−/B; My listings and Profile at C+. No failures — the layout system (paper, hairlines, caps kickers, whitespace) is consistent and the voice is strong. Cross-cutting gaps: no action/button system (primary CTAs look disabled), listing card undesigned (identical treatment for a $4,200 apartment and a side table), empty beige placeholder block on listing detail (possible bug), archived listings shown at full weight, zero accent colour in practice.

**Couldn't capture:** logged-out landing (George signed in; not worth logging him out) and phone widths (extension window-resize didn't take). Both carried forward.

**Next:** the font fix (Claude Code, one session) → then Phase 1 (Mobbin account + steal sheet).

---

## 2026-07-14 · Monetisation scenarios — Radio H-P vs Gens de Confiance

**Strategy discussion, no decision changed.** Researched both comparators' actual revenue models. Radio H-P (~8k members, founder-run): free membership, pay-per-advert on a sliding scale with property at the top — the direct model for a two-person operation. GDC (~2M members, breakeven 2022): everything free except vacation rentals (€119/6mo, extends free if unrented, ~60% of revenue) + real-estate pro packages — needs volume we won't have.

**Three scenarios sketched:** (1) Cohort 3 @ ~500 members, apartments $49 → ~$500–700/mo, signal not income; (2) 2–5k members, sliding scale (apartments $99–149, jobs $75, furniture free + $15 featured) → ~$100k/yr, the realistic ceiling for two people; (3) 10k+ members, GDC-lite apartments-only $149-until-rented → ~$30k/mo, but manual approval/moderation breaks at that scale — forces a hire-or-loosen decision.

**Refinements flagged (pending confirm):** price apartments high ($99–149 — broker-fee pain makes it cheap); keep furniture free forever (browse liquidity); adopt GDC's "extends free until rented" guarantee; continue resisting pro/broker packages. Confirmed pay-per-post decision (2026-05-17) stands, validated by both comparators.

---

## 2026-07-02 · GTM shift — Seed phase activated, Growth work area created

**Strategy call.** George declared the build "mostly done" and shifted focus to member acquisition. Reviewed `gtm-playbook.md` (2026-05-16, never actioned) — the plan already exists; the job now is execution. **Decision: conversations now, legal in parallel** — outreach and list-building start immediately, but no member approvals until entity formation + attorney review of T&P/fair-housing are done (see decisions.md, Go-to-market).

**Created:** `WORK AREAS/Growth/founding-member-acquisition-project/` (brief, memory, outputs/) with:
- `Founding-Members_Plan_v1.md` — two-week action plan: week 1 = 30-name brain-dump, start LLC formation, outreach template, load the 27 seed listings, 3 coffees; week 2 = 10 outreaches + 3 meets; from week 3, a 2-day-a-week routine (Mon = outreach batch, Thu = meets).
- `Founding-Members_List_v1.md` — candidate tracker with Anna/Max/Lila composition scoreboard and a vouched-name bench.

**Revised same session:** George overrode the legal gate — no entity registration until money is about to change hands (triggers: first dollar, ~50+ members, or strangers joining). Approvals unblocked immediately; the surviving guardrail is a fair-housing checklist in the moderation pass for apartment listings. All project files + decisions.md updated to match.

**Open next:** the week-1 actions themselves; confirming the playbook's four open assumptions as they bite.

---

## 2026-06-12 · Invite slice built (cold-start growth engine) + quick wins + GDC logged-in research

**Strategy call — invite-led, not request-led.** George (logged into a live GDC member account) and I decoded GDC's actual mechanism: request sponsorship from people you know → sponsor accepts → moderators validate; 3 sponsors required; a status ladder (Débutante → Confirmée) gated by how many you sponsor, rate-limited by status. George's sharp pushback: a request-a-sponsor flow needs density we don't have (5 members). **Resolution: build invite-led growth** (a member brings someone in, vouching by inviting), floor stays at **1**, the newcomer still needs George's one-tap approval. Request flow / floor>1 / status ladder are explicitly **deferred** to when there's density. Full reasoning: `outputs/Manhattanite_GDC-Mechanics-and-Recommendations_v1.md`.

**Invite slice — built end to end (3 stages), both migrations applied to prod, awaiting one deploy push:**
- **0020:** `invites` table (+ RLS: inviter manages own) and `applications.sponsor_id` (the inviter, carried to approval; null = founder default, unchanged).
- **0021:** `get_invite` (anon read by token), `accept_invite` (invitee links self), `inviter_for_me` (apply reads it to set sponsor_id) — all SECURITY DEFINER.
- **Flow:** member → `/invite` (in the account menu) sends an invite email → invitee clicks `/join/[token]`, sets a password, `accept_invite` links them → `/apply` attaches the inviter as sponsor → admin queue shows **"Invited by [member]"** and approval records the real sponsor (not George). Trust wall intact; friction moved to the inviter.
- tsc + eslint clean throughout. Commits: Stage 1 `e082e95` (committed, **unpushed**); Stages 2+3 staged (sandbox git lock blocked the commit — Claude Code to commit + push).

**Quick wins (shipped earlier same session, commits `670ec8c` + `540c972`, live):** login/signup/root → `/listings`; added **Other** + **Service** listing categories (migration 0019, the type CHECK + form + actions); **avatar-menu nav declutter** (My listings/Profile/Admin/Log out moved under the avatar); and the **hand-drawn NYC skyline** restored to the landing hero (from the parked v4 mockup) — confirmed live.

**Open / next:** push the invite commits (Claude Code) to ship the slice. Then: test the full invite loop on prod; consider an "invites you've sent" view (Stage 4-ish); the request-flow + status-ladder remain parked until density.

---

## 2026-06-12 · Landing image band + full QA walkthrough + Terms/Privacy shipped + John Robinson cleared

**Worked on:**
- **Landing "On the network" band.** Replaced the text-only glimpse with a real image band (GDC-style proof — confirmed GDC leads with real listing cards), moved it directly under the hero, then shrank it on George's feedback to a quiet 672px column of small 4/3 landscape thumbnails with stacked captions. Commits `1045d15` → `da27013`, live. Added migration `0018` (anon read of `listing-images`) so guest covers render; committed it so prod/repo no longer drift. Interleaved the example listings' `created_at` so the teaser leads apartment → furniture mixed (was all-furniture).
- **Full QA walkthrough on prod** (guest via server-fetch + member/admin via browser). Everything loads; the trust gate holds at every layer. Verified the whole **post → in-review → approve → outcome-email → archive** loop end to end (two-step confirms on approve + remove are a nice touch) using a throwaway listing, and the contact form (member → lister, logs `listing_contacts` + Resend). Report: `outputs/Manhattanite_QA-Walkthrough_Report_v1.md`.
- **Fixed the two real findings.** (1) `/terms` + `/privacy` were hard 404s linked in the landing footer → built real plain-English **working-draft** pages grounded in `legal-and-policy.md`, each with a visible "pending counsel review" notice (commit `7d26651`). (2) Cleared the fake **'John Robinson'** sponsor from the 2 founder listings (`update listings set sponsor_names='{}' where 'John Robinson' = any(sponsor_names)`) → they now read "Listed by George Gardner". This closes a thread open since the 0006 byline work.
- **Polish sweep.** Guest listing-detail CTA is now "Sign in to message" → /login (was a "Message the lister" button that bounced guests to a bare login screen); fixed a "Membership is" spacing bug on /terms. Signup copy checked — already consistent ("Create an account" everywhere; "Join the network" is just an on-brand headline), no change.

**Flagged:**
- T&P are working drafts. A NY attorney should review both (Tier-1 legal item), especially the fair-housing listing-standards language, before any non-George apartment listing goes public. Worth adding to the Legal project.
- An archived "QA TEST" listing remains in the founder's My Listings (off the public network; Cowork can't hard-delete — George can drop the row if he wants it gone).
- Contact email **delivery** to seed members unverified (the test message went to seed member Lila, who may have a placeholder email). Confirm a real send before relying on it in a live demo.

**Next:** site is demo-ready — every flow works, legal pages exist, no fake data on bylines. Bigger tracks open: launch-gating legal (entity formation, attorney review of T&P + fair housing) or next features (member invite / add-a-sponsor flow, profile photos, listing search).

---

## 2026-06-12 · Example listings SEEDED — 17 live on prod with photos, Example badge shipped

**Worked on:**
- Seeded prod with the example inventory: 10 apartments + 7 furniture from the two seed docs, all published with photos, via the new idempotent `scripts/seed-example-listings.ts` (`npm run seed:examples`, `--unseed` to reverse). Four example members (Anna, Max, Lila, Sam) created through the real apply → approve path, each sponsored by George — bylines render correctly. George authors 7 of the 17 per the docs.
- George's 20 Unsplash photos were loose on the Desktop (the `seed-images/` folders in the brief didn't exist) — viewed all 20, content-matched them to listings (the 7 furniture shots matched FM1–FM7 exactly), resized to web size into a gitignored `seed-images/`, uploaded to the private bucket.
- Added the "Example" badge to /listings cards + detail pages (`is_example`-driven).
- Verified end to end: 17/17 with images + bylines, founder's 3 real listings byte-identical, idempotent re-run clean, live landing glimpse + teaser badges confirmed post-deploy (commit `c31a6e8`).

**Flagged:**
- Guest /listings teaser and the landing glimpse show no photos by design (image bucket is authenticated-read only; glimpse rows are text-only). Photos appear for signed-in users.
- Landing glimpse rows carry no Example label and are currently 100% examples — worth a copy/design think.
- Seeded "color" over the doc's "colour" (FM2) per American-spelling convention.

**Next:** real-member invitations can now land on a populated network. Possible follow-ups: Example label on the landing glimpse, mixed-type teaser ordering.

---

## 2026-06-11 · Edit & Remove + Admin Console BOTH SHIPPED — 0013–0016 applied by Cowork, all harnesses green

**Worked on:**
- Cowork applied four migrations to prod via the SQL editor (0013 drop sponsor_name, 0014 listings owner-archive + drop member hard-delete, 0015 admin console, 0016 listings_read_own). I ran all three harnesses green — `test:multi-sponsor` 16/16, `test:admin-console` 24/24, `test:edit-archive` 20/20 — then committed both slices + migrations + scripts + docs and pushed to main. Vercel deploying.

**The archive saga, corrected for the record:**
- 0014 closed a real drift: an OPEN member hard-DELETE policy (a member could delete their own listing via the API, wiping moderation history). Now gone.
- My follow-on hypothesis was WRONG: I thought a hidden RESTRICTIVE status-pin policy blocked archive and parked a migration to drop restrictive policies. Cowork's live pg_policy read proved ZERO restrictive policies exist and 0014's WITH CHECK already allowed 'archived'. My parked migration was a no-op — deleted.
- Actual cause: no SELECT policy let a member read their own non-published rows, so the archive read-back returned nothing and looked like a failure. Fix = 0016 `listings_read_own` (own-rows-only SELECT). Lesson: when an RLS read-back fails, suspect a missing SELECT policy before inventing a restrictive WITH CHECK; the authoritative check is a live pg_policy read (Claude Code has no direct-SQL path here — PostgREST keys only).

**Shipped:** Admin Console (dashboard + review queue + member directory; listing-moderation queue is the separate next slice) and Edit & Remove (owner edit + soft-delete archive). Migration backlog now clear (0013–0016 all live).

**Deployed + live-verified.** Pushed 5 commits to main; Vercel deployed. Drove the live site with a synthetic admin + member (cleaned up after, founder untouched): /admin loads for admin with live counts + review queue; non-admin gets a 404 and no Admin nav link; edit + Remove(archive) work end to end (status='archived' in DB, soft delete). Live check caught one bug — the member directory showed "No members yet" because a PostgREST self-join FK embed errored (constraint not named accounts_sponsor_id_fkey); fixed with a second query (commit 849cca5), redeployed, re-verified.

**Next:** listing-moderation-queue follow-up (the 4th admin view).

Full detail in `WORK AREAS/Product/mvp-build-project/memory.md`.

---

## 2026-06-11 · Admin Console slice BUILT — stopped pre-deploy for 0015 SQL run; found a live security gap

**Worked on:**
- Built the Admin Console (George-only): application review queue with Approve/Decline/Request-more-info, stats dashboard, read-only member directory. Route-gated (requireAdmin: non-admin → notFound) + RLS + a new in-function admin guard underneath. Server actions call the rpc as the signed-in admin, never the service role. SiteNav gets an admin-only "Admin" link. Listing-moderation queue deliberately left for the separate follow-up.
- Migration `0015_admin_console.sql` (renumbered from the planned 0014, which is taken by the parked edit-slice migration): adds an admin guard to approve/decline/request_more_info and grants them to authenticated; adds an admin read-all policy on listings; flips the founder to role='admin'. Plus `npm run test:admin-console`.

**Caught — second prod drift in two slices, and this one's a live gap:**
- In prod today, any signed-in user can call the review functions. `decline_application` / `request_more_info` SUCCEED with no guard (a member could sabotage the queue); `approve_application` is stopped only by the column-protection trigger, so membership still can't be granted by a non-admin. Repo says service-role-only; the `revoke from public` never took in prod. Confirmed with a synthetic non-admin (a decline went through).
- Migration 0015 closes it (re-revoke + admin guard). Harness self-detects whether 0015 is live: pre-0015 it's 15 passed / 0 failed / 2 deferred (the security assertions that need the guard), and it documents the gap as a FINDING.
- Founder is still role='account' in prod — 0015 sets it. Flagged so George knows the console matches nobody until the SQL runs.

**Parked SQL-editor queue for George (in order):** 0013 (drop sponsor_name), 0014 (listings owner-archive), 0015 (admin console). Then I re-run both harnesses, push, deploy, re-verify.

**Next:** George runs 0013/0014/0015 → re-run test:admin-console + test:edit-archive (expect green) → commit/push/deploy → listing-moderation-queue slice.

Full detail in `WORK AREAS/Product/mvp-build-project/memory.md`.

---

## 2026-06-11 · Edit & Remove slice BUILT — stopped pre-push: prod RLS drift blocks archive

**Worked on:**
- Built the full listing edit + remove (soft delete) slice: `updateListing` + `archiveListing` server actions, owner-only `/listings/[id]/edit` with pre-filled form (NewListingForm + ImageUpload extended for edit mode), Edit/Remove controls on `/listings/mine` (inline confirm, no browser dialog), "Edit listing" link for the author on the detail page. Typecheck, build, lint, and the write-set grep guard all clean.
- New prod harness `npm run test:edit-archive` (multi-sponsor mold: plus-alias synthetics, founder snapshot, auto-cleanup).

**Caught — the reason nothing shipped:**
- **Prod RLS has drifted from the repo.** The live listings UPDATE policy pins `status='published'` in WITH CHECK, so members cannot archive (probe-verified; field edits pass, status transitions fail). No migration or memory entry records that pin. Worse: the live DELETE policy lets members hard-delete their own listings via the API — against the locked soft-delete-only decision.
- Per the slice guardrails: stopped before commit/push. Drafted migration `0014_listings_owner_archive.sql` (allow owner archive in WITH CHECK; drop the member DELETE policy) for George to review and run in the SQL editor. Harness passes everything that doesn't touch status (15/20; the 5 = archive path + one cosmetic JSONB key-order compare, since fixed).

**Next:** George reviews/applies 0014 → re-run `test:edit-archive` (expect green) → commit, push, deploy, re-verify on prod.

Full detail in `WORK AREAS/Product/mvp-build-project/memory.md`.

---

## 2026-06-10 · Multi-Sponsor slice SHIPPED — many sponsors per member, hybrid-at-2 byline live

**Worked on:**
- Built + shipped the multi-sponsor model: `sponsorships` table (source of truth, RLS locked down), `listings.sponsor_names text[]` denorm cache, shared `lib/listings/byline.ts` renderer (hybrid-at-2), reworked byline/propagation triggers, `add_sponsor()` seed helper, `approve_application()` writes a primary sponsorship row. Three pages moved to the array column (the plan named two; `/listings/mine` was a third, caught by the grep guard).
- Mid-slice, George changed the cutover plan: 0012 was applied to prod in an **additive** form — `sponsor_name` kept and dual-written (= primary) instead of dropped, zero-downtime in either migrate/deploy order. Repo migration updated to match prod.
- Prod test harness (`npm run test:multi-sponsor`): **21/21 green** — 1/2/3-sponsor bylines, primary-first order, rename propagation, sponsor removal, anon read, dual-write invariant, cleanup to 0 synthetic rows, founder untouched (snapshot-verified). Pushed; Vercel deploy succeeded; live render verified on manhattanite.com/listings.

**Caught:**
- First harness run failed one assertion — it wrongly demanded the 'John Robinson' placeholder on every founder listing; the founder's third listing (2026-06-09, post-0006) legitimately has none. Test bug, fixed via before/after snapshot compare.

**Next:** cleanup migration dropping `listings.sponsor_name`; reconcile root `CLAUDE.md` (still describes single-sponsor); min-2 apply flow later.

Full detail in `WORK AREAS/Product/mvp-build-project/memory.md`.

---

## 2026-06-09 · Navigation slice SHIPPED — tier-aware nav + logged-out teaser browse

**Worked on:**
- Built + shipped the navigation spine: a global, tier-aware `SiteNav` (guest / account / member each see only the links they can use), a member-only `/listings/mine`, back links, and removal of the redundant per-page wordmarks on interior pages. Plus the D1 teaser: logged-out visitors browse the 6 most recent published listings (migration 0010 adds an anon read policy) instead of being bounced to `/login`; the action layer stays the wall. Three commits, pushed, deployed.
- Full prod test loop passed across all three tiers (guest teaser + non-teaser→signup redirect; account nav + gates holding on /listings/new and /listings/mine; member nav + /listings/mine populated + back links). Used synthetic accounts; founder left untouched (is_member=true, sponsor_id=null). Prod has 3 founder listings.

**Next:** contact slice (the "capture the value" gap), or signup-name + copy pass.

Full detail in `WORK AREAS/Product/mvp-build-project/memory.md`.

---

## 2026-06-09 · /apply Slice C SHIPPED — three membership emails, tested clean on prod

**Worked on:**
- Built + shipped Slice C: `lib/applications/emails.ts` (three best-effort Resend sends — applicant confirmation, refined reviewer ping, "You're in." welcome), wired confirmation + ping into `submit.ts` (insert now returns the id), and `scripts/approve-application.ts` + `npm run approve` as the seed-phase approval path (Option A CLI; service-role key via supabase-js rpc, migration 0009 grants execute). Two commits, pushed, Vercel deployed.
- Full apply → approve → welcome → cleanup loop tested on prod against the deployed code (synthetic applicant on a Gmail plus-alias so applicant-facing emails were readable; founder untouched). All three emails confirmed; DB transaction atomic; `/listings/new` gate opens for the approved member.

**Caught:**
- First test run hit the not-yet-deployed old code (deployed, then re-tested). Resend "low quota" headers were a false alarm (rate-limit, not budget — George confirmed). First test-applicant address (`george@manhattanite.com`) wasn't a readable inbox; switched to the Gmail plus-alias.

**Next:** the walkthrough checkpoint (agreed live-site pause); repeat the landing-page / thin-content caveats.

Full detail in `WORK AREAS/Product/mvp-build-project/memory.md`.

---

## 2026-06-04 · Phase 4 Slice 2 shipped — /profile/edit + cosmetic fix on /profile link stacking

**Worked on:**
- Closed the "name not collected at signup" thread (open since Slice 2). New `/profile/edit` route + form lets members update their own name, neighborhood, bio. No migration — accounts table already had the columns from 0001, the RLS update-own policy + protect_account_columns trigger already cover the security model.
- Three new files: `lib/profile/update.ts` (server action, validates + writes), `app/components/ProfileEditForm.tsx` (client form), `app/profile/edit/page.tsx` (route shell). Added "Edit profile →" link to `/profile` in both member and Tier-1 branches.
- Live test on prod: full round-trip verified (form save → /profile re-render → /listings byline updated via the Slice 1 trigger). Caught + fixed a cosmetic bug where the two secondary links ran together on one line.

**Decided:**
- Name is optional, not required. Byline has a graceful "a member" fallback.
- Empty string → null on save (cleaner DB state).
- Cosmetic link-stacking fix bundled into the slice (caught during live test, fix is 6 lines).

**Blockers / open threads:**
- Slice ships in two commits — the cosmetic fix needs a small follow-up commit after the main `feat(profile)` push.
- No /apply route yet — Tier-1 holders can edit profile but can't apply.

**Next:**
- /apply route (Phase 2 proper, 2-3 sessions).
- Or: seed listings load (needs real photos).
- Or: small polish round.

Full session-by-session detail in `WORK AREAS/Product/mvp-build-project/memory.md`.

---

## 2026-06-04 · Phase 4 Slice 1 shipped — author/sponsor byline denormalized

**Worked on:**
- Closed the "Listed by a member · sponsored by —" byline gap that's been open since Slice 4. Migration `0006_listings_byline_denorm.sql` adds `author_name` + `sponsor_name` text columns to listings with a `BEFORE INSERT` trigger (populates from accounts via SECURITY DEFINER lookup) and an `AFTER UPDATE` trigger on accounts (propagates renames + sponsor changes). Set founder's `accounts.name = 'George Gardner'` (was null since Slice 2). Backfilled both existing founder listings; manually overrode `sponsor_name = 'John Robinson'` as a demo-visibility placeholder.
- Code: dropped the embedded `author:accounts(name)` select from `/listings` and `/listings/[id]` (it was returning null due to accounts read-own RLS), now reads `author_name` + `sponsor_name` directly. New `renderByline()` helper conditionally appends the sponsor portion only when `sponsor_name` is present.
- Live test on prod confirmed: full byline on both founder listings; conditional renders cleanly without sponsor when nulled; rename trigger round-trip propagates without error.

**Decided:**
- **GdC-style full first + last name format** ("George Gardner") over Vinted-style initial ("George G.") — switched after looking up Gens de Confiance's convention. Trust-by-identity, matches the editorial brand voice. Privacy trade-off accepted.
- **Denormalize over RLS public-profile policy or SECURITY DEFINER view** — RLS is row-level not column-level, and views don't traverse PostgREST embedded selects cleanly. Triggers handle rename propagation.
- 'John Robinson' is fake placeholder data; replace before any non-founder sees the network.

**Blockers / open threads:**
- 'John Robinson' is fake — must go before public-facing surface.
- Name not collected at signup (Slice 2 thread) — real members will render "Listed by a member" until profile-edit UI exists.
- Two slices' worth of byline-display work now closed: this slice closes the Slice 4 byline gap.

**Next:**
- Build `/profile/edit` so members can set their own name (unblocks real-name bylines).
- Or: `/apply` route (Phase 2 proper).
- Or: seed-data load (with real photos sourced).

Full session-by-session detail in `WORK AREAS/Product/mvp-build-project/memory.md`.

---

## 2026-06-04 · Phase 3 Slice 6 shipped — image upload via Supabase Storage

**Worked on:**
- Housekeeping pass on `CLAUDE.md` Part 2 — replaced the "Phase 1 just beginning / Supabase not yet wired / waitlist→gating in transition" framing with the current truth (through Phase 3 Slice 5, Supabase wired, gating page live). Added a fresh Active-migrations list for the genuinely-open threads.
- Slice 6 in full: two new migrations (`0004` adds `images jsonb` with a ≤6 CHECK; `0005` creates a private `listing-images` Storage bucket + 3 RLS policies), four new code files (`lib/storage/upload-listing-image.ts`, `lib/storage/sign-image-urls.ts`, `app/components/ImageUpload.tsx`, plus updated form / action / browse / detail pages). Migrations driven from Cowork via Chrome → Supabase SQL Editor (first time a slice migration was applied from Cowork rather than Code tab). Commit + push handed to Claude Code via a self-contained prompt. Vercel auto-deployed.
- End-to-end test on prod: posted a SoHo loft with 3 photos, verified detail-page gallery + browse cover + the conditional render path for image-less listings. Cleaned up the smoke-test row + storage objects via the Supabase JS client in the browser (RLS owner-delete policies allowed both). `.test-uploads/` workaround folder removed locally.

**Decided:**
- 6-photo cap per listing (revised down from the 2026-05-16 `8`).
- Private bucket + signed URLs over public bucket — Tier 0 → Tier 1 wall must hold on pixels too.
- Upload-on-select, plain `<img>` tags (not Next.js `<Image>`), orphan-file cleanup deferred.

**Blockers / open threads:**
- The three byline / `/apply` threads from Slices 4/5 still open — unchanged.
- `delete from storage.objects` is blocked by Supabase (`42501: Direct deletion from storage tables is not allowed`); use the Storage API instead.
- Cowork's `file_upload` MCP rejected my local JPEG paths during the test; worked around by fetching picsum photos in the page JS context and dispatching a synthetic `change` on the file input. Pattern documented in the project memory for reuse.

**Next:**
- Candidates for the next session: load the 27 seed listings (with real photos sourced first); OR wire the author-name / sponsor-name display; OR start the `/apply` route.

Full session-by-session detail in `WORK AREAS/Product/mvp-build-project/memory.md` (project memory).

---

## 2026-05-18 · Personal Assistant fully configured for Manhattanite

**Worked on:**
- Activated and scoped the Personal Assistant inside the Manhattanite workspace. PA plugin was installed back on 2026-05-15 but never properly switched on.
- Built the missing Admin-PA scaffolding: `captains-log/2026-05-captains-log.md`, `contacts.md`, `preferences.md`, `output-log.md`. Until now only `tasks.md` existed.
- Wrote `WORK AREAS/Admin-PA/manhattanite-pa-config.md` — the master operational config for the PA. Covers email/calendar account map, calendar permissions (Personal Google Calendar read+write, Outlook read+write, Danbro read-filtered), cross-folder access pattern for George's other Cowork workspaces, proactive surfacing rules, ADHD defaults, logging behaviours, and what the PA explicitly does NOT do.
- Upgraded the existing scheduled tasks `pa-morning-briefing` (7am daily) and `pa-end-of-day-summary` (8pm daily). Both now read Manhattanite project memory (`COMPANY/memory.md` + `WORK AREAS/Product/mvp-build-project/memory.md`), scan Outlook for business email, and have a hook to read other Cowork workspaces when mounted. Morning briefing now produces a dedicated "Manhattanite build state" section and includes a Monday-only "Week ahead" view.

**Decided:**
- **Outlook = Manhattanite business, Gmail = personal, never cross.** Already in `pa-rules.md`; reinforced in the PA config and both briefing prompts.
- **Anticipate aggressively.** Daily 7am briefing + 8pm EOD + meeting prep before meetings + decision surfacing — drafts everything, sends nothing without George's per-message approval.
- **Cross-folder pattern: on-demand mounting.** Scheduled tasks request other Cowork workspaces via `request_cowork_directory` when needed. Cowork persists approved mounts so subsequent runs come up silently.
- **Calendar autonomy:** PA may create, move, and respond to events on Personal Google Calendar and Outlook for George's own time. Still surfaces a decision before booking external attendees.

**Blockers / open threads:**
- **Other Cowork folder paths pending.** George needs to share the exact paths of his other Cowork workspaces (e.g. music, personal life) so they can be listed in `manhattanite-pa-config.md` Section 3 and mounted on first request.
- The 8pm EOD summary will fire later today and should now reflect this richer setup. Worth a Run Now from George to pre-approve the new connectors the prompts reference.

**Next:**
- George shares paths to other Cowork folders → add them to the cross-folder map.
- Optional: George triggers Run Now on `pa-morning-briefing` and `pa-end-of-day-summary` to pre-approve Outlook/Gmail/Calendar tool access so future scheduled runs don't pause on permission prompts.

---

## 2026-05-17 · Phase 0 collapse migration complete

**Worked on:**
- Executed and verified the Phase 0 collapse migration on the night of 2026-05-17.
- Unified the previously split Cowork workspace and Claude Code repo into a single folder at `~/Developer/manhattanite`.

**Decided:**
- Single folder at `~/Developer/manhattanite` is now the source of truth for both the CoWork upper layer (ABOUT ME, COMPANY, RESOURCES, WORK AREAS) and the Claude Code lower layer (Next.js codebase). No more drift between two folders.

**Blockers / open threads:**
- None from the migration itself.

**Next:**
- Resume Phase 1 build work against the unified folder.

---

## 2026-05-16 · Tech stack locked

**Worked on:**
- Confirmed Batch 4 assumptions as defaults (lifetime ban, no broker listings, four-state sponsor ladder, George's-name-on-emails at seed, lawyer engagement in 4–6 weeks).
- Rewrote `tech-architecture.md` from stub to confirmed v1. Locked the full stack: Next.js + Vercel + Supabase + Resend + Cloudflare + Plausible + Sentry + GitHub.
- Closed every open decision in the stub: auth via magic link, single sponsor FK, status-based applications, three roles only, one listings table with JSON details, 8 photos per listing, contact form via Resend, RLS as the security primitive of the two-tier model.
- Added missing scaffolding the stub didn't cover: Sentry, GitHub, deployment flow, backups, security posture, observability.

**Decided:** See `decisions.md`. Headlines:
- Full stack confirmed. Total cost ~$10/month at MVP.
- RLS on every member-only table is non-negotiable — it's what makes the two-tier wall real.
- No staging environment; Vercel previews + production are enough at MVP.
- Backups: free-tier OK at seed, upgrade to Supabase Pro at Cohort 1.

**Blockers / open threads:**
- George has 5 personal action items before build week 1: register domain, create GitHub repo, sign up for accounts, pick email-from addresses, decide production-promotion rule.
- Founding-member acquisition project still unstarted.
- Lawyer outreach still unstarted.

**Next:**
- George runs through the 5 pre-build action items.
- After that: spin up `WORK AREAS/Product/mvp-build-project/` and begin build week 1.
- In parallel: founding-member acquisition + lawyer outreach.

---

## 2026-05-16 · Batch 4 — GTM, trust, legal

**Worked on:**
- Drafted `gtm-playbook.md`: three-phase model (Seed 0–20, Cohort 1 20–80, Cohort 2 80–200), founder routines per phase, channel posture, anti-patterns, and metrics.
- Drafted `trust-and-moderation.md`: approval criteria (baseline + tilts + automatic decline), listing standards by category, sponsor accountability ladder (good standing → watch → probation → removed), removal grounds, edge cases.
- Drafted `legal-and-policy.md` as a tiered open-questions map (not legal advice). Identified Tier 1 items that block MVP go-live: entity formation, TOS, privacy policy, founder identity exposure. NYC fair-housing flagged as the largest unaddressed risk.

**Decided:** See `decisions.md`. Headlines:
- No paid ads. Sponsorship-led growth. Public marketing surface delayed until Cohort 2.
- Free until Cohort 3, then pay-per-post via Stripe.
- Sponsor accountability is a graded ladder, not binary.
- Lifetime ban on removal (default; open to a 12-month cooling-off alternative).
- Seed-phase legal posture: private + non-transactional. Counsel engagement is the first move.

**Blockers / open threads:**
- All legal Tier 1 items remain open. George needs to find a NY startup attorney.
- First-20-members list still to be built. Lives under `WORK AREAS/Growth/founding-member-acquisition-project/` once created.
- Several assumptions in the new files want a reaction round: broker-listing policy, founder identity exposure, sponsor accountability ladder granularity, lifetime ban vs cooling-off.

**Next:**
- George reacts to Batch 4 assumptions.
- Spin up `WORK AREAS/Growth/founding-member-acquisition-project/` for the operational first-20 list.
- Begin lawyer outreach.
- Decision needed: do we draft a `WORK AREAS/Legal/counsel-engagement-project/` to track the legal workstream?

---

## 2026-05-16 · Batch 3 + clarifications round

**Worked on:**
- Drafted Batch 3: `mvp-spec.md` (two-tier model, 14-week timeline, v1 OUT cuts, success criteria) and `tech-architecture.md` stub (default stack table, open decisions, data model sketch).
- Applied a sweep of George's clarifications across earlier files: American English throughout, two-tier access model propagated, palette demotion of Brick, wordmark + final palette deferred.
- Created visible top-level `COMPANY/memory.md` as the quick-state entry point (deep memory files stay in `memory/`).
- Updated `_index.md` to point at the new memory entry.

**Decided:** See `decisions.md`. Headlines:
- Two-tier access model is the core mechanic: Account (free, view-only) → Member (approved, can interact).
- Contact form in v1 forwards to email; no in-platform inbox until v2.
- American English everywhere in Manhattanite-branded copy, overriding George's personal British defaults.
- Wordmark + final palette deferred until first product screens exist. Black + cream working base; Brick demoted to reserve.

**Blockers / open threads:**
- First-20-members strategy still undefined. Sits as a future workstream under `WORK AREAS/Growth/founding-member-acquisition-project/`.
- Legal posture still undefined. NYC fair-housing rules for apartment listings need structured work.
- Default stack (Next.js + Supabase + Vercel + Resend + Cloudflare + Plausible) is provisional until tech-architecture.md is confirmed.

**Next:**
- Batch 4: `gtm-playbook.md`, `trust-and-moderation.md`, `legal-and-policy.md`.
- Set up `WORK AREAS/Growth/founding-member-acquisition-project/` once GTM playbook exists.
- Confirm tech stack before week 1 of MVP build.
- Possible side-quest: mock wordmark concepts on a real first screen.

---

## 2026-05-16 · Context system kickoff (Batch 1 + 2 + clarification)

**Worked on:**
- Designed the 9-file context system for `COMPANY/`.
- Resolved 3 strategic pushbacks: launch categories, trust mechanic, MVP timeline.
- Set up `COMPANY/memory/` with decisions log + session log.
- Drafted Batch 1: `pa-rules.md`, `_index.md`, `product-vision.md`.
- Drafted Batch 2: `brand-guide.md`, `voice-and-copy.md`.
- George clarified: account creation in the MVP is real, not example. Application path is functional from day one and reviewed manually.

**Decided:** See `decisions.md`. Headlines:
- 2-category launch (apartments + furniture)
- Trust mechanic: seed-phase = open application reviewed by George; post-launch = sponsor-only primary
- No "waiting list" framing — use "apply for membership"
- 14-week MVP target (end of August 2026)
- Stack: Next.js + Supabase + Vercel (default, pending confirm in `tech-architecture.md`)
- Seed MVP has labelled example listings + real application flow
- Brand: GT Sectra wordmark with italic "ite" (default), Lampblack + Paper + Brick palette (default)
- Voice anchor: Soho House. Tagline placeholder: *New York's trusted private marketplace.*

**Blockers / open threads:**
- First-20-members strategy is undefined. Lives as a future workstream under `WORK AREAS/Growth/founding-member-acquisition-project/`.
- Legal posture is undefined. Needs structured work, including NYC fair-housing rules for apartment listings.
- Spelling split (British vs American) flagged for confirmation in voice-and-copy.md.
- Brand color and wordmark direction are defaults — need George's react.

**Next:**
- Batch 3: `mvp-spec.md`, `tech-architecture.md` stub
- Batch 4: `gtm-playbook.md`, `trust-and-moderation.md`, `legal-and-policy.md`
- Set up `WORK AREAS/` with founding member acquisition project once GTM playbook exists
- Possible side-quest: mock wordmark concepts

---

*Entry format: date · short title, then sections for Worked on / Decided / Blockers / Next.*
