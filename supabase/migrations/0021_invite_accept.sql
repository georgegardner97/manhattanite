-- Migration 0021: invite accept functions — Invite slice, Stage 2.
--
-- The /join/[token] flow for the person being brought in. Three SECURITY
-- DEFINER functions, because the invitee is NOT the inviter and so can't touch
-- the invite under RLS (invites_*_own scope everything to inviter_id):
--
--   get_invite(token)   — anon-readable lookup BY TOKEN ONLY (the token is a
--                         122-bit secret) so /join can show "<inviter> invited
--                         you" and prefill the email. No token, no row.
--   accept_invite(token)— the signed-in new account marks its invite accepted
--                         and links itself. Pending-only; idempotent if the
--                         same account re-accepts.
--   inviter_for_me()    — the inviter id from the caller's accepted invite, so
--                         the apply action can set applications.sponsor_id
--                         server-side (derived from the invite, never from user
--                         input). Null if they weren't invited.

-- ---------------------------------------------------------------------------
-- get_invite — read the safe fields for the /join page (anon + authenticated)
-- ---------------------------------------------------------------------------
create or replace function public.get_invite(p_token text)
returns table (
  inviter_name  text,
  invitee_email text,
  invitee_name  text,
  status        text
)
language sql
security definer
set search_path = public
as $$
  select a.name, i.invitee_email, i.invitee_name, i.status
    from public.invites i
    join public.accounts a on a.id = i.inviter_id
   where i.token = p_token;
$$;

revoke all on function public.get_invite(text) from public;
grant execute on function public.get_invite(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- accept_invite — the new account claims its invite
-- ---------------------------------------------------------------------------
create or replace function public.accept_invite(p_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.invites;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  select * into v_invite from public.invites where token = p_token for update;

  if v_invite.id is null then
    raise exception 'Invite not found';
  end if;

  if v_invite.status = 'revoked' then
    raise exception 'This invitation is no longer valid';
  end if;

  -- Already accepted: a no-op success if it was THIS account, else taken.
  if v_invite.status = 'accepted' then
    if v_invite.accepted_account_id = auth.uid() then
      return;
    end if;
    raise exception 'This invitation has already been used';
  end if;

  update public.invites
     set status = 'accepted',
         accepted_account_id = auth.uid(),
         accepted_at = now()
   where id = v_invite.id;
end;
$$;

revoke all on function public.accept_invite(text) from public;
grant execute on function public.accept_invite(text) to authenticated;

-- ---------------------------------------------------------------------------
-- inviter_for_me — who invited the current user (for the application's sponsor)
-- ---------------------------------------------------------------------------
create or replace function public.inviter_for_me()
returns uuid
language sql
security definer
set search_path = public
as $$
  select inviter_id
    from public.invites
   where accepted_account_id = auth.uid()
     and status = 'accepted'
   order by accepted_at desc
   limit 1;
$$;

revoke all on function public.inviter_for_me() from public;
grant execute on function public.inviter_for_me() to authenticated;

-- ---------------------------------------------------------------------------
-- Verify
-- ---------------------------------------------------------------------------
--   select proname from pg_proc where pronamespace='public'::regnamespace
--     and proname in ('get_invite','accept_invite','inviter_for_me');  -- 3 rows
