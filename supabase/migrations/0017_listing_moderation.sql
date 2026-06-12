-- Migration 0017: listing moderation — pre-moderation of new listings (PROPOSED — NOT YET APPLIED)
-- Listing Moderation slice — the last big v1 feature.
--
-- STATUS: DRAFT. Do not treat as applied until George runs it in the SQL
-- editor and scripts/test-listing-moderation.ts goes green against prod.
--
-- Decision (George, 2026-06-12): PRE-MODERATION. Every new listing is reviewed
-- by an admin before it goes public. Nothing reaches the network without a
-- human yes.
--
-- The one trust-critical rule: A MEMBER MUST NEVER BE ABLE TO PUBLISH THEIR
-- OWN LISTING. Enforced here, at the database layer — the UI checks are only
-- the polite layer on top.
--
-- Plain English, what this does:
--   1. Adds 'pending' (in review) to the allowed listing statuses. The four
--      states: pending (in review) / published (live) / draft (returned with
--      feedback) / archived (taken down). Probed prod 2026-06-12: the check
--      constraint IS named listings_status_check (matches 0003), 'pending' is
--      currently rejected, moderation_note and the three functions below don't
--      exist yet — this migration is needed and the names are right.
--   2. Adds moderation_note — the admin's feedback when returning/rejecting a
--      listing; shown to the owner on /listings/mine.
--   3. Adds a status-transition guard trigger. For service-role and admin
--      callers, anything goes. For members: content edits (status unchanged),
--      taking down their own listing (pending/published → archived), and
--      resubmitting after feedback (draft → pending). Everything else —
--      especially anything → published — raises 42501.
--      NOTE — one deliberate addition beyond the build plan: the trigger fires
--      BEFORE INSERT as well as BEFORE UPDATE. The plan specced UPDATE only,
--      but the insert RLS policy doesn't pin status, so a member could have
--      POSTed a row with status='published' straight through the API and
--      skipped review entirely. Members may only INSERT with status='pending'.
--      Same rule, same trigger, both doors closed.
--   4. Recreates the owner UPDATE policy without the status allowlist that
--      0014 added. Clean separation from here on: RLS answers "may you touch
--      this row" (own row + member), the trigger answers "is this status
--      transition legal".
--   5. Adds the three admin moderation functions (SECURITY DEFINER, the same
--      admin guard + grant pattern as 0015's review functions):
--        approve_listing(id)        pending → published (clears the note)
--        return_listing(id, note)   pending → draft, with feedback
--        reject_listing(id, note)   pending/published → archived, with reason
--
-- Existing listings are untouched: the founder's published rows stay
-- published. Pre-moderation only affects writes from here on.

-- ---------------------------------------------------------------------------
-- 1. Status check: add 'pending' (keep 'draft')
-- ---------------------------------------------------------------------------
alter table public.listings drop constraint listings_status_check;
alter table public.listings add constraint listings_status_check
  check (status in ('draft', 'pending', 'published', 'archived'));

-- ---------------------------------------------------------------------------
-- 2. moderation_note — admin feedback, shown to the owner
-- ---------------------------------------------------------------------------
alter table public.listings add column moderation_note text;

-- ---------------------------------------------------------------------------
-- 3. Status-transition guard (BEFORE INSERT OR UPDATE)
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER so the accounts role lookup bypasses RLS (the function is
-- owned by postgres, the table owner) — same stance as the 0015 guards. The
-- role subquery is fine INSIDE a definer function; policies must keep using
-- the is_admin()/is_member() helpers (0002 recursion post-mortem).
create or replace function public.enforce_listing_status_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Service-role / SQL-editor path (no JWT) or a signed-in admin: any change.
  if auth.uid() is null or exists (
    select 1 from public.accounts where id = auth.uid() and role = 'admin'
  ) then
    return new;
  end if;

  -- Member INSERT: new listings start in review. Nothing is born published.
  if tg_op = 'INSERT' then
    if new.status = 'pending' then
      return new;
    end if;
    raise exception 'not allowed: new listings start in review'
      using errcode = '42501';
  end if;

  -- Member UPDATE: the three legal moves.
  if new.status = old.status then
    return new;                                      -- content edit
  end if;
  if old.status in ('pending', 'published') and new.status = 'archived' then
    return new;                                      -- take down own listing
  end if;
  if old.status = 'draft' and new.status = 'pending' then
    return new;                                      -- resubmit after feedback
  end if;

  -- Everything else — above all, anything → 'published'.
  raise exception 'not allowed: members cannot make that status change'
    using errcode = '42501';
end;
$$;

drop trigger if exists listings_enforce_status_transition on public.listings;
create trigger listings_enforce_status_transition
  before insert or update on public.listings
  for each row
  execute function public.enforce_listing_status_transition();

-- ---------------------------------------------------------------------------
-- 4. Owner UPDATE policy: drop the status allowlist — the trigger owns status
-- ---------------------------------------------------------------------------
drop policy if exists listings_write_member_own_update on public.listings;

create policy listings_write_member_own_update
  on public.listings
  for update
  using (author_id = auth.uid() and public.is_member())
  with check (author_id = auth.uid() and public.is_member());

-- ---------------------------------------------------------------------------
-- 5a. approve_listing — pending → published (admin only)
-- ---------------------------------------------------------------------------
create or replace function public.approve_listing(p_listing_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Admin guard: service-role/seed path (auth.uid() null) passes; a signed-in
  -- admin passes; any other authenticated caller is refused. Same as 0015.
  if auth.uid() is not null and not exists (
    select 1 from public.accounts where id = auth.uid() and role = 'admin'
  ) then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  -- Going live wipes any earlier "needs changes" note — it's been addressed.
  update public.listings
     set status = 'published',
         moderation_note = null
   where id = p_listing_id
     and status = 'pending';

  if not found then
    raise exception 'Listing % not found or not pending', p_listing_id;
  end if;
end;
$$;

revoke all on function public.approve_listing(uuid) from public;
grant execute on function public.approve_listing(uuid) to service_role;
grant execute on function public.approve_listing(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 5b. return_listing — pending → draft + note (admin only)
-- ---------------------------------------------------------------------------
-- The note is the point of a return — the member needs to know what to fix —
-- so it has no default. The UI requires it non-empty.
create or replace function public.return_listing(p_listing_id uuid, p_note text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not exists (
    select 1 from public.accounts where id = auth.uid() and role = 'admin'
  ) then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  update public.listings
     set status = 'draft',
         moderation_note = p_note
   where id = p_listing_id
     and status = 'pending';

  if not found then
    raise exception 'Listing % not found or not pending', p_listing_id;
  end if;
end;
$$;

revoke all on function public.return_listing(uuid, text) from public;
grant execute on function public.return_listing(uuid, text) to service_role;
grant execute on function public.return_listing(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 5c. reject_listing — pending/published → archived + note (admin only)
-- ---------------------------------------------------------------------------
-- Works on published rows too: this is also the take-down for a listing that
-- slipped through or went bad after going live.
create or replace function public.reject_listing(p_listing_id uuid, p_note text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not exists (
    select 1 from public.accounts where id = auth.uid() and role = 'admin'
  ) then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  update public.listings
     set status = 'archived',
         moderation_note = p_note
   where id = p_listing_id
     and status in ('pending', 'published');

  if not found then
    raise exception 'Listing % not found or not pending/published', p_listing_id;
  end if;
end;
$$;

revoke all on function public.reject_listing(uuid, text) from public;
grant execute on function public.reject_listing(uuid, text) to service_role;
grant execute on function public.reject_listing(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Verify with:
--    -- (a) the status check now includes 'pending':
--    select pg_get_constraintdef(oid) from pg_constraint
--     where conrelid = 'public.listings'::regclass and conname = 'listings_status_check';
--      -- expect: CHECK (status = ANY (ARRAY['draft','pending','published','archived']))
--
--    -- (b) moderation_note exists:
--    select column_name from information_schema.columns
--     where table_schema = 'public' and table_name = 'listings'
--       and column_name = 'moderation_note';
--      -- expect: 1 row
--
--    -- (c) the trigger exists on INSERT and UPDATE:
--    select tgname, pg_get_triggerdef(oid) from pg_trigger
--     where tgrelid = 'public.listings'::regclass and not tgisinternal;
--      -- expect listings_enforce_status_transition (BEFORE INSERT OR UPDATE)
--      -- alongside the byline + touch_updated_at triggers
--
--    -- (d) the three functions are executable by authenticated + service_role:
--    select p.proname,
--           has_function_privilege('authenticated', p.oid, 'execute') as auth_can_exec,
--           has_function_privilege('service_role',  p.oid, 'execute') as service_can_exec
--      from pg_proc p
--     where p.pronamespace = 'public'::regnamespace
--       and p.proname in ('approve_listing', 'return_listing', 'reject_listing');
--      -- expect: t / t on all three rows
--
--    -- (e) the owner UPDATE policy no longer pins status:
--    select polname, pg_get_expr(polwithcheck, polrelid) as with_check_clause
--      from pg_policy
--     where polrelid = 'public.listings'::regclass
--       and polname = 'listings_write_member_own_update';
--      -- expect: ((author_id = auth.uid()) AND is_member()) — no status clause
--
--    Then: npm run test:listing-moderation  →  all green.
-- ---------------------------------------------------------------------------
