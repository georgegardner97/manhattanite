# Navigation Slice — Build Plan

**Date:** 2026-06-09
**Why this slice:** The Slice C walkthrough showed the #1 problem is that **no navigation exists** — no header, no menu, no back links (confirmed: no nav component in the codebase; `app/layout.tsx` is bare; each page renders its own centered wordmark). This slice gives the app a spine and builds it around the **three-tier model decided 2026-06-09** (decisions.md): the trust gate sits at the **action** layer, not the **viewing** layer.

**Tier model this slice implements:**
- **Visitor (logged out):** *teaser* browse — sees a limited set of listings + the pitch. Job: make an account.
- **Account (Tier 1):** full browse, full detail; acts on nothing. The on-ramp. Job: apply for membership.
- **Member (Tier 2):** can post, (later) contact, sponsor; manage own listings.

---

## Scope (in / out)

**In:**
1. A persistent, tier-aware **site navigation** mounted globally.
2. **Back links** on sub-pages.
3. A **"My listings"** view for members (read-only list of their own posts).
4. The **teaser** change: logged-out visitors can browse a limited set of listings (the D1 decision) instead of being bounced to `/login`.

**Out (flag as follow-ups, do not build here):**
- Edit/delete listing UI (RLS already allows author edit/delete; the *forms* are a separate slice).
- The **contact** feature (its own v1 slice — the bigger "capture the value" gap).
- Signup name field (A5 — small, bundle with the copy pass next).
- Phase 1.5 visual redesign (layout, date picker, landing page). This slice is *structure and routing*, not a restyle — match the existing editorial look, don't redesign it.

---

## The one default to confirm — teaser scope

The decision says "teaser only" for logged-out visitors. Proposed **default** (adjust if you disagree):

- Logged-out visitors see the **6 most recent published listings** in full (cards **and** detail pages for those), then a "**Create an account to see every listing →**" prompt where the rest would be.
- The cap is enforced **in the query**, not in the database wall. Published listings become anon-readable at the data layer — which is *intentional and on-strategy*: viewing is a funnel, not the moat; the real wall is the action layer (contact/post/sponsor), which stays RLS-enforced. (If you ever want a *hard* cap that can't be bypassed via the API, that needs a `SECURITY DEFINER` function — more work, deferred unless you ask.)
- Contacting, posting, sponsoring remain fully member-gated regardless of who's looking.

If you'd rather the teaser show **cards only** (detail requires an account), that's a one-line change — say which you prefer; the plan below assumes the generous "6 full listings" version.

---

## File-by-file

### 1. `app/components/SiteNav.tsx` (new) — the tier-aware nav
- **Server component.** Reads the session itself: `const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();` then, if a user exists, reads `is_member` + `name` from `accounts` (same pattern as `app/profile/page.tsx`). Derive a `viewer` of `'guest' | 'account' | 'member'`.
- **Slim top bar**, full-width, matching the editorial look (bone background, ink text, `font-serif` wordmark, `mh-link` underline-on-hover for links). Wordmark "Manhattan*ite*" on the left links to `/`. Links on the right, by tier:
  - **guest:** `Listings` · `Log in` · **`Create account`** (emphasized).
  - **account:** `Listings` · **`Apply for membership`** (emphasized — this is the conversion CTA) · `Profile` · `Log out`.
  - **member:** `Listings` · `Post a listing` · `My listings` · `Profile` · `Log out`.
- **Never render a link a tier can't use** (no post/my-listings for guests or accounts) — the nav should make the wall obvious, not show locked doors.
- `Log out` posts to the existing sign-out path (check how `/login` signs in; reuse the same supabase client sign-out — a small client action or a route handler `app/auth/signout/route.ts` if one doesn't exist).

### 2. `app/layout.tsx` (edit) — mount the nav
- Render `<SiteNav />` above `{children}`. Keep it minimal; the nav reads its own session, so no prop drilling.
- Because the nav reads session, every route renders dynamically — that's already true (pages use `force-dynamic`); fine.

### 3. Per-page wordmark cleanup (edit, mechanical)
- Each page currently renders its own large centered "Manhattanite" wordmark (`/listings`, `/listings/[id]`, `/listings/new`, `/profile`, `/profile/edit`, `/apply`, `/`). With a global nav wordmark, two wordmarks will stack.
- **Decision for the builder:** keep the big centered wordmark on the **landing page `/`** (it's the hero) and on auth pages `/login` `/signup` if it reads well; **remove the redundant per-page wordmark** on the interior pages (`/listings`, `/listings/[id]`, `/listings/new`, `/profile`, `/profile/edit`, `/apply`) so the nav wordmark is the only one. Judgement call where it's borderline — optimize for "not two wordmarks stacked."

### 4. Back links on sub-pages (edit)
- `/listings/[id]`: add "← Listings" at the top (links `/listings`).
- `/listings/new`: "← Listings".
- `/apply`: "← Profile".
- `/profile/edit`: already has "← PROFILE" — leave it.
- Use the existing `mh-link` style + the small-caps treatment already used on "← PROFILE".

### 5. `app/listings/mine/page.tsx` (new) — My listings
- **Member-only.** No session → `/login`; logged in but `is_member=false` → `/profile` (mirror the `/apply` gate pattern).
- Lists the viewer's **own published listings** (`author_id = auth.uid()`, `status='published'`, newest first), reusing the listing-card layout from `/listings`. Each card links to its detail page.
- **No new RLS needed:** posting publishes directly today, so the existing `listings_read_published_for_accounts` policy returns the member's own published rows when filtered by `author_id`. *(If a draft state is ever added, add a "read own, any status" policy then.)*
- Empty state: "You haven't posted anything yet." + a "Post a listing →" link.
- Edit/delete controls are **out of scope** (note in a comment that the RLS already permits author edit/delete when the forms are built).

### 6. `app/listings/page.tsx` (edit) — teaser for logged-out
- Remove the `redirect("/login")` for logged-out visitors.
- If **no user**: query the **6 most recent published** listings and render them, then a "Create an account to see every listing →" prompt (links `/signup`).
- If **user**: unchanged (full browse, `.limit(50)` as today).
- Keep contact/act controls absent for everyone (they already are this slice).

### 7. `app/listings/[id]/page.tsx` (edit) — detail visibility for the teaser
- Allow logged-out visitors to view the detail of a listing **that is within the teaser set** (the 6 most recent published). For other detail pages while logged out → redirect to `/signup` with the "create an account" prompt. (If you pick the "cards only" teaser instead, just gate all detail behind login — simpler.)

### 8. `supabase/migrations/0010_listings_anon_teaser_read.sql` (new) — only if needed for the teaser
- The current read policy requires `auth.uid() is not null`. To let logged-out (anon) visitors read published listings for the teaser, add a policy: `for select to anon using (status = 'published')`. Keep the existing authenticated policy.
- **This is the data-layer expression of the D1 decision** — viewing is a funnel, action is the wall. Document that in the migration comment.
- Apply to prod the same way as 0007/0009 (Chrome MCP → SQL editor, new untitled snippet) — or have Claude Code tell George the exact line to run.

---

## Testing (mirror the Slice A/B/C discipline)
- **Guest:** logged out, `/listings` shows the 6-listing teaser + the create-account prompt; a teaser listing's detail renders; a non-teaser detail redirects to signup; nav shows `Listings · Log in · Create account` only.
- **Account (Tier 1):** log in as a non-member (synthetic account or flip founder), nav shows `Listings · Apply for membership · Profile · Log out`; full browse works; **no** Post/My-listings links anywhere; `/listings/new` and `/listings/mine` typed directly still redirect (gates hold).
- **Member:** founder, nav shows `Listings · Post a listing · My listings · Profile · Log out`; `/listings/mine` lists the founder's 2 listings; back links work on detail/new.
- `tsc` + `eslint` clean on changed files. Test on prod after deploy (the teaser only behaves correctly against the deployed RLS).
- Clean up any synthetic accounts; leave the founder untouched (`is_member=true, sponsor_id=null`).

## Commits
- `feat(nav): tier-aware site navigation + back links + my-listings (walkthrough A1–A3)`
- `feat(listings): logged-out teaser browse (D1 — trust gate at action layer)` + migration 0010
- `docs: navigation slice plan + memory`
- Do **not** commit `.env.local`.

## After build → back to Cowork
Reconcile anything that drifted, mark the slice shipped in memory, and tee up the next slice (contact, or signup-name + copy pass).
