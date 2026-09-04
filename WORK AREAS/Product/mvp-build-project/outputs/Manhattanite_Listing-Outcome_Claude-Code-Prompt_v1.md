# Claude Code prompt — the takedown outcome (0031)

Paste everything below the line into Claude Code, in the manhattanite repo.

---

Build the takedown-outcome question. George's words, 2 Sep 2026: *"it would be useful for when a listing is taken down for there to be a choice — was this listing fulfilled? So that we have data on what was working and what wasn't."*

Read `supabase/migrations/0031_listing_outcome.sql` first — it is already written, already in the repo, and its header comment carries the full reasoning for the four values, for why NULL is meaningful, and for why there is no RLS change. **Do not restate that reasoning in code comments; reference it.** Check whether it has been applied (probe `outcome` on a `listings` select) before assuming either way — George runs migrations by hand in the Supabase SQL editor and may or may not have run this one yet. If it has not been applied, say so and stop before touching the app code, because nothing below can be verified against a column that does not exist.

## The single design decision, which is the whole point

**The answer IS the confirmation. There is no separate survey.**

`app/components/cl/ClRemoveListing.tsx` already has a two-step flow: a "Take this listing down" button reveals a confirm step whose primary control is one button reading "Yes, take it down". **Replace that one button with four**, each a `type="submit"` carrying `name="outcome"` and its own `value`. The browser includes only the clicked submitter's name/value in the FormData, so the choice arrives in the server action with no client state and no extra field.

This matters because it is what makes the data trustworthy. A skippable question after the fact gets answered by nobody; a required extra step gets answered dishonestly by people trying to leave. Choosing the reason being the only way to complete the takedown costs the member zero extra taps and gets close to a 100% response rate.

Button copy, in this order:

1. `found_here` — "Found its person here"
2. `found_elsewhere` — "Sorted, but not through Manhattanite"
3. `withdrawn` — "Changed my mind"
4. `no_luck` — "No luck — nobody suitable"

Keep "Keep it" as the escape, exactly as it is now. Four red-accented submit buttons in a row is visually heavy — these should read as a list of choices, not four destructive actions. Use the system's own furniture (`cl-ghost`, the `--cl-red` accent reserved for the genuinely destructive one if any) and make the layout a vertical stack on narrow viewports. The design file has no treatment for this screen, so the rules are the system's own, same as the note at the top of `ClRemoveListing.tsx` says.

## Pending listings do not get asked

If `status === "pending"` the listing was never published, so it cannot have found anyone. Keep the current single "Yes, take it down" button for that case and write no outcome. The component already branches on `status` for its copy — extend that branch rather than adding a second one.

## Server action

`lib/listings/archive.ts`:

- Read `outcome` off the FormData.
- **Validate against the four literals and reject anything else** — do not pass a string through to the database and rely on the check constraint to catch it. An unknown value should be treated as absent (write null) rather than erroring the takedown: a member should never be blocked from removing their own listing because of a malformed form post.
- Write it in the SAME update that flips `status` to `archived`. One statement, not two — a takedown that succeeds and then fails to record why is worse than either outcome alone.
- The header comment currently says "status is the ONLY column written". That is about to be false. Update it.
- Everything else stays: the ownership pre-check, no `.select()`, the three `revalidatePath` calls and `updateTag("listings")`.

## Admin path is untouched

`/admin/listings` archives through `adminArchiveListing` → the `admin_archive_listing` RPC, with its own required moderation note. **Do not add an outcome there.** A founder removing somebody's listing is a moderation event, not the member reporting a result. Its rows keep `outcome` null and that null is meaningful — the migration header explains why.

## Surface it where George can read it

Add the outcome to the archived rows on `/admin/listings` (`ClAdminListingRow.tsx` or its parent page, whichever holds the row's meta line). Plain text, no chip, no colour coding — this is data he is reading, not a status a member is being judged by. A null on a member-archived row should render as nothing at all, never as "Unknown", because the three populations that produce a null are not the same thing.

Do not build a dashboard, a chart, or a rate. With one published listing on the network, any percentage would be noise, and the aggregate view is a separate decision for when there is something to aggregate.

## Constraints you must not break

- **`ClRemoveListing` renders its own `<form>` and must never end up nested in another.** `checkNotInForm()` in `scripts/audit-gates.ts` is the guard; the component's header comment explains the fortnight this cost. Four submit buttons inside the existing form is fine — a second form is not.
- **Guest anonymity is untouched by this work.** `cardMeta()` in `lib/cl/listings-read.ts` is the enforcement point for who gets named, and nothing here goes near it. If a change you make would touch it, stop and say so.
- No new RLS policy. The migration header says why: `outcome` rides on `listings_write_member_own_update` (0014), the same policy that permits the status flip.

## Verify, and report the numbers

- `next build` exits 0 — the check that cannot be run from Cowork, which is why this is a Claude Code job.
- `tsc --noEmit` clean.
- `eslint` — **the baseline is 5 errors, not 4.** Confirmed on 31 Aug by stashing and re-running: `ClListingCard`'s `react-hooks/static-components` error prints two source locations and had been miscounted. Report the count and whether it moved.
- `npm run audit:gates` — the guest-route and name-leak assertions, plus `checkNotInForm()`.
- **Exercise the real thing, do not trust the diff.** Create a fixture listing per status, sign in as a real member, take one down with each of the four buttons, and read `outcome` back off the row each time. Then take a `pending` one down and confirm it wrote null and never showed the four buttons. Tear the fixtures down afterwards and leave the seed-free production data as you found it — **there are currently 3 listings and 3 accounts in prod, and one of the accounts (Emma Kanne) is a real member.**

## When it is done

Commit code and docs separately, push, and confirm against manhattanite.com. Then log to all four memory files — `COMPANY/memory.md`, `COMPANY/memory/decisions.md`, `COMPANY/memory/session-log.md`, and `WORK AREAS/Product/mvp-build-project/memory.md`. A code session that only updates its own project memory leaves Cowork blind to decisions that were strategic, and this one is: it is the first thing the product measures about whether it works.
