-- Migration 0020: member invites — the cold-start growth engine.
--
-- Decision (2026-06-12, George): the network bootstraps invite-led, not
-- request-led. A request-a-sponsor flow needs density we don't have (5
-- members); an invite flow works from a seed of one, growing outward from the
-- founder. A member brings someone in; the newcomer is vouched-for by the
-- inviter (who becomes their sponsor), and still passes the founder's one-tap
-- approval. Floor stays at 1 sponsor for now.
--
-- This migration is the data foundation for the 3-stage invite slice:
--   1. invites table (+ RLS): a member creates invites for people they trust.
--   2. applications.sponsor_id: the intended sponsor (the inviter) rides on the
--      application so approve_application() records the REAL sponsor instead of
--      defaulting to the founder. Nullable — a non-invited applicant leaves it
--      null and still defaults to George, exactly as today.
--
-- Additive and safe: new table + one nullable column. Apply to prod before the
-- Stage-1 frontend (the invite-creation action) deploys.

-- ---------------------------------------------------------------------------
-- 1. invites table
-- ---------------------------------------------------------------------------
create table public.invites (
  id                  uuid primary key default gen_random_uuid(),
  token               text not null unique,         -- the secret in the /join link
  inviter_id          uuid not null references public.accounts(id) on delete cascade,
  invitee_email       text not null,
  invitee_name        text,
  status              text not null default 'pending'
                        check (status in ('pending', 'accepted', 'revoked')),
  accepted_account_id uuid references public.accounts(id) on delete set null,
  created_at          timestamptz not null default now(),
  accepted_at         timestamptz
);

create index invites_inviter_idx on public.invites (inviter_id);
create index invites_token_idx on public.invites (token);

-- ---------------------------------------------------------------------------
-- 1b. Row-Level Security
-- ---------------------------------------------------------------------------
-- A member manages their OWN invites (create / read / revoke). Reading an
-- invite by token for the logged-out person accepting it does NOT go through a
-- client policy — that's a SECURITY DEFINER function in Stage 2, so the token
-- can't be used to enumerate the table. Mirrors the rest of the trust layer:
-- the write/read the UI needs is scoped to the owner; everything else is a
-- privileged function.
alter table public.invites enable row level security;

-- Create: only a member, only for themselves.
create policy invites_insert_own
  on public.invites
  for insert
  to authenticated
  with check (inviter_id = auth.uid() and public.is_member());

-- Read: your own invites (to show "who you've invited" + statuses).
create policy invites_read_own
  on public.invites
  for select
  to authenticated
  using (inviter_id = auth.uid());

-- Update: your own invites (revoke a pending one). The status CHECK constrains
-- the values; a future Stage-2 accept runs through a SECURITY DEFINER function,
-- not this policy.
create policy invites_update_own
  on public.invites
  for update
  to authenticated
  using (inviter_id = auth.uid())
  with check (inviter_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 2. applications.sponsor_id — the intended sponsor (inviter)
-- ---------------------------------------------------------------------------
-- Set when an invited person applies, so approve_application() passes the real
-- inviter as p_sponsor_id. Null for a walk-up applicant (defaults to founder,
-- unchanged). on delete set null: if the inviter's account is removed, the
-- application falls back to the founder default rather than breaking approval.
alter table public.applications
  add column sponsor_id uuid references public.accounts(id) on delete set null;

-- ---------------------------------------------------------------------------
-- 3. Verify
-- ---------------------------------------------------------------------------
--   select relrowsecurity from pg_class where oid = 'public.invites'::regclass;  -- t
--   select polname, polcmd::text from pg_policy where polrelid = 'public.invites'::regclass;
--     -- expect invites_insert_own (a), invites_read_own (r), invites_update_own (w)
--   select column_name from information_schema.columns
--    where table_schema='public' and table_name='applications' and column_name='sponsor_id';
--     -- expect 1 row
