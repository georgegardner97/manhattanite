-- Migration 0008: application review transaction
-- Phase 2 Slice B — approve / decline / request-more-info
--
-- The heart of the membership flow. approve_application() is the atomic
-- three-way transaction the architecture calls for: in one step it flips the
-- application to 'approved', the account to is_member=true, and writes the
-- sponsor foreign key. All-or-nothing — a half-approved member can never exist.
--
-- All three functions are SECURITY DEFINER: they run as the function owner so
-- they can write the protected columns (is_member, sponsor_id) that the
-- protect_account_columns trigger (0001) blocks for ordinary users. During seed
-- they're called from the Supabase SQL editor (postgres role). They are NOT
-- granted to `authenticated`; when an /admin page lands, expose them through a
-- narrow, admin-checked path only.
--
-- Side effect worth knowing: writing accounts.sponsor_id fires the 0006
-- AFTER UPDATE trigger, which propagates the new sponsor's name onto every
-- listing the approved member authors. So approving a member also lights up
-- their byline ("· sponsored by [name]") with no extra step.

-- Founder's account id — the default sponsor during seed phase.
-- (info@manhattanite.com, the only member while the network is seeded.)

-- ---------------------------------------------------------------------------
-- 1. approve_application(application_id, sponsor_id)
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

  update public.applications
     set status = 'approved',
         reviewed_at = now()
   where id = p_application_id;
end;
$$;

revoke all on function public.approve_application(uuid, uuid) from public;

-- ---------------------------------------------------------------------------
-- 2. decline_application(application_id, note)
-- ---------------------------------------------------------------------------
-- Marks the application declined and leaves the account at Tier 1. Optional
-- note is stored for the record (and, later, for a decline email in Slice C).
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

-- ---------------------------------------------------------------------------
-- 3. request_more_info(application_id, note)
-- ---------------------------------------------------------------------------
-- The back-and-forth outcome. Sets status to 'needs_info'. Because the
-- "one pending application per account" index (0007) only covers status =
-- 'pending', moving an application to 'needs_info' frees the applicant to
-- submit a fresh application via /apply (which only blocks on a pending row).
-- That's the intended re-apply path for v1.
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

-- ---------------------------------------------------------------------------
-- 4. Verify with:
--   select proname from pg_proc
--    where pronamespace = 'public'::regnamespace
--      and proname in ('approve_application','decline_application','request_more_info');
--
-- Seed-phase usage (from the SQL editor, postgres role):
--   -- review the queue:
--   select id, account_id, occupation, neighborhood, created_at
--     from public.applications where status = 'pending' order by created_at;
--   -- approve (sponsor defaults to founder):
--   select public.approve_application('<application-id>');
--   -- or decline:
--   select public.decline_application('<application-id>', 'optional note');
-- ---------------------------------------------------------------------------
