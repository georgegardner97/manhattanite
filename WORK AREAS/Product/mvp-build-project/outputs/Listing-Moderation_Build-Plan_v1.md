# Listing Moderation Slice — Build Plan v1

**Date:** 2026-06-12
**Decision (George, 2026-06-12):** **Pre-moderation.** Every new listing must be reviewed by an admin before it goes public. Nothing reaches the network without a human yes — quality and trust are enforced by the mechanism, not just the brand voice. This is the 4th admin view in `mvp-spec.md` ("Listing moderation queue") and the last big v1 feature.

## The core idea, plainly

Today a new listing goes live the instant it's posted. After this slice: a new listing is **`pending`** (in review) and invisible to the network until an admin **approves** it. The admin gets a moderation queue where each pending listing can be **Approved** (→ published), **Returned** to the poster with a note (→ back to draft, member edits + resubmits), or **Rejected/Removed** (→ archived with a note).

## The one trust-critical rule

**A member must never be able to publish their own listing.** This cannot be enforced in the UI alone — a member could call the Supabase API directly. So status transitions are governed at the **database** layer:

- A **BEFORE UPDATE trigger** decides which status changes each caller may make.
- **Publishing is admin-only**, via a SECURITY DEFINER function (same pattern as `approve_application`).

## Status model

Extend the `listings.status` check to four values:

| Status | Meaning | Visible to network? | Visible to owner? |
|---|---|---|---|
| `pending` | Submitted, awaiting review | No | Yes ("In review") |
| `published` | Approved, live | Yes | Yes ("Live") |
| `draft` | Returned by admin with feedback; editable, resubmittable | No | Yes ("Needs changes" + note) |
| `archived` | Taken down (by member or admin) | No | Yes ("Archived") |

New listings are created as **`pending`** (was `published`). Existing founder listings stay `published` — pre-moderation only affects new posts.

### Allowed status transitions

| From → To | Who | How |
|---|---|---|
| (new) → `pending` | member | posting a listing |
| `pending` → `published` | **admin only** | `approve_listing()` |
| `pending` → `draft` | admin | `return_listing(note)` — return with feedback |
| `pending`/`published` → `archived` | admin | `reject_listing(note)` — remove with reason |
| `published`/`pending` → `archived` | member (own) | the existing Remove (archive) action |
| `draft` → `pending` | member (own) | resubmit after addressing feedback |
| same → same | member (own) / admin | content edit (title/price/etc.) |
| anything → `published` | member | **BLOCKED** (the whole point) |

## Schema — migration `0017_listing_moderation.sql`

> Applied to prod by Cowork via the SQL editor (same as 0012–0016), then the harness runs.

1. **Add `pending` to the status check** (and keep `draft`):
   ```sql
   alter table public.listings drop constraint listings_status_check;
   alter table public.listings add constraint listings_status_check
     check (status in ('draft','pending','published','archived'));
   ```
   (Confirm the constraint's real name first — `select conname from pg_constraint where conrelid='public.listings'::regclass and contype='c';`)

2. **Add `moderation_note text`** (nullable) — the admin's feedback when returning/rejecting; shown to the owner.

3. **Status-transition guard** — `BEFORE UPDATE` trigger `enforce_listing_status_transition()`:
   - `auth.uid()` is null (service role/seed) **or** caller `is_admin()` → allow any change.
   - else (member): allow if `NEW.status = OLD.status` (content edit), OR `OLD.status IN ('pending','published') AND NEW.status='archived'` (take down), OR `OLD.status='draft' AND NEW.status='pending'` (resubmit). Anything else (especially `→ published`) → `raise exception 'not allowed: members cannot make that status change' using errcode='42501'`.
   - SECURITY DEFINER, owned by postgres.

4. **Simplify the owner UPDATE policy** (`listings_write_member_own_update`): drop the `status IN (...)` allowlist from its WITH CHECK — keep just `author_id = auth.uid() AND is_member()`. The trigger now owns all status-transition logic (cleaner separation: RLS = "may you touch this row", trigger = "is this transition legal"). Recreate the policy.

5. **Admin moderation functions** (SECURITY DEFINER, admin-guarded exactly like 0015, granted to `authenticated` + `service_role`):
   - `approve_listing(p_listing_id uuid)` → `pending` → `published`. Errors if not pending.
   - `return_listing(p_listing_id uuid, p_note text)` → `pending` → `draft`, sets `moderation_note`.
   - `reject_listing(p_listing_id uuid, p_note text)` → `pending`/`published` → `archived`, sets `moderation_note`.
   - Each opens with the same admin guard: `if auth.uid() is not null and not exists(select 1 from accounts where id=auth.uid() and role='admin') then raise 'not authorized' using errcode='42501'; end if;`

6. Verify queries (constraint includes `pending`; trigger exists; 3 functions executable by `authenticated`; policy WITH CHECK no longer pins status).

## Frontend

- **`lib/listings/create.ts`** — new listings insert `status: 'pending'` (was `'published'`).
- **`/listings/new` confirmation copy** — replace "live" messaging with review-aware copy from `COMPANY/voice-and-copy.md` tone, e.g. "Your listing is in review. We'll let you know once it's live." (pull/确认 exact wording from voice-and-copy.md).
- **`/listings/mine`** — drop the `.eq('status','published')` filter; show **all** of the member's own listings (the `listings_read_own` policy covers this), each with a status badge: *In review* / *Live* / *Needs changes* / *Archived*. For `draft` (returned) listings, show the `moderation_note` and a **Resubmit** control (calls an action that sets `draft → pending`). Keep the Edit/Remove controls from the Edit & Remove slice.
- **`lib/listings/resubmit.ts`** (new) — server action: own + member, sets `draft → pending` (the trigger allows this transition).
- **`app/admin/moderation/page.tsx`** (new) — the queue. Admin-gated (mirror `/admin` gating). Lists `status='pending'` listings with full detail (title, type, price, description, images, author byline). Per listing: **Approve**, **Return with note**, **Reject with note**.
- **`lib/admin/moderate.ts`** (new) — server actions calling `approve_listing` / `return_listing` / `reject_listing` via `rpc()` as the authenticated admin (mirror `lib/admin/review.ts`).
- **`/admin` dashboard** — add a "pending review" count and a link to `/admin/moderation`. (`SiteNav` already has the admin link.)

## Test harness (`scripts/test-listing-moderation.ts`, prod, mirror the others)

Synthetic admin + synthetic member, auto-cleanup, founder untouched:

1. Member posts → row is `pending`; **not** returned by the public/anon browse query; **is** visible to the owner on a `listings_read_own` read.
2. **Member CANNOT self-publish** — a direct `update status='published'` as the member raises (trigger). *(This is the key security assertion.)*
3. Admin `approve_listing` → `published`; now visible on public browse.
4. Admin `return_listing(note)` on a fresh pending listing → `draft` + note; member resubmits (`draft→pending`) successfully.
5. Admin `reject_listing(note)` → `archived` + note.
6. Non-admin authenticated user **cannot** call any of the three functions (admin guard).
7. Member archive of own (published) listing still works (regression with the new trigger).
8. Cleanup → 0 synthetic rows; founder's 3 published listings untouched.

## Run order

1. Claude Code builds the migration + frontend + harness, then **pauses** for the `0017` SQL run.
2. Cowork applies `0017` in the prod SQL editor; confirms verify queries.
3. Claude Code re-runs the harness against prod; if green, commits + pushes; Vercel deploys.
4. Live check: post a listing (goes to review, not public), approve it from `/admin/moderation`, confirm it appears on browse; return + reject paths.
5. Reconcile memory + session log; re-run the RLS audit query (this slice adds a trigger + 3 functions + touches the update policy) to confirm prod still matches the repo.

## Out of scope (flag, don't build)

- Email notifications to the poster on approve/return/reject (nice-to-have; v1.1).
- Bulk moderation actions; moderation history/audit log UI (rows carry status + note now; a log view is later).
- Auto-curation / trust-score-based skip-the-queue (v2).
