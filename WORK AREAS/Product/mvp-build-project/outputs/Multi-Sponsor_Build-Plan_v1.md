# Multi-Sponsor Slice — Build Plan v1

**Date:** 2026-06-10
**Decision source:** `COMPANY/memory/decisions.md` → Trust mechanic, 2026-06-10 entry.
**Goal:** Move from one-sponsor-per-member to **many sponsors per member**, keep sponsors publicly named on listings, and render them with the **hybrid-at-2** byline.

This is a real schema change to a locked architectural anchor (the single `accounts.sponsor_id`). It is specced here, then handed to Claude Code (separate prompt doc), which pauses for the SQL run before deploying — same pattern as Slices 0010 and 0011.

---

## 1. What changes, in plain English

Today the database lets each member have exactly **one** sponsor — a single column (`accounts.sponsor_id`) pointing at one person, copied onto each listing as a single `sponsor_name`. We're replacing that with a proper one-to-many: a new `sponsorships` table where a member can have any number of sponsors. The listing keeps a cached **list** of sponsor names so the page still reads from one table (fast), and the byline assembles them with the hybrid-at-2 rule.

**The byline rule (hybrid-at-2):**

| Sponsors | Byline reads |
|---|---|
| 0 | `Listed by Marcus` |
| 1 | `Listed by Marcus · sponsored by John R.` |
| 2 | `Listed by Marcus · sponsored by John R. & Sarah K.` |
| 3+ | `Listed by Marcus · sponsored by John R., Sarah K. + 1 more` |

Real names up to two, then a count. The "+ N more" only appears past two sponsors.

---

## 2. Two design calls (my recommendation, George can veto)

**A. Store a list of names, not a pre-built string.**
The listing caches `sponsor_names` as an **array** (`text[]`), ordered primary-sponsor-first. The frontend assembles the "&" / "+ N more" string. Why: the format (the threshold, the punctuation, pluralization) lives in one place — TypeScript — so changing it later is a code edit, not a database re-run. The database stores facts; the page decides how to show them.

**B. Keep `accounts.sponsor_id` as the "primary sponsor" pointer.**
Rather than rip it out, `sponsor_id` stays as the *inviter* — the one sponsor who brought the member in, shown first in the byline. The new `sponsorships` table holds **every** sponsor (including the primary). This keeps the existing column-protection security and the approval flow mostly intact, and gives the byline a stable "who's first" rule. Lowest-risk path to the same outcome.

---

## 3. Schema — migration `0012_multi_sponsor.sql`

> Run by Cowork in the prod Supabase SQL editor (via Chrome) **before** Claude Code deploys, same as 0010/0011.

### 3a. New `sponsorships` table
```sql
create table public.sponsorships (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references public.accounts(id) on delete cascade,
  sponsor_id  uuid not null references public.accounts(id) on delete cascade,
  is_primary  boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (member_id, sponsor_id),         -- can't sponsor someone twice
  check (member_id <> sponsor_id)          -- can't sponsor yourself
);

-- At most one primary (inviter) per member.
create unique index sponsorships_one_primary_per_member
  on public.sponsorships (member_id) where is_primary;

-- Fast lookup of "who sponsors this member" for the byline rebuild.
create index sponsorships_member_idx on public.sponsorships (member_id);
```

**RLS:** enable, **no client policies** — same lockdown as `listing_contacts` (0011). The only write path is the SECURITY DEFINER functions below; the only read path the UI needs is the denormalized `listings.sponsor_names`, so the client never queries this table directly. Reads are admin-only (deferred to the future admin UI).
```sql
alter table public.sponsorships enable row level security;
```

### 3b. Backfill existing sponsor data
```sql
-- Migrate any existing single sponsor_id into the table as the primary.
insert into public.sponsorships (member_id, sponsor_id, is_primary)
select id, sponsor_id, true
  from public.accounts
 where sponsor_id is not null
on conflict (member_id, sponsor_id) do nothing;
```
(Founder's `sponsor_id` is null, so nothing migrates today — written generically for when real sponsored members exist.)

### 3c. Listing column: `sponsor_name` → `sponsor_names text[]`
```sql
alter table public.listings
  add column sponsor_names text[] not null default '{}';

-- Preserve current bylines (incl. the founder's 'John Robinson' placeholder).
update public.listings
   set sponsor_names = case
         when sponsor_name is null or sponsor_name = '' then '{}'
         else array[sponsor_name]
       end;

alter table public.listings drop column sponsor_name;
```
> ⚠️ Dropping `sponsor_name` means every TypeScript reference must move to `sponsor_names` **in the same slice** (Section 4). Claude Code does this before deploy so prod never sees a mismatch.

### 3d. Helper: rebuild a member's cached sponsor names
One function both triggers reuse — recomputes the ordered array for every listing a member authored.
```sql
create or replace function public.rebuild_sponsor_names(p_member_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_names text[];
begin
  select array_agg(a.name order by s.is_primary desc, s.created_at asc)
    into v_names
    from public.sponsorships s
    join public.accounts a on a.id = s.sponsor_id
   where s.member_id = p_member_id
     and a.name is not null;

  update public.listings
     set sponsor_names = coalesce(v_names, '{}')
   where author_id = p_member_id;
end;
$$;
revoke all on function public.rebuild_sponsor_names(uuid) from public;
```

### 3e. Rework the BEFORE INSERT byline trigger (replaces 0006's body)
`populate_listing_byline()` keeps setting `author_name`, but now assembles `sponsor_names` from the table:
```sql
create or replace function public.populate_listing_byline()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  v_author_name text;
  v_names       text[];
begin
  select name into v_author_name from public.accounts where id = new.author_id;

  select array_agg(a.name order by s.is_primary desc, s.created_at asc)
    into v_names
    from public.sponsorships s
    join public.accounts a on a.id = s.sponsor_id
   where s.member_id = new.author_id
     and a.name is not null;

  new.author_name   := v_author_name;
  new.sponsor_names := coalesce(v_names, '{}');
  return new;
end;
$$;
```
(The existing `listings_populate_byline_on_insert` trigger keeps pointing at this function — only the body changes.)

### 3f. Propagation triggers
**Sponsorship added/removed** → rebuild that member's listings:
```sql
create or replace function public.sponsorship_changed()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  perform public.rebuild_sponsor_names(coalesce(new.member_id, old.member_id));
  return null;
end;
$$;
revoke all on function public.sponsorship_changed() from public;

create trigger sponsorships_refresh_byline
  after insert or delete on public.sponsorships
  for each row execute function public.sponsorship_changed();
```

**Account name changed** → refresh own listings' `author_name` AND the bylines of everyone this person sponsors. Replace 0006's `propagate_account_changes_to_listings()`:
```sql
create or replace function public.propagate_account_changes_to_listings()
returns trigger language plpgsql security definer set search_path = public
as $$
declare r record;
begin
  if new.name is distinct from old.name then
    update public.listings set author_name = new.name where author_id = new.id;
    -- Rebuild bylines for everyone this account sponsors (their name appears there).
    for r in select member_id from public.sponsorships where sponsor_id = new.id loop
      perform public.rebuild_sponsor_names(r.member_id);
    end loop;
  end if;

  -- sponsor_id (the primary pointer) changed → keep the table in sync, then rebuild.
  if new.sponsor_id is distinct from old.sponsor_id then
    delete from public.sponsorships where member_id = new.id and is_primary;
    if new.sponsor_id is not null then
      insert into public.sponsorships (member_id, sponsor_id, is_primary)
      values (new.id, new.sponsor_id, true)
      on conflict (member_id, sponsor_id) do update set is_primary = true;
    end if;
    perform public.rebuild_sponsor_names(new.id);
  end if;
  return new;
end;
$$;
```
(The `accounts_propagate_byline_changes` trigger from 0006 keeps its WHEN clause and points at this updated function.)

### 3g. Seed-phase: add an extra sponsor
Lets George actually create 2- and 3-sponsor members to test the byline (and is the real "add a sponsor" path until an admin UI exists).
```sql
create or replace function public.add_sponsor(
  p_member_id uuid, p_sponsor_id uuid, p_is_primary boolean default false
)
returns void language plpgsql security definer set search_path = public
as $$
begin
  if p_member_id = p_sponsor_id then raise exception 'A member cannot sponsor themselves'; end if;
  if not exists (select 1 from public.accounts where id = p_member_id and is_member) then
    raise exception 'Member % is not a member', p_member_id; end if;
  if not exists (select 1 from public.accounts where id = p_sponsor_id and is_member) then
    raise exception 'Sponsor % is not a member', p_sponsor_id; end if;

  if p_is_primary then
    update public.sponsorships set is_primary = false where member_id = p_member_id and is_primary;
  end if;

  insert into public.sponsorships (member_id, sponsor_id, is_primary)
  values (p_member_id, p_sponsor_id, p_is_primary)
  on conflict (member_id, sponsor_id) do update set is_primary = excluded.is_primary;
  -- trigger rebuilds the byline cache.
end;
$$;
revoke all on function public.add_sponsor(uuid, uuid, boolean) from public;
```

### 3h. Rework `approve_application()` (migration 0008)
On approval, also write a **primary sponsorship row** so the byline lights up. Keep writing `accounts.sponsor_id` (primary pointer) — the 3f sync keeps the table consistent, but write the row explicitly too for clarity:
```sql
  -- (inside the existing transaction, after the sponsor "is a member" check)
  update public.accounts set is_member = true, sponsor_id = p_sponsor_id where id = v_account_id;

  insert into public.sponsorships (member_id, sponsor_id, is_primary)
  values (v_account_id, p_sponsor_id, true)
  on conflict (member_id, sponsor_id) do update set is_primary = true;
```
**Minimum-sponsor floor:** approval grants exactly 1 sponsor (the founder default during seed), so **min-1 holds today**. To raise the floor to 2 later, the apply/approve flow must collect and record a second sponsor before flipping `is_member` — that's a future slice. Mark the spot with a comment: `-- MIN_SPONSORS = 1 (raise to 2 when the multi-sponsor apply flow lands)`.

---

## 4. Frontend changes

Both listing pages select and render the byline. Change the column, the type, and the render function.

**`app/listings/page.tsx`** and **`app/listings/[id]/page.tsx`:**
- `.select(...)`: replace `sponsor_name` with `sponsor_names`.
- Type: `sponsor_name: string | null` → `sponsor_names: string[]`.
- Replace `renderByline` in both files (keep it identical between them, or lift to a shared `lib/listings/byline.ts`):

```ts
// lib/listings/byline.ts  (new shared helper — both pages import it)
const SPONSOR_NAME_LIMIT = 2; // hybrid-at-2: show up to 2 names, then "+ N more"

export function renderByline(
  authorName: string | null,
  sponsorNames: string[] | null
): string {
  const author = `Listed by ${authorName ?? "a member"}`;
  const names = sponsorNames ?? [];
  if (names.length === 0) return author;
  return `${author} · sponsored by ${formatSponsors(names)}`;
}

function formatSponsors(names: string[]): string {
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  const shown = names.slice(0, SPONSOR_NAME_LIMIT).join(", ");
  return `${shown} + ${names.length - SPONSOR_NAME_LIMIT} more`;
}
```

- Delete the per-file `renderByline` copies; import the shared one. (Removes the current duplication across the two pages.)

**`lib/listings/create.ts`:** no functional change — the BEFORE INSERT trigger still sets the byline, the client never sends sponsor names. Just confirm no type references the dropped `sponsor_name`.

**Grep guard before deploy:** `grep -rn "sponsor_name\b" app lib` must return nothing referencing the old singular column (only `sponsor_names` / `sponsor_id` remain).

---

## 5. Test loop (prod, mirrors Slice 0011)

A `tsx` harness against prod Supabase + a synthetic member (Gmail plus-alias), founder untouched:

1. **1 sponsor:** approve a synthetic applicant (founder default) → post a listing → byline reads `Listed by [name] · sponsored by George Gardner`.
2. **2 sponsors:** stand up a second synthetic member, `add_sponsor(member, member2)` → re-check the member's listing → `... sponsored by George Gardner & [member2]`.
3. **3 sponsors:** add a third → `... sponsored by George Gardner, [member2] + 1 more`.
4. **Rename propagation:** rename a sponsor account → that name updates in the sponsored member's byline.
5. **Remove a sponsor:** delete a sponsorship row → byline recomputes (count drops).
6. **Order:** primary (inviter) always renders first.
7. **Cleanup:** delete synthetic `auth.users` rows → cascade clears accounts + listings + sponsorships → **0 synthetic rows, founder untouched** (`is_member=true`, no real sponsor).
8. **Guest/anon page render:** `/listings` still renders (teaser) with the new array column.

---

## 6. Run order

1. Claude Code writes `0012_multi_sponsor.sql` + the frontend changes + the test harness, commits, **pauses**.
2. Cowork runs `0012` in the prod Supabase SQL editor via Chrome; confirms the verify queries.
3. Claude Code pushes → Vercel deploys → runs the prod test harness → reports green.
4. Reconcile: mark SHIPPED in `mvp-build-project/memory.md` + a `session-log.md` entry.

---

## 7. Out of scope (flag, don't build)

- **Min-2 enforcement / multi-sponsor apply flow** — the floor stays at 1 this slice; raising it needs an apply flow that collects a second sponsor. Future.
- **Member-facing "add a sponsor" UI** — seed-phase uses `add_sponsor()` from SQL. Admin/member UI is later.
- **Showing the sponsor chain / degrees of connection** (GDC's "how you're connected") — v2 trust-graph work.
- **Reconciling root `CLAUDE.md`** to the new model — separate doc pass.
