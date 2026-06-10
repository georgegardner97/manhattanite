# Multi-Sponsor Slice — Claude Code hand-off prompt v1

Paste everything below the line into Claude Code, running in the `manhattanite` repo.

The full spec is in `WORK AREAS/Product/mvp-build-project/outputs/Multi-Sponsor_Build-Plan_v1.md` — read it first.

---

You are building the **Multi-Sponsor slice** for Manhattanite. Read `WORK AREAS/Product/mvp-build-project/outputs/Multi-Sponsor_Build-Plan_v1.md` in full before writing anything, plus `AGENTS.md` (Next 16 breaking changes) and migrations `0001_accounts.sql`, `0006_listings_byline_denorm.sql`, `0008_approve_application.sql`.

**Goal:** replace the one-sponsor-per-member model with many-sponsors-per-member. A new `sponsorships` table is the source of truth; `listings.sponsor_name text` becomes `sponsor_names text[]` (ordered, primary inviter first); the byline renders with the hybrid-at-2 rule (1 → name; 2 → "A & B"; 3+ → "A, B + N more"). Keep `accounts.sponsor_id` as the primary-sponsor pointer.

## What to build

1. **`supabase/migrations/0012_multi_sponsor.sql`** — exactly per Build Plan §3:
   - `sponsorships` table (member_id, sponsor_id, is_primary, created_at; unique(member_id,sponsor_id); check member_id<>sponsor_id; partial-unique one primary per member; member_id index). RLS **on, no client policies**.
   - Backfill existing `accounts.sponsor_id` → primary sponsorship rows.
   - `listings`: add `sponsor_names text[] not null default '{}'`, backfill from the old `sponsor_name` (array-wrap non-null, preserve the founder's 'John Robinson' placeholder), then **drop `sponsor_name`**.
   - `rebuild_sponsor_names(member_id)` helper (SECURITY DEFINER).
   - Rework `populate_listing_byline()` to assemble `sponsor_names` from `sponsorships` (order: `is_primary desc, created_at asc`).
   - `sponsorship_changed()` trigger (AFTER INSERT OR DELETE on sponsorships) → rebuild.
   - Rework `propagate_account_changes_to_listings()` for name changes (own + sponsored members) and `sponsor_id` changes (sync the primary row, then rebuild).
   - `add_sponsor(member_id, sponsor_id, is_primary)` SECURITY DEFINER seed helper.
   - Amend `approve_application()` to also insert a primary sponsorship row. Add the comment `-- MIN_SPONSORS = 1 (raise to 2 when the multi-sponsor apply flow lands)`.
   - End with verify queries (table exists, triggers exist, a sample byline array).

2. **`lib/listings/byline.ts`** (new) — the shared `renderByline(authorName, sponsorNames)` + `formatSponsors` with `SPONSOR_NAME_LIMIT = 2`, per Build Plan §4.

3. **`app/listings/page.tsx`** and **`app/listings/[id]/page.tsx`:**
   - `.select(...)`: `sponsor_name` → `sponsor_names`.
   - Types: `sponsor_name: string | null` → `sponsor_names: string[]`.
   - Delete each file's local `renderByline`; import the shared one from `lib/listings/byline.ts`.

4. **Guard:** `grep -rn "sponsor_name\b" app lib` must return **nothing** referencing the dropped singular column (only `sponsor_names` / `sponsor_id`). Fix any stragglers.

5. **Test harness** (`scripts/`, `tsx`) per Build Plan §5 — does NOT run yet (needs the migration live).

## CRITICAL — stop and wait

After writing the migration + frontend + harness and committing, **STOP and tell me the slice is ready for the `0012` SQL run.** Do **not** deploy. Cowork runs `0012` in the prod Supabase SQL editor first (the frontend drops `sponsor_name`, so deploying before the column move would break prod). 

When I confirm the SQL is applied, then: push → let Vercel deploy → run the test harness against prod → report results.

## Guardrails

- **Trust layer is load-bearing.** RLS on `sponsorships` with no client policies; all writes via SECURITY DEFINER functions only. Never weaken it for convenience.
- **Founder must end untouched** by every test (`is_member=true`, no real sponsor; the 'John Robinson' placeholder is a demo string, fine to keep).
- **American spelling** in any user-facing copy.
- Two clean commits if it helps (migration+backend, then frontend), but the frontend and the `sponsor_name` drop must land together at deploy.
- If anything in the plan looks wrong against the actual code, **stop and flag it** — don't improvise around a mismatch.
