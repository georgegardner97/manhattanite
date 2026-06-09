# Navigation Slice — Claude Code hand-off prompt

**How to use:** open the **Code** tab and paste everything in the box below as one message. It's self-contained — Claude Code has the repo, so it references existing files. If it needs a privileged step (the teaser migration), it'll tell you the exact line to run, same as Slice C.

**Before you paste — one choice to make (teaser scope):** the prompt assumes the generous default (logged-out visitors see the 6 most recent listings *in full, including detail*). If you'd rather they see *cards only* and must create an account to open any detail, change the one line flagged "[TEASER CHOICE]" in the prompt before sending.

---

```
We're building the Navigation slice in the Manhattanite repo. Full plan at:
- WORK AREAS/Product/mvp-build-project/outputs/Navigation-Slice_Build-Plan_v1.md

Read it first. This slice gives the app a navigation spine and implements the three-tier model decided 2026-06-09 (COMPANY/memory/decisions.md): the trust gate is at the ACTION layer, not the VIEWING layer. Logged-out = teaser browse; account (Tier 1) = full browse, acts on nothing; member (Tier 2) = post / my-listings / (later) contact.

Match the existing editorial look (bone/ink/slate/park tokens, Instrument Serif via font-serif, mh-link hover style) — this is structure and routing, NOT a visual redesign. Don't restyle pages beyond what the nav requires.

Build in this order:

1) app/components/SiteNav.tsx (new). Server component. Read session like app/profile/page.tsx does: createClient() → auth.getUser(); if a user exists, read is_member + name from accounts. Derive viewer = 'guest' | 'account' | 'member'. Render a slim top bar: wordmark "Manhattanite" (left, links /) + right-side links by tier:
   - guest: Listings · Log in · Create account (emphasize Create account)
   - account: Listings · Apply for membership (emphasize — it's the conversion CTA) · Profile · Log out
   - member: Listings · Post a listing · My listings · Profile · Log out
   Never render a link the tier can't use (no Post/My-listings for guests/accounts). Wire Log out to the existing sign-out path (reuse whatever /login uses; add app/auth/signout/route.ts only if none exists).

2) app/layout.tsx (edit). Render <SiteNav /> above {children}.

3) Per-page wordmark cleanup. With a nav wordmark, the big centered per-page wordmarks now double up. Keep the hero wordmark on / (landing) and on /login /signup if it reads well; REMOVE the redundant centered wordmark on the interior pages: /listings, /listings/[id], /listings/new, /profile, /profile/edit, /apply. Goal: never two wordmarks stacked.

4) Back links. Add a small "← Listings" (mh-link, matching the existing "← PROFILE" small-caps treatment) to the top of /listings/[id] and /listings/new; "← Profile" to /apply. /profile/edit already has one — leave it.

5) app/listings/mine/page.tsx (new). Member-only: no session → /login; is_member=false → /profile (mirror the /apply gate). List the viewer's own published listings (author_id = auth.uid(), status='published', newest first) reusing the /listings card layout; each links to its detail. No new RLS needed (posting publishes directly, so the existing published-read policy returns own rows filtered by author_id; add a read-own-any-status policy only if a draft state is ever introduced — just note this in a comment). Empty state: "You haven't posted anything yet." + Post a listing → link. Edit/delete is OUT of scope (comment that RLS already permits author edit/delete for when the forms are built).

6) app/listings/page.tsx (edit) — teaser. Remove the logged-out redirect("/login"). If no user: query the 6 most recent published listings, render them, then a "Create an account to see every listing →" prompt linking /signup. If user: unchanged (full browse, limit 50).

7) app/listings/[id]/page.tsx (edit). [TEASER CHOICE] Allow logged-out viewing of a listing's detail only if it's within the teaser set (6 most recent published); otherwise redirect logged-out visitors to /signup. (If we decide cards-only instead, just gate all detail behind login.)

8) Teaser RLS — supabase/migrations/0010_listings_anon_teaser_read.sql (new). The current read policy requires auth.uid() is not null, so anon can't read anything. Add: a SELECT policy for the anon role using (status = 'published'). Keep the existing authenticated policy. Comment it as the data-layer expression of the D1 decision (viewing is a funnel; the action layer is the real wall). The teaser CAP (6) is enforced in the query, not the policy — that's intentional for MVP. Tell me the exact line(s) to run in the Supabase SQL editor (I'll run it, new untitled snippet), and don't rely on it being live until I confirm.

Then: pause and give me the migration line. After I confirm it's run + the build is deployed, run the test loop on prod:
   - guest: /listings shows 6-listing teaser + create-account prompt; a teaser detail renders; a non-teaser detail redirects to signup; nav = Listings · Log in · Create account.
   - account (flip founder is_member=false OR a synthetic account): nav = Listings · Apply for membership · Profile · Log out; full browse works; NO Post/My-listings links; /listings/new and /listings/mine typed directly still redirect.
   - member (founder): nav = Listings · Post a listing · My listings · Profile · Log out; /listings/mine lists the founder's 2 listings; back links work.
   - restore founder to is_member=true, sponsor_id=null; clean up any synthetic accounts.
   tsc + eslint clean on changed files before committing.

Commits:
   - feat(nav): tier-aware site navigation + back links + my-listings (walkthrough A1–A3)
   - feat(listings): logged-out teaser browse (D1 — trust gate at action layer)  [+ migration 0010]
   - docs: navigation slice plan + memory
   Do NOT commit .env.local.

When done, give me a one-paragraph summary + anything that needs my eyes (especially the migration line and the test results).
```

---

## After Claude Code reports back (→ Cowork)
Ping me and I'll: reconcile any drift, mark the navigation slice SHIPPED in memory, and tee up the next slice — most likely the **contact** slice (the "capture the value" half of membership) or the small **signup-name + copy pass**.
