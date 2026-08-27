# Claude Code prompt — George's site walkthrough, 27 Aug 2026

Paste this whole file, or point Claude Code at it:
`WORK AREAS/Product/design-foundation-project/outputs/Classifieds_Claude-Code-Prompt_v1.md`

Full reasoning and the alternatives that were rejected are in the sibling file
`Classifieds_Website-Notes_v1.md`. Read it before starting — it records WHY each
of these is being done, which matters more than the diffs.

---

## Context you need before touching anything

George walked the live site on 27 Aug 2026, the day after the Classifieds
migration merged (`4759502`), and gave five notes. Three decisions were put to
him and answered; they are recorded inline below as **DECIDED** and are not open
for re-litigation.

**There is uncommitted work already in the tree.** A Cowork session implemented
Task 0 below — 13 files plus one new migration. Verify it; do not redo it.
`git status` before you start so you know what you inherited.

Branch off `main`. This is a batch of related UI changes with one route removal
in it — worth a branch and one `--no-ff` merge, the same way the migration went
in, so it reverts as a unit if George dislikes it on the live site.

---

## Task 0 — finish the blank-price change (code done, migration NOT applied)

**Already in the working tree, uncommitted.** A listing may now have no price at
all: a members' rate, a service quoted on request, a perk extended through a
member. Blank stores NULL and renders as no price line anywhere a member or a
visitor looks.

**NULL is "no price". 0 is not** — free is a real asking price and has to stay
sayable. Nothing may branch on falsiness; `if (!price_cents)` would silently
hide every free listing's price. Every reader branches on `=== null`. This is
written into the migration's own comment; keep it there.

What is left:

1. **Apply `supabase/migrations/0027_listing_price_optional.sql` in the Supabase
   SQL editor.** Until this runs, posting with a blank price fails at the
   database — the column is still NOT NULL. This is the blocker for everything
   else in Task 0.
2. `npm run build` (Cowork ran `tsc --noEmit` clean and eslint clean, but never
   built — it avoids writing `.next` while George may have the dev server up).
3. Walk one blank-price listing end to end: post → `/admin/moderation` → publish
   → browse card → listing page → edit → then clear a price that already exists,
   and confirm it comes back as blank and not `0`.
4. Confirm the two deliberate exceptions still read correctly: `/admin/moderation`
   and the post form's Review step both say **"No price"** out loud. Everywhere
   else renders nothing — no dash, no placeholder.

Review the diff rather than trusting it. Cowork could not run a build or open a
browser.

---

## Task 1 — the neighborhood filter belongs to apartments only

**George:** *"The section that lists neighbourhoods is useful but only in
reference to properties. It should only appear if you are on the property part
of the categories."*

Today the rail offers Neighborhood for every category, so a coffee table gets
filtered by Tribeca.

- Put the rule in **one predicate** in `lib/cl/filters.ts` —
  `hoodApplies(q) => q.type === "apartment"` — and have `buildHref`,
  `resultLabel`, `isFiltered`, the page's row filter and `FilterRail` all read
  it. Do not scatter `q.type === "apartment"` across five files.
- Having `buildHref` refuse to write `hood` when the resulting type is not
  apartment is what makes switching category **drop a stale `?hood=` from the
  URL** rather than filter invisibly. That is the point of putting it there.
- Derive the neighborhood list from **apartment rows only**, not all rows.
- Mobile: the disclosure summary reads "Neighborhood and price" — it must become
  "Price" when the group is hidden, or it names a control that isn't there.

---

## Task 2 — browse cards lead with the category, not the neighborhood

**DECIDED (George, 27 Aug): category first.** An apartment still reads
"UPPER EAST SIDE"; a $220 coffee table reads "FURNITURE", not "LOWER EAST SIDE".
Leading every card with a neighborhood in caps is rental-portal grammar and is
the second-largest reason the site reads as a rental site.

`placeOf()` in `lib/listings/card.ts` currently returns the neighborhood
whenever there is one, and the category label only as a fallback. Invert that
for non-apartments.

**⚠️ This one has a trap, and it is the reason to do it carefully.**
`placeOf()` is doing two different jobs today: it is the **display** string on
the card AND the **data** value that filtering and search compare against.

- `app/(cl)/listings/page.tsx` filters with `placeOf(row) !== q.hood`
- `app/(cl)/search/page.tsx` feeds `placeOf(row)` into `matchesText` as a
  search haystack

Change `placeOf` alone and searching "Tribeca" stops finding a Tribeca coffee
table, silently. **Split the function:** add `neighborhoodOf(row)` returning the
raw `details.neighborhood` for data use, keep `placeOf(row)` for display only,
and repoint the filter and the search haystack at `neighborhoodOf`. Then the
display change cannot break retrieval.

`neighborhoodsIn()` already reads `details.neighborhood` directly and is fine.

---

## Task 3 — Saved leaves the main nav

**George:** *"'Saved' should not be a main menu option. You should be able to see
your saved posts but only in your profile."*

- Remove Saved from `LINKS` in `AppHeader`.
- Keep the `/saved` route and the save pill on every card — this changes where
  the list is *found*, nothing else.
- Add a Saved row on `/profile` linking to it.
- `MobileTabBar` currently carries Browse · Saved · Post · Profile. Drop Saved
  there too; three tabs (Browse · Post · Profile) is correct once Task 4 puts
  search on browse itself.

---

## Task 4 — search moves onto Browse; `/search` retires

**DECIDED (George, 27 Aug): put the search box on Browse.**

`/search` is fully built — its own screen, GET form, filter chips, shared
parsing — and **nothing in the product links to it.** The only way to reach it
is to type the URL. It is also the same read as browse: same `parseQuery`, same
`buildHref`, same gated rows, same filters. Search is browse with a text term.

- Move the search form and the active-filter chip row onto `/listings`, above
  the result count. `parseQuery` already reads `q`, so the URL shape is
  `?q=&type=&hood=&min=&max=&sort=`.
- Browse's row filter must call `matchesText` (against title, description and
  `neighborhoodOf` — see the Task 2 trap).
- Browse keeps its **card grid**. Do not bring `ClListingRow` across.
- `/search` becomes a **redirect to `/listings` preserving the query string**,
  not a 404 — links may exist and the route was public.
- Delete `app/(cl)/search/loading.tsx` and collapse `SEARCH_PATH` into
  `BROWSE_PATH` in `filters.ts`.
- **`scripts/audit-gates.ts` asserts against `/search?q=…` (around line 250).**
  Repoint it at `/listings?q=…`. This assertion is a guest name-leak check —
  it must keep passing, not be deleted.

---

## Task 5 — the header alignment defect

**George:** *"The post listing button seems like it's in a random place compared
to the rest of the website. It's not looking too neat."*

He is right and it is measurable, not taste. `AppHeader` is `max-w-[1240px]`;
browse's `<main>` is `max-w-[1400px]`, same padding. On any screen wider than
1400px the header is inset **80px each side** relative to the page under it, so
"Post a listing" lands 80px short of the right-hand card column and the wordmark
sits 80px right of the filter rail.

The site has four content widths — 1400 (browse), 1240 (landing, `/listings/mine`
outer, and the header), 1100 (search, saved, listing detail, `/listings/new`,
edit, auth), 1000 (`/members/[id]`). One header cannot align with four.

**Fix: give `AppHeader` a `width` prop** — `"wide"` (1400) for browse and its
`loading.tsx`, `"standard"` (1240) elsewhere — so the bar matches whatever is
beneath it. It already takes `active` and `admin`; this is the same pattern.
Rejected alternatives and why are in the notes file — in particular, shrinking
browse to 1240 costs a card column (4 across drops to 3).

**Flag, do not act on:** collapsing 1000/1100 into one number and 1240/1400 into
another would leave the system two widths instead of four. Nobody chose four;
they accumulated. Raise it with George rather than doing it in this batch.

---

## Housekeeping while you are in here

`CLAUDE.md` says *"Migrations are applied through `0017`"*. There are **26 on
disk** plus the new `0027`. This is the stale-notes failure the project memory
already warns about, and it will mislead the next session. Correct it, and
refresh the "Active migrations and known transitions" section for the
blank-price change.

---

## Verification — none of this is done until these pass

1. `npm run build` clean.
2. `npm run audit:rls` — expect 59/59. No gate logic changes in this batch, so a
   change here means something went wrong.
3. `npm run audit:gates` — expect 30/30 **after** the `/search` → `/listings`
   repoint. Run it against production with `APP_ORIGIN=https://manhattanite.com`
   as well as locally: the session log's own lesson from 26 Aug is that *a test
   that has only ever run locally has not been verified.*
4. Signed out, on the live site: still exactly six listings, still **no member
   name and no sponsor name anywhere**, in the rendered HTML and the RSC payload.
   Nothing in this batch touches that rule, so nothing may weaken it.
5. By eye at >1400px wide: header, filter rail and card grid share the same left
   and right edges on browse.
6. Apartments selected → neighborhood rail appears. Switch to Furniture → it
   disappears AND `?hood=` leaves the URL.
7. A blank-price listing renders with no price line on the card, the listing page
   and `/listings/mine`; sorts to the END under "Price"; and is EXCLUDED by a
   min/max price filter.

---

## Explicitly OUT of scope — do not do these

- **"Looking for" / wanted listings.** DECIDED: parked (George, 27 Aug).
  Discussed at length in the notes file; not in this batch.
- **Price modes** (Free · Make an offer · Rate on request). Parked. Plain blank
  was deliberately chosen as the first move.
- **New categories** — Sublets, Rooms, Bikes, Art, Tickets, Jobs. Do not add
  them. Services and "Everything else" are already at zero, and empty categories
  make a small network look emptier. Categories follow listings, not the reverse.
- **Slice 3b** (`/admin` ×4) and the `(ed)` retirement. Separate piece of work.
- **Rebalancing the seed listings** (12 apartments of 20 is the single biggest
  reason the site reads as rentals). That is content, not code, and it is
  George's to write.
- **Anything that weakens the guest name rule or the six-row teaser cap.**

---

## Before you finish

Log to all four, per `CLAUDE.md` — a code session that only updates its own
project memory leaves Cowork blind to decisions that were genuinely strategic:

- `COMPANY/memory.md`
- `COMPANY/memory/decisions.md` — the three calls George made on 27 Aug: card
  kicker leads with category; search lives on browse and `/search` retires;
  wanted ads parked. Plus blank price being permitted at all.
- `COMPANY/memory/session-log.md` — dated entry, newest at top.
- `WORK AREAS/Product/design-foundation-project/memory.md`

And commit the `COMPANY/` and `WORK AREAS/` doc changes — the standing rule from
the 2026-07-20 doc-revert incident is that they get wiped otherwise.
