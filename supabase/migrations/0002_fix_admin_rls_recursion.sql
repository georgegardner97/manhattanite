-- Migration 0002: fix RLS infinite recursion on accounts
--
-- The admin policies in 0001 did `exists (select 1 from public.accounts where
-- ... role = 'admin')` from inside a policy on public.accounts itself. Postgres
-- recursively applies RLS to the inner query → error 42P17 (infinite recursion).
-- The error short-circuits the entire policy evaluation, so even the "read own
-- row" policy (which would have allowed access) never gets a chance.
--
-- Standard Supabase fix: move the role lookup into a SECURITY DEFINER function.
-- The function runs as its owner, bypassing RLS on the inner query, so no
-- recursion. Same enforcement, no recursion.
--
-- Same fix applied to the protect_account_columns trigger, which also queried
-- public.accounts from inside an UPDATE — would have hit the same recursion
-- the first time a non-admin user edited their own profile.

-- ---------------------------------------------------------------------------
-- 1. is_admin() — RLS-bypassing helper
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.accounts
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Recreate admin policies using is_admin()
-- ---------------------------------------------------------------------------
drop policy if exists "accounts: admin reads all"   on public.accounts;
drop policy if exists "accounts: admin updates all" on public.accounts;

create policy "accounts: admin reads all"
  on public.accounts
  for select
  using (public.is_admin());

create policy "accounts: admin updates all"
  on public.accounts
  for update
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 3. Same fix for protect_account_columns trigger
-- ---------------------------------------------------------------------------
-- The trigger function in 0001 did `select role from public.accounts where
-- id = auth.uid()` while running as the authenticated user — same recursion
-- risk on every non-admin UPDATE. SECURITY DEFINER bypasses RLS for that
-- lookup. Body is otherwise identical to 0001.
create or replace function public.protect_account_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_role public.account_role;
begin
  if auth.uid() is null then
    return new;
  end if;

  select role into caller_role from public.accounts where id = auth.uid();

  if caller_role = 'admin' then
    return new;
  end if;

  if new.role       is distinct from old.role       then raise exception 'role is protected'; end if;
  if new.is_member  is distinct from old.is_member  then raise exception 'is_member is protected'; end if;
  if new.sponsor_id is distinct from old.sponsor_id then raise exception 'sponsor_id is protected'; end if;
  if new.email      is distinct from old.email      then raise exception 'email is protected'; end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Verify with:
--    set local role authenticated;
--    set local "request.jwt.claims" = '{"sub": "<a-real-user-uuid>", "role": "authenticated"}';
--    select * from public.accounts where id = '<that-uuid>';
--    -- should return the row, not 42P17
-- ---------------------------------------------------------------------------
