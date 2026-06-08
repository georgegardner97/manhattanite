-- Migration 0007: applications table + RLS
-- Phase 2 — membership application flow (/apply Slice A)
--
-- One row per membership application. Account-bound: an application always
-- belongs to a signed-in Tier 1 account (account_id = the auth user). The
-- approve/decline transaction lands in Slice B (migration 0008); this migration
-- only creates the table, the "one open application at a time" guard, and the
-- RLS that makes the apply path safe.
--
-- Reuses three things already in the database:
--   - touch_updated_at()  (0001) — keeps updated_at fresh
--   - is_member()         (0003) — SECURITY DEFINER, no RLS recursion
--   - is_admin()          (0002) — SECURITY DEFINER, no RLS recursion

-- ---------------------------------------------------------------------------
-- 1. Status enum
-- ---------------------------------------------------------------------------
create type public.application_status as enum
  ('pending', 'approved', 'declined', 'needs_info');

-- ---------------------------------------------------------------------------
-- 2. applications table
-- ---------------------------------------------------------------------------
create table public.applications (
  id                uuid primary key default gen_random_uuid(),
  account_id        uuid not null references public.accounts(id) on delete cascade,
  status            public.application_status not null default 'pending',
  occupation        text,
  about             text,            -- the paragraph, in their own words
  sponsor_reference text,            -- optional free text: "who sent you"
  neighborhood      text,            -- snapshot at apply time
  reviewer_note     text,            -- set on decline / needs_info (Slice B)
  reviewed_at       timestamptz,     -- set when reviewed (Slice B)
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- keep updated_at fresh (reuse the 0001 helper)
create trigger applications_touch_updated_at
  before update on public.applications
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- 3. One OPEN application per account
-- ---------------------------------------------------------------------------
-- A partial unique index: an account can have many historical applications
-- (declined, then re-applied) but only ONE in 'pending' at a time. A second
-- insert while one is pending raises 23505 (unique_violation) — the server
-- action maps that to a friendly "we've already got yours" message.
create unique index applications_one_pending_per_account
  on public.applications (account_id)
  where status = 'pending';

-- review-queue index (Slice B reads this)
create index applications_status_created
  on public.applications (status, created_at desc);

-- ---------------------------------------------------------------------------
-- 4. Row-Level Security — the wall
-- ---------------------------------------------------------------------------
alter table public.applications enable row level security;

-- INSERT: you can only create an application for yourself, and only if you're
-- not already a member. is_member() is the SECURITY DEFINER helper from 0003,
-- so no recursion risk.
create policy "applications: insert own when not member"
  on public.applications
  for insert
  with check (account_id = auth.uid() and not public.is_member());

-- READ own: an applicant can see their own application + its status.
create policy "applications: read own"
  on public.applications
  for select
  using (account_id = auth.uid());

-- ADMIN read/update all — for the review queue. The Supabase SQL editor runs
-- as the postgres role (bypasses RLS entirely), so SQL-driven review in Slice B
-- doesn't strictly need these. They're here so the model is complete and an
-- /admin page can be added later with no migration. No admin exists yet
-- (founder is role='account'); these policies simply match zero rows until one does.
create policy "applications: admin reads all"
  on public.applications for select using (public.is_admin());

create policy "applications: admin updates all"
  on public.applications for update using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 5. Verify with:
--   select * from public.applications;                       -- empty
--   select polname, polcmd from pg_policy
--     where polrelid = 'public.applications'::regclass;       -- 4 policies
--   -- polcmd: a (insert), r (select read-own), r (select admin), w (update admin)
-- ---------------------------------------------------------------------------
