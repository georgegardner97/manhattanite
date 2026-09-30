-- Migration 0035: Rate limits on the three things a member can repeat.
--
-- Decision (George, 2026-09-30, security pass): a member could send an
-- unlimited number of contact messages (each one an email to another member),
-- an unlimited number of invitations (each one an email to any address), and an
-- unlimited number of listings. Nothing stopped a compromised or hostile
-- account from using Manhattanite to spam members or strangers.
--
-- The limits live in the DATABASE, as BEFORE INSERT triggers, for the same
-- reason the member wall does: a limit in the server action alone is skipped by
-- anyone who calls the API directly with their own session. The trigger fires
-- whichever door the row comes through, including log_listing_contact (0011).
--
--   contact messages   10 an hour, 40 a day
--   invitations        20 a day
--   listings           10 a day
--
-- Each is far above anything a real member does in normal use. Who is exempt:
--   - admins (is_admin()), so moderation and seeding are never blocked;
--   - the service role (auth.uid() is null), so seed and test scripts are not.
--
-- A tripped limit raises SQLSTATE MH004, which the server actions turn into a
-- plain "try again later" message. The code ships first and degrades while
-- this is unapplied: nothing raises MH004, so nothing changes.
--
-- Written dollar-quoted and apostrophe-free for the SQL editor.

create index if not exists listing_contacts_sender_created_idx
  on public.listing_contacts (sender_id, created_at);
create index if not exists invites_inviter_created_idx
  on public.invites (inviter_id, created_at);
create index if not exists listings_author_created_idx
  on public.listings (author_id, created_at);

-- Contact messages -----------------------------------------------------------

create or replace function public.rate_limit_listing_contacts()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if (select count(*) from public.listing_contacts
       where sender_id = new.sender_id
         and created_at > now() - make_interval(hours => 1)) >= 10
  or (select count(*) from public.listing_contacts
       where sender_id = new.sender_id
         and created_at > now() - make_interval(days => 1)) >= 40
  then
    raise exception using errcode = $e$MH004$e$, message = $m$rate limit: contact$m$;
  end if;

  return new;
end;
$fn$;

drop trigger if exists listing_contacts_rate_limit on public.listing_contacts;
create trigger listing_contacts_rate_limit
  before insert on public.listing_contacts
  for each row execute function public.rate_limit_listing_contacts();

-- Invitations ------------------------------------------------------------------

create or replace function public.rate_limit_invites()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if (select count(*) from public.invites
       where inviter_id = new.inviter_id
         and created_at > now() - make_interval(days => 1)) >= 20
  then
    raise exception using errcode = $e$MH004$e$, message = $m$rate limit: invites$m$;
  end if;

  return new;
end;
$fn$;

drop trigger if exists invites_rate_limit on public.invites;
create trigger invites_rate_limit
  before insert on public.invites
  for each row execute function public.rate_limit_invites();

-- Listings ---------------------------------------------------------------------

create or replace function public.rate_limit_listings()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if (select count(*) from public.listings
       where author_id = new.author_id
         and created_at > now() - make_interval(days => 1)) >= 10
  then
    raise exception using errcode = $e$MH004$e$, message = $m$rate limit: listings$m$;
  end if;

  return new;
end;
$fn$;

drop trigger if exists listings_rate_limit on public.listings;
create trigger listings_rate_limit
  before insert on public.listings
  for each row execute function public.rate_limit_listings();

-- Verify with:
--
--   select tgname from pg_trigger
--    where tgname in ($a$listing_contacts_rate_limit$a$, $b$invites_rate_limit$b$, $c$listings_rate_limit$c$)
--    order by 1;
--     -- expect 3 rows
