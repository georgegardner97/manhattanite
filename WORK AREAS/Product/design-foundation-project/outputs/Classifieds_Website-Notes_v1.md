# Classifieds — website notes (George's walkthrough, 2026-08-27)

Live-site notes taken during George's own pass over manhattanite.com after the
Classifieds merge (`4759502`). Captured here as they arrive; implemented in one
pass afterwards so the fixes land together rather than as a trickle of edits.

Status key: **OPEN** (captured, not started) · **DONE** (shipped) · **CALL** (needs George's decision)

---

## 1. Browse reads as a rental site, not a classifieds site — 1a DONE · 1b PARTLY DONE

**George:** "The website seems to be geared mostly to renting and properties. That
is not the model. It is a part of that but it feels like a rental website, not a
classified ads website. The section that lists neighbourhoods is useful but only
in reference to properties. It should only appear if you are on the property part
of the categories."

Two separable things.

**1a — Neighborhood filter is over-scoped.** Clear and actionable. The rail shows
Neighborhood for every category, so a coffee table gets filtered by Tribeca. Fix:
the neighborhood group appears only when Apartments is the active category.
Cleanest implementation is one predicate in `lib/cl/filters.ts` (`hoodApplies`)
read by `buildHref`, `resultLabel`, `isFiltered`, the page's row filter and
`FilterRail` — so switching category also drops a stale `?hood=` from the URL
rather than filtering invisibly. Also: derive the hood list from apartment rows
only, and swap the mobile disclosure label ("Neighborhood and price" → "Price")
when the group is hidden.

**1b — The wider "feels like rentals" read.** Not one control; four things
compounding. Listed in order of how much each contributes:

- **The seed mix.** 12 of 20 listings are apartments, 8 furniture, 0 services,
  0 everything-else. Whatever the design does, a grid that is 60% apartments
  reads as an apartments site. Biggest single lever, and it is content, not code.
- **The card kicker.** `placeOf()` leads every card with the neighborhood in
  caps whenever the listing has one — so a $220 coffee table is headlined
  "LOWER EAST SIDE". That is the visual grammar of a rental portal. **CALL:**
  lead non-apartments with the category instead, or with "Furniture · Lower
  East Side", or leave as is.
- **The rail's shape.** Twelve neighborhoods stacked down the left is longer
  than the category list above it, so location outranks category on the page.
  1a fixes most of this by itself.
- **Two empty categories.** Services 0 and Everything else 0 advertise that the
  network only really does two things.

---

## 2. "Saved" should not be a main-nav item — DONE

**George:** "I think 'saved' should not be a main menu option. You should be able
to see your saved posts but only in your profile."

Drop Saved from `AppHeader`'s nav; keep the `/saved` route and reach it from
`/profile` as a row. Notes:

- The save pill on every card stays — this only changes where the list is found.
- Nav then reads Browse · Profile, which is thin. Worth deciding at the same
  time whether Search gets a nav slot (`/search` exists and is currently
  reachable from nowhere in the header).
- `AppHeader` takes `active` as a prop; `/saved` will need `active="profile"`
  or none.

---

## 3. The post form is geared to property; the structure is too rigid — CALL (brainstorm open)

**George:** "The post a listing seems also geared towards property. Some listings
are going to be services, or people looking for certain things. They don't all
need to have a price associated. It seems too rigid of a structure. Let's
brainstorm on this."

### Diagnosis

The form asks one question — *what is it?* — and answers it with a taxonomy of
four nouns. Working classifieds ask two: **which direction** (offering /
looking for) and **what kind of thing**. Manhattanite currently supports only
the offering direction, which is why a legitimate post like "looking for a piano
teacher in the West Village" has no price, no photo, and no category that fits.

Compounding it: `price` is `required` in `ClPostForm` AND validated in
`create.ts` AND `price_cents int not null` in `0003`. It is compulsory in three
places, so "no price" is currently unrepresentable.

### Constraints worth knowing before deciding

- `listings.type` is **text + a check constraint**, not a Postgres enum
  (`0003`, widened by `0019`). Adding a category is a one-line migration, not
  an enum surgery. Cheaper than expected.
- `details jsonb` already absorbs per-category fields. The rigidity is in the
  JSX, not the schema: each category's extras are hand-written blocks toggled
  with `hidden={}`.
- `price_cents` being NOT NULL is the one real schema blocker. Note that `0` is
  a legitimate price (free), so "no price" needs NULL, not 0.
- `updateListing` rebuilds `details` wholesale from posted FormData, so any
  field the form stops mounting is a field that gets deleted on the next edit.
  Any refactor here has to keep every field the actions read mounted.

### Options on the table

**A — Direction (offering / looking for).** One new column, one control at the
top of the form. Changes the product's character more than anything else on
this list: the board stops being a catalogue and becomes a noticeboard. Also
the most trust-dependent post type, which is the argument for it being *on*
brand rather than a dilution.

**B — Price becomes a mode, not a number.** One control: an amount · Free ·
Make an offer · Rate on request · (nothing, for wanted ads). Needs
`price_cents` nullable + a `price_mode` column. Kills the "everything has a $"
problem without opening the form to per-category chaos. Browse sort by price
then needs a rule for where the unpriced ones sit.

**C — Field map instead of hand-written blocks.** Drive per-category extras
from a data table (category → fields) rather than JSX. Makes a new category a
data change. Pure frontend, no migration.

**D — Photos optional / step reorder.** A wanted ad has no photo, so "2 ·
Photos" of 3 reads as a step you failed. Pure frontend.

### The counter-argument, on the record

Flexibility is not obviously good here. A rigid form is why the listings look
consistent and scannable; Craigslist's total flexibility is why Craigslist looks
like Craigslist. Recommendation is therefore **loosen the direction and the
price, keep the field set tight** — and do NOT add the design's other five
categories (Sublets, Rooms, Bikes, Art, Tickets, Jobs) yet. Empty categories
make a small network look emptier, and the 2026-07-17 call was "no category
tiles anywhere for now, just listings". Categories should follow listings, not
lead them.

**RESOLVED (George, 27 Aug): parked.** Not in this batch. Revisit once real
listings show whether it is needed.

### 3a. The perk / members' rate case (George's example, same conversation)

**George:** "How do I list something like: Exclusive deal for Manhattanite
members, friends and family rate for beautiful Jersey Shore Hotel?"

**Today's answer: as "Everything else", and that is deliberate.** The
First-Five-Offerings playbook (Offering 4) already prescribes exactly this —
post the perk yourself as the member, under a plain listing type, *before* any
build work, because a perk that nobody claims is not a feature worth building.
Do not build a perks mechanic to answer this question.

**But the example breaks three fields, and they are the same three as note 3:**

- **Price.** There isn't one. There's a *rate* — "$180/night, normally $260" —
  or a percentage, or "ask me". Compulsory price makes this unpostable honestly.
- **Neighborhood.** It's in New Jersey. Typing "Jersey Shore" into that box puts
  Jersey Shore into the browse neighborhood rail alongside Tribeca and Harlem —
  a live demonstration that the field is doing the wrong job (see note 1).
- **The vouching sentence has no home.** *Why* can this member offer this — "my
  brother-in-law runs it" — is the entire trust content of the listing, and it
  currently has to be buried in the free-text Details box.

**The strategic observation, which is bigger than the form.** The strategy doc
defines pillar 1 as "locals-only discounts — member perks at neighborhood
businesses." A Jersey Shore hotel is neither local nor a shop discount. It is
**access through a member's relationship** — which is precisely the reframe
already parked in the session log (2026-08-XX): *lead with access and judgment,
not discounts; pass-alongs, first-look, spare capacity, twenty minutes of a
member's expertise.* George's own instinctive example is evidence that the
reframe is the right one and "locals-only discounts" is too narrow a pillar.

**Shape-wise it is a standing offer, not a thing.** It doesn't sell out; it
expires. Same shape as a service. This supports the finite-vs-standing axis in
note 3 rather than adding a fifth category.

**Cautions already on the record, restated:** perks must not become the reason
people join (wrong member composition), and "vouched by X" is attribution, never
endorsement. Perks are also the most spam-attractive listing type — pre-
moderation (0017) is what makes them safe to allow.

---

## 4. Price may be left blank — CODE DONE · MIGRATION STILL NOT APPLIED

**George, 2026-08-27:** "We should at least allow the price field to be left
blank, and if it is, for the listing to understand not to display price at all."

Decided and built. This is option B from note 3, minus the price *modes* — a
plain blank, not a picker. Direction ("looking for") is still open.

### The rule

**NULL is "no price". 0 is not.** Free is a real asking price on a classifieds
board and has to stay sayable, so nothing may branch on falsiness —
`if (!price_cents)` would silently hide every free listing's price. Every reader
branches on `=== null`. This is written into the migration comment so it
survives whoever reads the column next.

### Where it renders

Nothing at all — no dash, no placeholder — everywhere a member or a visitor
looks: browse cards, the landing band, search rows, saved, the listing page's
contact card, archived rows. **Two deliberate exceptions**, both places where
silence would read as a broken row rather than a choice:

- `/admin/moderation` says **"No price"**, so a moderator can tell a deliberate
  blank from a data fault.
- The post form's Review step says **"No price"**, because the member is
  confirming what they are about to publish.

### Files changed (13 + 1 new)

| File | Change |
|---|---|
| `supabase/migrations/0027_listing_price_optional.sql` | **NEW** — `drop not null` on `price_cents`. **Not yet applied to prod.** |
| `lib/listings/card.ts` | `price_cents: number \| null`; `formatPrice` returns `string \| null` |
| `lib/listings/create.ts` | blank → NULL; a *present* but nonsense price still rejected |
| `lib/listings/update.ts` | same, so a price can be cleared after the fact |
| `lib/cl/filters.ts` | new shared `byPrice` comparator |
| `app/(cl)/listings/page.tsx`, `search/page.tsx` | price filter + sort |
| `app/(cl)/listings/[id]/page.tsx` | local `formatPrice`; the price line is omitted, not emptied |
| `app/(cl)/listings/[id]/edit/page.tsx` | blank round-trips as blank, not `0` |
| `app/(ed)/admin/moderation/page.tsx` | "No price" |
| `app/components/cl/ClPostForm.tsx` | `required` removed, labelled optional, review copy |
| `app/components/cl/ClListingCard.tsx`, `ListingCard.tsx` | `price: string \| null` |

### Judgment calls made, worth knowing

1. **Optional for every category, apartments included.** A per-type rule (rent
   compulsory, everything else optional) is more code and pre-moderation already
   catches an apartment posted with no rent. Reversible if it turns out to matter.
2. **A price filter excludes unpriced listings.** A listing with no number
   cannot satisfy a bound; treating a missing price as `$0` would have surfaced
   every perk in a "under $500" search.
3. **The "Price" sort puts unpriced listings last.** They are not free and not
   expensive — they are unordered. Cheapest-first still means cheapest first.
4. **A blank price can be cleared, not just omitted at creation** — otherwise a
   number typed once could never be taken back off a listing.

### Verified / not verified

- `npx tsc --noEmit`: **zero source errors** (8 pre-existing errors in the
  Next-generated `.next/dev/types/validator.ts` are dev-server noise).
- `eslint` on all 13 files: 2 errors, both **pre-existing**
  (`react-hooks/static-components` on `ClListingCard`'s `Media` pattern,
  untouched by this change).
- **NOT verified:** `npm run build`, and nothing has been exercised in a browser.
  A build was deliberately not run from Cowork because it writes `.next` and
  George may have `npm run dev` up.

### Left to do (needs Claude Code or George — Cowork has no network/push)

1. Apply `0027` in the Supabase SQL editor. **Until it is applied, posting with
   a blank price will fail at the database**, because the column is still NOT NULL.
2. `npm run build`.
3. Post one blank-price listing end to end: post → moderation queue → publish →
   browse card → listing page → edit → clear a price that exists.
4. `npm run audit:rls` and `npm run audit:gates` (no gate logic changed, so both
   should be untouched — worth confirming, not assuming).
5. Commit + push.

---

## 5. The "Post a listing" button sits in a random place; the header isn't neat — DONE

**George:** "The post listing button seems like its in a random place compared to
the rest of the website. It's not looking too neat. There should also be a search
feature somewhere."

### This is a number, not a taste call

`AppHeader` is `max-w-[1240px]`. The browse page's `<main>` is
`max-w-[1400px]`. Same horizontal padding on both. So on any screen wider than
1400px the header content is inset **80px on each side** relative to the page
beneath it:

- the wordmark sits 80px right of "CATEGORY" in the filter rail
- **"Post a listing" sits 80px left of the card grid's right edge** — which is
  exactly the "floating in a random place" George is seeing

Visible in his screenshot: the pill's right edge lands well short of the
right-hand card column.

### The underlying disease: four content widths

| Width | Screens |
|---|---|
| `1400px` | `/listings` (browse) — the widest page in the product, by 160px |
| `1240px` | the landing, `/listings/mine` outer, **and `AppHeader`** |
| `1100px` | `/search`, `/saved`, listing detail, `/listings/new`, edit, auth |
| `1000px` | `/members/[id]` |

One header cannot align with four widths. Today it aligns with the landing and
misses everything else — including browse, the most-used screen in the product.

### Options

**A — Header takes the page's width as a prop (RECOMMENDED).** `AppHeader`
already takes `active` and `admin`; a third `width` prop with two values
("wide" 1400 for browse, "standard" 1240 otherwise) makes the bar align with
whatever is under it on every screen. ~6 lines. Nothing else moves.

**B — Bring browse down to 1240 to match the header.** One number, but it
**costs a card column**: at 1240 the rail (220) + gaps leave ~207px per column
against a 230px minimum, so the grid drops from 4 across to 3. Recoverable by
also shrinking the rail to 200px and the grid minimum to 210 — three numbers
instead of one, to land where A lands with none.

**C — Widen the header to 1400 everywhere.** One number, fixes browse, and makes
the misalignment *worse* on the seven screens that are 1100 wide (the pill would
sit ~150px outside the content instead of ~70px today).

**Worth doing regardless:** collapse 1240/1400 into one number and 1000/1100
into another, so the system has two widths — chrome-and-grid, and reading
column — rather than four that no one chose deliberately.

### Search — it already exists, and nothing links to it

`/search` is fully built: its own screen, a GET form, filter chips, shared
parsing with browse. **There is no link to it anywhere in the header.** The only
way to reach it is to type the URL.

This resolves neatly against note 2: **Saved leaves the nav for Profile, and
Search takes the slot it vacates.** Nav becomes Browse · Search · Profile, which
is a truer description of the product than Browse · Saved · Profile was.

**The larger observation, for George's call:** `/listings` and `/search` are the
same read. Same `parseQuery`, same `buildHref`, same gated rows, same filters —
search is browse with a text term added. They differ only in presentation (grid
of cards at 1400 vs list rows at 1100). Putting the search box **on browse** and
letting it add `?q=` to the URL would delete a route, remove the nav question
entirely, and mean one screen to keep aligned instead of two. The cost is losing
the design's dedicated search screen, which is a real design artifact and not
mine to discard.


---

## Decisions taken, 27 Aug 2026

1. **Card kicker leads with the category** for non-apartments (note 1b).
2. **Search box goes on Browse; `/search` retires** to a redirect (note 5).
3. **Wanted / "looking for" listings parked** (note 3).
4. **Blank price permitted** (note 4) — built, migration pending.
5. **Header takes a `width` prop** so it matches the page beneath it (note 5).

All five written up as an executable handoff in
`Classifieds_Claude-Code-Prompt_v1.md`.

---

## Implementation record — 27 Aug 2026 (Claude Code)

All five notes built on branch `classifieds-walkthrough-fixes`, intended as one
`--no-ff` merge so the batch reverts as a unit.

**Done:** 1a (neighborhood filter is apartments-only, one predicate, stale
`?hood=` leaves the URL) · the card-kicker half of 1b (category leads for
non-apartments) · 2 (Saved moves to `/profile`, out of the header nav and the
phone tab bar) · 4's code · 5 (`AppHeader` `width` prop — header box and
`<main>` measured identical at 100 → 1500 on a 1600px viewport) · search onto
Browse with `/search` a 308 carrying its query string.

**Still open, and it is the biggest one: the seed mix.** 12 of 20 listings are
apartments. Nothing in this batch touches it, and no design change outruns a
grid that is 60% apartments. Content, and George's.

**Also still open: two empty categories.** Services 0, Everything else 0.

**Outstanding and blocking:** `0027` has not been run in the Supabase SQL
editor. Posting a blank price fails at the database until it is, so the
end-to-end walk in note 4 is unverified. The pure logic was proved without it —
`formatPrice(null)` renders nothing, `formatPrice(0)` still renders `$0`, and
unpriced listings sort last.

**Two corrections to this document, found while implementing.**

1. **There are FIVE content widths, not four.** Note 5's table misses
   `/profile`, which is `max-w-[900px]`. The full set: 1400 / 1240 / 1100 /
   1000 / 900.
2. **The `placeOf()` trap had a third victim the note did not list.**
   `/listings/[id]` renders `"Selling in " + placeOf(listing)`, which the
   kicker change turns into "Selling in Furniture". Repointed at
   `neighborhoodOf`, and the clause is now dropped when there is no
   neighborhood — it had been rendering "Selling in Other" all along.

**One new observation, for a later pass.** On a phone the search box now sits
*below* the category chips and the price disclosure, because `FilterRail` is
the first child of the browse grid and the box lives in the content column. It
reads coherently, but a search box conventionally goes on top. Re-ordering it
means moving the form out of the content column on mobile only — a real layout
change, not a tweak, so it was left alone.
