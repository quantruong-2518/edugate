-- 0010 — additional RLS policies for the `platform_role` pool.
--
-- Context: 0008 enabled RLS on tenant_users with FORCE + a single policy
-- targeting app_role (scoped by app.tenant_id). The platform pool needs to
-- read tenant_users WITHOUT a tenant context to power:
--   • Better-Auth login (find all tenants a user belongs to → /choose-tenant)
--   • POST /v1/me/switch-tenant (verify membership of a target tenant)
--   • The tenant resolver service (looking up tenant_users for SUPER_ADMIN
--     cross-tenant access via /v1/platform/*)
--
-- Without this policy, platform_role has SELECT grant but RLS returns zero
-- rows. SELECT-only policy USING (true) — platform_role can read anything,
-- never write. Mutations stay on app_role under tenant context.

CREATE POLICY tenant_users_platform_read ON tenant_users
  FOR SELECT TO platform_role
  USING (true);
