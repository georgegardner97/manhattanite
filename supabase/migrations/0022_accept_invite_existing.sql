-- Migration 0022: accept_invite covers existing accounts too — Invite Stage 4.
--
-- The Stage-2 accept_invite assumed a brand-new signup (no application yet, so
-- /apply set sponsor_id via inviter_for_me). But "I signed up first, then a
-- friend invited me" is a common case: that account may ALREADY have a pending
-- application with no sponsor. So accept_invite now also back-fills the inviter
-- onto the caller's pending application when one exists and has no sponsor yet.
--
-- New signups still hit zero rows here (no app yet) and pick the sponsor up at
-- /apply — unchanged. Idempotent re-accept by the same account also re-applies
-- the back-fill, so the sponsor can never be lost to ordering.
--
-- create or replace preserves the existing grant (authenticated).

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

  if v_invite.status = 'accepted' then
    if v_invite.accepted_account_id = auth.uid() then
      -- Idempotent: still ensure a pending application carries the sponsor.
      update public.applications
         set sponsor_id = v_invite.inviter_id
       where account_id = auth.uid()
         and status = 'pending'
         and sponsor_id is null;
      return;
    end if;
    raise exception 'This invitation has already been used';
  end if;

  update public.invites
     set status = 'accepted',
         accepted_account_id = auth.uid(),
         accepted_at = now()
   where id = v_invite.id;

  -- Back-fill the inviter onto an already-submitted pending application
  -- ("signed up first, invited later"). No-op for a fresh signup (no app yet).
  update public.applications
     set sponsor_id = v_invite.inviter_id
   where account_id = auth.uid()
     and status = 'pending'
     and sponsor_id is null;
end;
$$;

revoke all on function public.accept_invite(text) from public;
grant execute on function public.accept_invite(text) to authenticated;
