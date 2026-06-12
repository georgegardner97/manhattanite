-- Migration 0015: Admin Console — admin-callable review functions + admin reads
-- Admin Console slice (application review queue, stats dashboard, member directory)
--
-- NOTE ON THE NUMBER: the build plan called this 0014, but 0014 is already
-- taken by the parked listings-owner-archive migration from the Edit & Remove
-- slice (supabase/migrations/0014_listings_owner_archive.sql, drafted
-- 2026-06-11, not yet applied). The two are independent — this file does not
-- depend on 0013 or 0014 and can run before or after them.
--
-- Plain English, what this does:
--   0. Makes the founder the admin. As of 2026-06-11 prod has NO admin row
--      (info@manhattanite.com is role='account' — verified via service role).
--      Every admin policy and guard below matches zero people until this runs.
--      George: this is the line you said you'd set in the SQL editor — it's
--      included here so the migration is self-contained; strike it if you'd
--      rather run it by hand.
--   1. Recreates the three review functions (approve_application,
--      decline_application, request_more_info) with ONE addition: an admin
--      guard at the top. Logic is otherwise byte-for-byte the CURRENT bodies —
--      approve_application from 0012 (the multi-sponsor rework, incl. the
--      primary sponsorship insert), the other two from 0008. The guard:
--        - auth.uid() is null  → the service-role / SQL-editor seed path: pass.
--        - auth.uid() = an admin → pass (this is what the /admin console uses).
--        - any other signed-in user → raise 'not authorized' (42501).
--      Then grants EXECUTE to authenticated (the guard does the real gating)
--      and (re)grants service_role so the CLI path keeps working. Note 0008
--      never granted service_role on decline/request_more_info — only approve
--      got that in 0009 — so those two get their first service_role grant here.
--   2. Adds an admin read-all SELECT policy on public.listings so the
--      dashboard's listings count sees every row (drafts + archived included),
--      and the future moderation queue has its read. Uses is_admin() — the
--      SECURITY DEFINER helper from 0002 — NOT a direct accounts subquery,
--      per the 0002 recursion post-mortem ("never subquery public.accounts
--      directly from inside a policy"). accounts and applications already have
--      admin read policies (0001/0002, 0007); listings was the gap.
--
-- The guard subqueries accounts directly INSIDE the functions — that's fine:
-- they're SECURITY DEFINER and owned by postgres (the table owner), so RLS
-- doesn't apply there. The policy-level rule is where the helper matters.

-- ---------------------------------------------------------------------------
-- 0. Founder becomes the admin (see header note)
-- ---------------------------------------------------------------------------
update public.accounts
   set role = 'admin'
 where email = 'info@manhattanite.com';

-- ---------------------------------------------------------------------------
-- 1a. approve_application — 0012 body + admin guard
-- ---------------------------------------------------------------------------
create or replace function public.approve_application(
  p_application_id uuid,
  p_sponsor_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account_id uuid;
  v_status     public.application_status;
begin
  -- Admin guard: service-role/seed path (auth.uid() null) passes; a signed-in
  -- admin passes; any other authenticated caller is refused.
  if auth.uid() is not null and not exists (
    select 1 from public.accounts where id = auth.uid() and role = 'admin'
  ) then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  -- Default the sponsor to the founder during seed phase.
  if p_sponsor_id is null then
    p_sponsor_id := '85ce5315-2c38-4dc6-b3f3-48f224f26dba';
  end if;

  -- Lock the application row and read its account + status.
  select account_id, status
    into v_account_id, v_status
    from public.applications
   where id = p_application_id
   for update;

  if v_account_id is null then
    raise exception 'Application % not found', p_application_id;
  end if;

  if v_status <> 'pending' then
    raise exception 'Application % is %, not pending', p_application_id, v_status;
  end if;

  -- Don't re-admit someone who's already a member.
  if (select is_member from public.accounts where id = v_account_id) then
    raise exception 'Account % is already a member', v_account_id;
  end if;

  -- The sponsor must exist and be a member — you can't be vouched for by
  -- someone who isn't inside the network.
  if not exists (
    select 1 from public.accounts where id = p_sponsor_id and is_member
  ) then
    raise exception 'Sponsor % is not a member', p_sponsor_id;
  end if;

  -- The transaction: account becomes a sponsored member; application approved.
  update public.accounts
     set is_member = true,
         sponsor_id = p_sponsor_id
   where id = v_account_id;

  -- Multi-sponsor: record the primary sponsorship explicitly.
  -- MIN_SPONSORS = 1 (raise to 2 when the multi-sponsor apply flow lands)
  insert into public.sponsorships (member_id, sponsor_id, is_primary)
  values (v_account_id, p_sponsor_id, true)
  on conflict (member_id, sponsor_id) do update set is_primary = true;

  update public.applications
     set status = 'approved',
         reviewed_at = now()
   where id = p_application_id;
end;
$$;

revoke all on function public.approve_application(uuid, uuid) from public;
grant execute on function public.approve_application(uuid, uuid) to service_role;
grant execute on function public.approve_application(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 1b. decline_application — 0008 body + admin guard
-- ---------------------------------------------------------------------------
create or replace function public.decline_application(
  p_application_id uuid,
  p_note text default null
)
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

  update public.applications
     set status = 'declined',
         reviewed_at = now(),
         reviewer_note = p_note
   where id = p_application_id
     and status = 'pending';

  if not found then
    raise exception 'Application % not found or not pending', p_application_id;
  end if;
end;
$$;

revoke all on function public.decline_application(uuid, text) from public;
grant execute on function public.decline_application(uuid, text) to service_role;
grant execute on function public.decline_application(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 1c. request_more_info — 0008 body + admin guard
-- ---------------------------------------------------------------------------
create or replace function public.request_more_info(
  p_application_id uuid,
  p_note text default null
)
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

  update public.applications
     set status = 'needs_info',
         reviewed_at = now(),
         reviewer_note = p_note
   where id = p_application_id
     and status = 'pending';

  if not found then
    raise exception 'Application % not found or not pending', p_application_id;
  end if;
end;
$$;

revoke all on function public.request_more_info(uuid, text) from public;
grant execute on function public.request_more_info(uuid, text) to service_role;
grant execute on function public.request_more_info(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Admin read-all on listings (dashboard counts + future moderation queue)
-- ---------------------------------------------------------------------------
create policy listings_admin_read_all
  on public.listings
  for select
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 3. Verify with:
--    -- (a) founder is the admin:
--    select email, role from public.accounts where email = 'info@manhattanite.com';
--      -- expect: role = 'admin'
--
--    -- (b) authenticated can execute all three (the in-function guard gates):
--    select p.proname,
--           has_function_privilege('authenticated', p.oid, 'execute') as auth_can_exec,
--           has_function_privilege('service_role',  p.oid, 'execute') as service_can_exec
--      from pg_proc p
--     where p.pronamespace = 'public'::regnamespace
--       and p.proname in ('approve_application','decline_application','request_more_info');
--      -- expect: t / t on all three rows
--
--    -- (c) the listings admin policy exists:
--    select polname, polcmd from pg_policy
--     where polrelid = 'public.listings'::regclass;
--      -- expect listings_admin_read_all (polcmd 'r') alongside the existing policies
-- ---------------------------------------------------------------------------
