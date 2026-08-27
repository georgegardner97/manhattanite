-- 0027 — a listing may have no price.
--
-- WHY (George, 2026-08-27): not everything on a classifieds board has a number.
-- A members' rate at a hotel, a service quoted on request, a perk extended
-- through a member, a thing someone is looking for. Until now price_cents was
-- NOT NULL, which made a price compulsory in three separate places — the form's
-- `required`, the server action's validation, and this column — so those
-- listings could not be posted honestly at all.
--
-- NULL IS "NO PRICE". ZERO IS NOT.
-- 0 stays a legitimate stored value meaning free, and free is a real asking
-- price on a classifieds board. Anything reading this column must branch on
-- NULL, never on falsiness — `if (!price_cents)` would silently hide every free
-- listing's price, which is the bug this comment exists to prevent.
--
-- The >= 0 check is left exactly as it is: a CHECK constraint passes on NULL by
-- definition, so it keeps rejecting negative numbers and stops policing absence.
--
-- Reversible: `alter table public.listings alter column price_cents set not null`
-- fails while any NULL row exists, so back it out by pricing or archiving those
-- rows first. Nothing else in the schema reads this column.

alter table public.listings
  alter column price_cents drop not null;

-- Dollar-quoted, and deliberately free of apostrophes: this migration is run by
-- hand in the Supabase SQL editor, whose editor auto-pairs a typed quote and
-- silently doubles it. APPLIED TO PROD 2026-08-27 exactly as written here.
comment on column public.listings.price_cents is $c$Asking price in cents. NULL means the listing has no price at all (a members-only rate, a quote-on-request service, a perk); 0 means free. Renders as no price line anywhere a member or visitor looks.$c$;
