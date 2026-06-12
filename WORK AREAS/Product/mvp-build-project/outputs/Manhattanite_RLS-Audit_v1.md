# Manhattanite — RLS Reconcile Audit v1

**Date:** 2026-06-12 (run by Cowork via the Supabase SQL editor, reading live prod `pg_policy`)
**Trigger:** three RLS surprises surfaced on `listings` during the Edit & Remove + Admin Console slices (a hand-applied status-pin, an open member-delete policy, and a missing owner-SELECT). This audit checks whether prod's row-level security matches what the repo migrations declare, so the next slice (listing-moderation) builds on solid ground.

## Verdict

**Prod RLS matches the repo exactly. No drift remains. No reconcile migration needed.**

- Structural diff of every `public`-schema policy (name + command) against the repo's declared set → **0 discrepancies** (no prod-only stray policies, none missing, no command mismatches).
- RLS is **enabled on all five app tables** (`accounts`, `listings`, `applications`, `listing_contacts`, `sponsorships`) — none left exposed.
- `listing_contacts` and `sponsorships` have **0 client policies** (locked down — writes only via SECURITY DEFINER functions), as intended.
- `storage.objects` has the **3 declared listing-image policies**.

The three historical drifts are all resolved: the `listings` update WITH CHECK status-pin and the open member-delete were closed by `0014`; the missing owner-SELECT was added by `0016`.

## Authoritative policy inventory (prod == repo, as of 2026-06-12)

**`public.accounts`** — RLS on, 4 policies
- `accounts: read own row` (SELECT) — `auth.uid() = id`
- `accounts: update own row` (UPDATE)
- `accounts: admin reads all` (SELECT) — admin, via the non-recursive helper (0002)
- `accounts: admin updates all` (UPDATE) — admin

**`public.listings`** — RLS on, 6 policies, **no DELETE policy** (soft-delete only)
- `listings_read_published_for_accounts` (SELECT) — `status='published' AND auth.uid() IS NOT NULL`
- `listings_read_published_for_anon` (SELECT) — `status='published'` (teaser, 0010)
- `listings_admin_read_all` (SELECT) — `is_admin()` (0015)
- `listings_read_own` (SELECT) — `author_id = auth.uid()` (0016 — lets owners see their own archived/draft rows)
- `listings_write_member_own_insert` (INSERT) — `author_id = auth.uid() AND is_member()`
- `listings_write_member_own_update` (UPDATE) — own + member + `status IN ('published','archived')` (0014)

**`public.applications`** — RLS on, 4 policies
- `applications: insert own when not member` (INSERT)
- `applications: read own` (SELECT)
- `applications: admin reads all` (SELECT)
- `applications: admin updates all` (UPDATE)

**`public.listing_contacts`** — RLS on, **0 client policies** (function-only writes, admin reads deferred)

**`public.sponsorships`** — RLS on, **0 client policies** (function-only writes)

**`storage.objects`** (listing-images bucket) — 3 policies
- `listing_images_member_upload` (INSERT), `listing_images_authenticated_read` (SELECT), `listing_images_owner_delete` (DELETE)

## How this was checked (repeatable)

1. Extracted the repo's intended end-state by parsing every `create policy` / `drop policy` / `enable row level security` across `supabase/migrations/0001`–`0016` (net effect, last definition wins).
2. Read live prod policies from `pg_policy` joined to `pg_class`/`pg_namespace` (schemas `public` + `storage`).
3. Ran a structural symmetric-difference query (prod vs expected) → 0 rows.
4. Confirmed RLS-enabled flags on the five app tables and the storage image policies.

## Note for the future

Migrations in this repo are applied **by hand in the SQL editor**, not by `supabase db push`, so the repo files are the source-of-truth-if-rebuilt but are not auto-tracked against prod. The drift we hit came from hand-applied SQL that never made it into a migration file. Going forward: every prod policy change should land as a numbered migration file in the same change, and a quick re-run of this audit after any RLS-touching slice keeps prod and repo honest.
