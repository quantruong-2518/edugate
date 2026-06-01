-- 0021 — let app_role mutate its own tenants row for branding/landing edits.
-- Until now `tenants` was read-only for app_role (0002: GRANT SELECT only) and
-- writes went through maintenance_role. The admin slice (P2.9) lets a
-- TENANT_ADMIN edit logo + theme from /admin/settings, so app_role needs a
-- narrow, tenant-scoped UPDATE path. RLS guarantees a tenant can't touch
-- another tenant's row even if a query author forgets the WHERE clause.

-- Column-level UPDATE: only branding-relevant fields are mutable by app_role.
-- code/modules/status stay maintenance-only — those are platform decisions.
GRANT UPDATE (logo_url, theme, short_name, name, updated_at) ON tenants TO app_role;

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants FORCE ROW LEVEL SECURITY;

-- Resolver runs as platform_role before tenant context is set → must see all
-- tenants regardless of app.tenant_id (which is empty on that pool).
CREATE POLICY tenants_platform_all ON tenants
  FOR ALL TO platform_role
  USING      (true)
  WITH CHECK (true);

-- app_role: read only its own live row.
CREATE POLICY tenants_app_select ON tenants
  FOR SELECT TO app_role
  USING (id = app_current_tenant() AND deleted_at IS NULL);

-- app_role: update only its own row.
CREATE POLICY tenants_app_update ON tenants
  FOR UPDATE TO app_role
  USING      (id = app_current_tenant())
  WITH CHECK (id = app_current_tenant());

-- maintenance_role bypasses RLS (BYPASSRLS attribute on the role) so seed
-- + migration paths still work unchanged.
