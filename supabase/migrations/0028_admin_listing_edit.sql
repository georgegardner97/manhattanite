-- 0028 — admin edit and admin take-down for any listing.
--
-- WHY THIS EXISTS. Until now an admin had no handle on a listing once it went
-- live. The three moderation functions from 0017 (approve_listing,
-- return_listing, reject_listing) are queue verbs, and the queue is
-- status='pending' only. A phone number in public, or a phrase that trips fair
-- housing, needed a hand-written SQL statement to remove. That is the hole this
-- closes.
--
-- THE POLICY IS THE WALL, THE FUNCTION IS THE DOOR. RLS on listings is
-- deliberately owner-only for writes (listings_write_member_own_update, 0017:
-- author_id = auth.uid() and is_member()). This migration does NOT loosen that
-- policy. It adds two SECURITY DEFINER functions carrying the same admin guard
-- and the same revoke/grant pattern as 0015 and 0017, so admin write access
-- exists at exactly two named entry points and nowhere else.
--
-- CORRECTIONS ARE RECORDED, NEVER SILENT. corrected_by and corrected_at are
-- written by admin_update_listing and shown to the owner on their own listing.
-- On a network whose product is that a name means something, an invisible
-- rewrite of what somebody wrote under their own name is the wrong default,
-- even when the intent is a spelling fix. The scope of an admin edit is
-- CORRECTION -- spelling, a factual error, a cover photo that should not be the
-- cover -- not rewriting what a member said.
--
-- WHAT admin_update_listing DELIBERATELY DOES NOT TOUCH:
--   status        -- a correction must not pull a live listing off the site.
--   author_id     -- authorship is not editable by anyone, ever.
--   author_name   -- the byline is denormalized at write time (0006) and
--   sponsor_names    belongs to the member, not to the moderator.
--   is_example    -- seed bookkeeping.
--
-- Applied by hand in the SQL editor. Dollar-quoted throughout and free of
-- apostrophes in prose, because the editor auto-pairs a typed apostrophe and
-- silently doubles it.

-- ---------------------------------------------------------------------------
-- 1. The correction record
-- ---------------------------------------------------------------------------
alter table public.listings
  add column if not exists corrected_by uuid references public.accounts(id),
  add column if not exists corrected_at timestamptz;

comment on column public.listings.corrected_by is
  'Admin who last corrected this listing. Shown to the owner as "Corrected by Manhattanite"; the person is never named to the member.';
comment on column public.listings.corrected_at is
  'When the last admin correction was made. Null means nobody has corrected it.';

-- ---------------------------------------------------------------------------
-- 2. admin_update_listing -- content correction on ANY listing, any status
-- ---------------------------------------------------------------------------
-- The write set matches the member edit path exactly (type, title, description,
-- price_cents, details, images) plus the correction record. Same set, so an
-- admin correcting a typo cannot reach a field a member could not have set.
--
-- price_cents is nullable on purpose: 0027 made a blank price a real value, and
-- NULL means no price while 0 means free. Passing null here clears the price,
-- which is a correction an admin may legitimately need to make.
create or replace function public.admin_update_listing(
  p_listing_id uuid,
  p_type text,
  p_title text,
  p_description text,
  p_price_cents integer,
  p_details jsonb,
  p_images jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Same guard shape as 0015 and 0017: a JWT-less caller is the service role or
  -- the SQL editor and passes; any other authenticated caller must be an admin.
  if auth.uid() is not null and not exists (
    select 1 from public.accounts where id = auth.uid() and role = 'admin'
  ) then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  update public.listings
     set type         = p_type,
         title        = p_title,
         description  = p_description,
         price_cents  = p_price_cents,
         details      = p_details,
         images       = p_images,
         corrected_by = auth.uid(),
         corrected_at = now()
   where id = p_listing_id;

  if not found then
    raise exception 'Listing % not found', p_listing_id;
  end if;
end;
$$;

revoke all on function public.admin_update_listing(uuid, text, text, text, integer, jsonb, jsonb) from public;
grant execute on function public.admin_update_listing(uuid, text, text, text, integer, jsonb, jsonb) to service_role;
grant execute on function public.admin_update_listing(uuid, text, text, text, integer, jsonb, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. admin_archive_listing -- take down ANY listing, whatever its status
-- ---------------------------------------------------------------------------
-- HOW THIS DIFFERS FROM reject_listing (0017), which also archives:
--   reject_listing is the QUEUE verb. It accepts pending and published only,
--   and the server action around it sends the member an "About your listing"
--   email. It is the answer to "I reviewed this and it is not going up".
--   admin_archive_listing is the DIRECTORY verb. It accepts any status
--   including draft, sends nothing, and is the answer to "this is live and it
--   has to come down now".
-- Both write moderation_note, because a take-down without a recorded reason is
-- the thing that turns a trust layer into an opinion.
--
-- Soft delete only. The row and its listing_contacts history stay -- nothing in
-- this product hard-deletes a listing (0014).
create or replace function public.admin_archive_listing(
  p_listing_id uuid,
  p_note text
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

  if p_note is null or btrim(p_note) = '' then
    raise exception 'a reason is required to take a listing down'
      using errcode = '22023';
  end if;

  update public.listings
     set status          = 'archived',
         moderation_note = p_note
   where id = p_listing_id
     and status <> 'archived';

  if not found then
    raise exception 'Listing % not found or already archived', p_listing_id;
  end if;
end;
$$;

revoke all on function public.admin_archive_listing(uuid, text) from public;
grant execute on function public.admin_archive_listing(uuid, text) to service_role;
grant execute on function public.admin_archive_listing(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Verify with:
--
--    -- (a) the two columns exist:
--    select column_name from information_schema.columns
--     where table_schema = 'public' and table_name = 'listings'
--       and column_name in ('corrected_by', 'corrected_at');
--      -- expect: 2 rows
--
--    -- (b) both functions exist and are SECURITY DEFINER:
--    select proname, prosecdef from pg_proc
--     where pronamespace = 'public'::regnamespace
--       and proname in ('admin_update_listing', 'admin_archive_listing');
--      -- expect: 2 rows, prosecdef = true on both
--
--    -- (c) the owner-only UPDATE policy is UNCHANGED -- this migration must
--    --     not have widened it:
--    select pg_get_expr(polqual, polrelid) from pg_policy
--     where polrelid = 'public.listings'::regclass
--       and polname = 'listings_write_member_own_update';
--      -- expect: ((author_id = auth.uid()) AND is_member())
--
--    -- npm run audit:rls covers (c) as a live attack, plus four new cells
--    -- proving a member is refused by both functions and an admin is not.
-- ---------------------------------------------------------------------------
