-- Migration 0034: Propose a Manhattanite. The proposer says why.
--
-- Decision (George, 2026-09-30, after the Radio H-P propose page): the invite
-- form gains two things. A tick box where the member vouches for the person in
-- so many words, and a short note on why they belong here. The note is read by
-- the admin at approval time, beside the application, so the founder meets a
-- new person with the reason they were proposed instead of cold.
--
-- The tick box is not stored. It is required by the form and by the server
-- action, so an invite row existing already means it was ticked.
--
-- Two changes, both additive:
--   1. invites.note, nullable (rows sent before today have none), capped.
--   2. an admin read policy on invites, so /admin/applications can show the
--      note. Members still read only their own invites (invites_read_own).
--
-- The note is NOT exposed to the invitee: get_invite (0021) selects named
-- columns and is unchanged, so /join never shows what was written about them.
--
-- The code ships first and degrades while this is unapplied: the invite saves
-- without its note, and the review screen shows no note.

alter table public.invites
  add column if not exists note text;

alter table public.invites
  drop constraint if exists invites_note_length;

alter table public.invites
  add constraint invites_note_length check (note is null or char_length(note) <= 1000);

drop policy if exists invites_read_admin on public.invites;

create policy invites_read_admin
  on public.invites
  for select
  to authenticated
  using (public.is_admin());

-- Verify with:
--
--   select column_name from information_schema.columns
--    where table_schema = $s$public$s$ and table_name = $t$invites$t$ and column_name = $c$note$c$;
--     -- expect 1 row
--
--   select polname from pg_policy where polrelid = $r$public.invites$r$::regclass order by 1;
--     -- expect invites_insert_own, invites_read_admin, invites_read_own, invites_update_own
