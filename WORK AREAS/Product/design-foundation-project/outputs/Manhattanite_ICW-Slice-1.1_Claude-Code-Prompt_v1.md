# Claude Code prompt — ICW redesign, Slice 1.1: nav fix + browse layout revision

*Paste everything below the line into Claude Code (repo: `~/Developer/manhattanite`, branch `main`). Small corrective slice from George's review of Slice 1 on prod. Do this before Slice 2.*

---

Three changes from founder review of the live Slice 1. Styling/layout only, except item 1 which fixes a navigation-visibility bug.

## 1. Fix the disappearing top nav (bug)

**Symptom:** land on `/` (nav correctly absent — the hero has its own), click "→ Browse the network" or any listing → arrive on `/listings` with **no top nav at all**. Direct loads of `/listings` show the nav fine.

**Likely cause:** SiteNav's visibility is decided server-side from the `x-pathname` header set in `proxy.ts`. The root layout doesn't re-render on client-side navigations, so the initial `/` decision (hide) sticks for the whole SPA session.

**Fix properly:** move the show/hide decision to the client. Keep SiteNav's data/tier logic wherever it lives, but wrap its rendering in a small client component that reads `usePathname()` and returns null on `/` only. Remove the `x-pathname` header plumbing from `proxy.ts` if nothing else uses it. Verify by clicking landing → browse → detail → back — nav must be present everywhere except `/`, in both directions, without a hard refresh.

## 2. Browse page title

Replace "The network, today." with **"Today's listings."** — same serif, same size. (Sentence case per the brand guide's New Yorker-style heading rule; if George later wants "Today's Listings" title case, it's one string.)

## 3. Browse layout: fixed category rail on the left (In Common With products-page pattern)

George's reference: ICW's All Products page — category list pinned left, product grid scrolling on the right.

Rework `/listings`:

1. **The left label column becomes a category rail.** Same 220px column the section grammar already reserves. Contents, stacked:
   - "LISTINGS" small-caps label (as now)
   - then the category links, vertical list, one per line: All, Apartments, Furniture, Other, Services — 14px Inter, generous line spacing. Active item: ink, with a small leading marker (a 4px park-green dot or an en-dash, ICW-style bullet); inactive: slate, hover ink.
   - Keep them as the same `?type=` links/behavior as the current filter row — presentation change only.
2. **The rail is sticky:** `position: sticky` under the nav (top offset = nav height + ~24px), so categories stay on screen while the listing grid scrolls.
3. **Content column:** "Today's listings." serif title at top, then the card grid exactly as it is (2-up, current gaps). The old horizontal filter row under the title is removed — the rail replaces it.
4. **Mobile (<860px):** the rail doesn't stick or stack as a tall list — collapse back to the horizontal scrollable filter row under the title (what exists today), so phones lose nothing.
5. Guest teaser, member view, `?type=` filtering, EXAMPLE tags: all unchanged in behavior.

## Verify

1. The nav-visibility click-path test in item 1 (landing → browse → detail → back, no hard refreshes).
2. Desktop: rail stays fixed while cards scroll; active category marker correct on each `?type=`.
3. ~390px: horizontal filter row returns, no sticky artifacts, no horizontal overflow.
4. `npm run build` clean; commit, push, verify on prod including the click-through-from-landing path.

## Report back

Screenshots of browse (desktop with rail mid-scroll, mobile), confirmation of the nav fix on the click path, and anything the sticky rail fought with.
