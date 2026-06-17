-- Migration 0025: sponsorship requests — applicant-initiated, sponsor-confirmed.
-- (Sponsorship Request slice, 2026-06-16, George's call.)
--
-- The gap this closes: today an applicant can name a member in the "Know a
-- member?" field (applications.sponsor_reference), and the admin queue matches
-- it to a real member — but that member is never told, and never actually
-- confirms. It's a referral taken on trust. This makes the vouch real:
--
--   1. Applicant applies and names a member (by email or name).
--   2. If that matches a real member, a sponsorship_request row is created and
--      that member is emailed.
--   3. The member opens a Manhattanite page and CONFIRMS or DECLINES — consent,
--      from their side, not self-declared by the applicant.
--   4. George still makes the final call in the admin queue, which now shows the
--      confirmation status. (Sponsor confirming does NOT auto-admit — the
--      founder's one-tap approval stays the moat while density is low.)
--
-- Trust model: this table is RLS-locked like sponsorships/invites. The only
-- write path is the SECURITY DEFINER functions below; reads are scoped to the
-- admin (is_admin) and to the sponsor themselves. The token in the email link is
-- a 122-bit secret (crypto.randomUUID from the app), so it can't enumerate rows.
--
-- Additive and safe: one new table + three functions. Apply to prod before the
-- frontend (apply-action wiring + the confirm page) deploys; until then the
-- apply action's rpc call fails soft and the flow behaves exactly as today.

-- ---------------------------------------------------------------------------
-- 1. sponsorship_requests table
-- ---------------------------------------------------------------------------
create table public.sponsorship_requests (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  requester_id   uuid not null references public.accounts(id) on delete cascade,
  sponsor_id     uuid not null references public.accounts(id) on delete cascade,
  token          text not null unique,                  -- the secret in the email link
  status         text not null default 'pending'
                   check (status in ('pending', 'confirmed', 'declined')),
  created_at     timestamptz not null default now(),
  responded_at   timestamptz,
  unique (application_id, sponsor_id),     -- one ask per (application, sponsor)
  check (requester_id <> sponsor_id)        -- can't ask yourself to sponsor you
);

create index sponsorship_requests_sponsor_idx
  on public.sponsorship_requests (sponsor_id);
create index sponsorship_requests_application_idx
  on public.sponsorship_requests (application_id);

-- ---------------------------------------------------------------------------
-- 1b. Row-Level Security
-- ---------------------------------------------------------------------------
-- Locked: no insert/update policies (writes go through the DEFINER functions).
-- Reads: the admin (review queue) and the sponsor themselves (a future
-- "requests for me" list). The applicant reads status via the admin queue / the
-- on-page apply state, not this table directly.
alter table public.sponsorship_requests enable row level security;

create policy sponsorship_requests_admin_read
  on public.sponsorship_requests
  for select
  to authenticated
  using (public.is_admin());

create policy sponsorship_requests_sponsor_read
  on public.sponsorship_requests
  for select
  to authenticated
  using (sponsor_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 2. request_sponsorship — create the ask (called from the apply action)
-- ---------------------------------------------------------------------------
-- The applicant can't see other accounts (RLS read-own) or write this locked
-- table, so this DEFINER function does the privileged work on their behalf:
--   - verifies the caller owns the application and it's still pending;
--   - matches the typed reference (email OR name) to a real member, not self;
--   - inserts the pending request with the app-supplied token;
--   - returns the sponsor's name + email so the action can send the email.
-- Returns NO rows when the reference matches no member — the apply flow then
-- just carries the unverified referral, exactly as before.
create or replace function public.request_sponsorship(
  p_application_id uuid,
  p_reference      text,
  p_token          text
)
returns table (sponsor_id uuid, sponsor_name text, sponsor_email text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member  public.accounts;
  v_ref     text := lower(trim(coalesce(p_reference, '')));
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  if v_ref = '' then
    return;  -- nothing to match
  end if;

  -- The application must be the caller's own and still pending.
  if not exists (
    select 1 from public.applications
     where id = p_application_id
       and account_id = auth.uid()
       and status = 'pending'
  ) then
    raise exception 'Application not found or not yours';
  end if;

  -- Match a real member by email or name (same rule as the admin queue),
  -- never the applicant themselves.
  select * into v_member
    from public.accounts
   where is_member = true
     and id <> auth.uid()
     and (lower(email) = v_ref or lower(name) = v_ref)
   limit 1;

  if v_member.id is null then
    return;  -- not a member → no request, just the referral note as before
  end if;

  insert into public.sponsorship_requests
    (application_id, requester_id, sponsor_id, token)
  values
    (p_application_id, auth.uid(), v_member.id, p_token)
  on conflict (application_id, sponsor_id) do nothing;

  -- Return the sponsor's details for the email (only if we just created one;
  -- on conflict the request already exists and we don't re-send).
  if found then
    sponsor_id := v_member.id;
    sponsor_name := v_member.name;
    sponsor_email := v_member.email;
    return next;
  end if;
end;
$$;

revoke all on function public.request_sponsorship(uuid, text, text) from public;
grant execute on function public.request_sponsorship(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. get_sponsorship_request — read the safe fields for the confirm page
-- ---------------------------------------------------------------------------
-- By token only (the token is the secret). Anon + authenticated so the page can
-- render "log in to respond" before the member signs in.
create or replace function public.get_sponsorship_request(p_token text)
returns table (
  requester_name text,
  sponsor_name   text,
  sponsor_id     uuid,
  status         text
)
language sql
security definer
set search_path = public
as $$
  select r.name, s.name, sr.sponsor_id, sr.status
    from public.sponsorship_requests sr
    join public.accounts r on r.id = sr.requester_id
    join public.accounts s on s.id = sr.sponsor_id
   where sr.token = p_token;
$$;

revoke all on function public.get_sponsorship_request(text) from public;
grant execute on function public.get_sponsorship_request(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. respond_to_sponsorship_request — the sponsor confirms or declines
-- ---------------------------------------------------------------------------
-- Only the named sponsor (auth.uid() = sponsor_id) may respond, and only to a
-- pending request. This is the consent step; it does NOT flip membership — the
-- founder's approval in the admin queue still does that.
create or replace function public.respond_to_sponsorship_request(
  p_token   text,
  p_confirm boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req public.sponsorship_requests;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  select * into v_req
    from public.sponsorship_requests
   where token = p_token
   for update;

  if v_req.id is null then
    raise exception 'Request not found';
  end if;
  if v_req.sponsor_id <> auth.uid() then
    raise exception 'This request is for someone else';
  end if;
  if v_req.status <> 'pending' then
    raise exception 'This request was already answered';
  end if;

  update public.sponsorship_requests
     set status = case when p_confirm then 'confirmed' else 'declined' end,
         responded_at = now()
   where id = v_req.id;
end;
$$;

revoke all on function public.respond_to_sponsorship_request(text, boolean) from public;
grant execute on function public.respond_to_sponsorship_request(text, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Verify
-- ---------------------------------------------------------------------------
--   select relrowsecurity from pg_class where oid='public.sponsorship_requests'::regclass; -- t
--   select polname from pg_policy where polrelid='public.sponsorship_requests'::regclass;
--     -- sponsorship_requests_admin_read, sponsorship_requests_sponsor_read
--   select proname from pg_proc where pronamespace='public'::regnamespace
--     and proname in ('request_sponsorship','get_sponsorship_request',
--                     'respond_to_sponsorship_request');  -- 3 rows
