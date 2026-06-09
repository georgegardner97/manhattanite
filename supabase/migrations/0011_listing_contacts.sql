-- Migration 0011: listing_contacts + log_listing_contact()
-- Phase 2 — the contact slice (member → lister email forwarding)
--
-- The contact mechanic from mvp-spec.md: a member fills in a form on a listing,
-- we forward the note to the lister's email, and the lister replies directly
-- (reply-to = the sender). No in-app inbox — that's v2. Each contact is logged
-- as a row here for moderation history (review UI is deferred).
--
-- Plain English, what this does:
--   1. Creates public.listing_contacts — one row per contact attempt. RLS is on
--      with NO client policies: nobody reads or writes this table directly.
--      Writes go through the SECURITY DEFINER function below; reads are
--      admin/moderation only (a later slice).
--   2. Adds log_listing_contact() — same SECURITY DEFINER pattern as
--      approve_application (0008). It runs as the function owner, enforces every
--      rule inside (signed in, member, listing published, not self-contact),
--      logs the row, then does the privileged read of the lister's email + name
--      (accounts is read-own under RLS, so an ordinary member can't read another
--      member's email — the definer can). It returns only what the server action
--      needs to send the email. The service-role key never touches the request.
--
-- The lister's email is deliberately NOT denormalized onto listings: the 0010
-- anon-teaser policy makes published listings publicly readable, which would
-- leak every lister's email. The function is the controlled, audited path.

-- ---------------------------------------------------------------------------
-- 1. listing_contacts table
-- ---------------------------------------------------------------------------
create table public.listing_contacts (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references public.listings(id) on delete cascade,
  sender_id   uuid not null references public.accounts(id) on delete cascade,
  message     text not null,
  created_at  timestamptz not null default now()
);

create index listing_contacts_listing_id_idx on public.listing_contacts (listing_id);
create index listing_contacts_sender_id_idx  on public.listing_contacts (sender_id);

-- ---------------------------------------------------------------------------
-- 2. Row-Level Security — locked down on purpose
-- ---------------------------------------------------------------------------
-- RLS on, no policies for authenticated/anon. With RLS enabled and no matching
-- policy, every direct client select/insert/update/delete returns zero rows /
-- is refused. The only write path is the SECURITY DEFINER function below; reads
-- are admin/moderation only and come later. Locked-down is the safe default.
alter table public.listing_contacts enable row level security;

-- ---------------------------------------------------------------------------
-- 3. log_listing_contact(listing_id, message) — SECURITY DEFINER
-- ---------------------------------------------------------------------------
-- Guards run in order; each failure raises with a distinct SQLSTATE so the
-- server action can map it cleanly (membership → interaction gate; the rest →
-- readable errors):
--   MH001  caller is not a member          → the action renders the gate
--   MH002  listing missing / not published  → readable error
--   MH003  caller is the listing's author    → no self-contact
-- A null auth.uid() also raises (the action validates the session first, so
-- this is defense-in-depth). On success it logs the row and returns one row:
-- the lister's email + name + the listing title, for the email send.
create or replace function public.log_listing_contact(
  p_listing_id uuid,
  p_message    text
)
returns table (
  lister_email  text,
  lister_name   text,
  listing_title text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid       uuid := auth.uid();
  v_author_id uuid;
  v_status    text;
  v_title     text;
begin
  -- Signed in (defense-in-depth; the action checks the session too).
  if v_uid is null then
    raise exception 'Not signed in' using errcode = 'MH000';
  end if;

  -- Member-only action. The server action maps MH001 to the interaction gate.
  if not public.is_member() then
    raise exception 'Membership required to contact a lister' using errcode = 'MH001';
  end if;

  -- Listing must exist and be published.
  select author_id, status, title
    into v_author_id, v_status, v_title
    from public.listings
    where id = p_listing_id;

  if v_author_id is null or v_status <> 'published' then
    raise exception 'Listing not available' using errcode = 'MH002';
  end if;

  -- No self-contact — you can't message your own listing.
  if v_author_id = v_uid then
    raise exception 'Cannot contact your own listing' using errcode = 'MH003';
  end if;

  -- Log the contact (sender = caller). This is the moderation-history row.
  insert into public.listing_contacts (listing_id, sender_id, message)
  values (p_listing_id, v_uid, p_message);

  -- Privileged read: the lister's email + name (accounts is read-own under RLS;
  -- the definer bypasses that). Returned only to the server action.
  return query
    select a.email, a.name, v_title
      from public.accounts a
      where a.id = v_author_id;
end;
$$;

revoke all on function public.log_listing_contact(uuid, text) from public;
grant execute on function public.log_listing_contact(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Verify with:
--   select polname from pg_policy where polrelid = 'public.listing_contacts'::regclass;
--   -- expect: zero rows (RLS on, no policies).
--   select proname from pg_proc
--    where pronamespace = 'public'::regnamespace and proname = 'log_listing_contact';
-- ---------------------------------------------------------------------------
