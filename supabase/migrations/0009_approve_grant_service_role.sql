-- Migration 0009: let the service_role call approve_application
-- Phase 2 Slice C — CLI approval script (scripts/approve-application.ts)
--
-- approve_application() is SECURITY DEFINER and migration 0008 ran
-- `revoke all on function ... from public`, which stripped the default EXECUTE
-- grant from every role (service_role included). The Slice C approve script
-- connects with the service-role key via supabase-js rpc(), so it needs EXECUTE
-- back — but ONLY for service_role, not for `authenticated` or `anon`. The
-- Tier 1/Tier 2 wall is unchanged: ordinary users still cannot call this.
--
-- The function body is unchanged. It remains SECURITY DEFINER (runs as owner),
-- and the protect_account_columns trigger (0001) already lets the service role
-- through (auth.uid() is null → returns new), so approval writes is_member +
-- sponsor_id exactly as the SQL-editor path does today.

grant execute on function public.approve_application(uuid, uuid) to service_role;

-- Verify with:
--   select has_function_privilege(
--     'service_role',
--     'public.approve_application(uuid, uuid)',
--     'execute'
--   );  -- expect: t
