-- 0008 — Row-Level Security policies for every business table.
-- Reads `current_setting('app.tenant_id')::uuid`, which the NestJS
-- TenantTxInterceptor (P2.3) sets via SET LOCAL per request transaction.
-- maintenance_role has BYPASSRLS (see 0001) so migrations + retention
-- workers cross tenant boundaries safely.

-- Helper: a session is "tenant-scoped" iff app.tenant_id is set to a UUID.
-- We deliberately fail with a hard error when a request reaches a table
-- without it set — this is the "did the interceptor run?" alarm.
-- Custom Postgres parameters return '' when unset (rather than throwing) so
-- we check explicitly and raise our own ERRCODE = '42501' (insufficient
-- privilege) for the NestJS filter to map to 403.
CREATE OR REPLACE FUNCTION app_current_tenant() RETURNS uuid AS $$
DECLARE
  v text;
BEGIN
  v := current_setting('app.tenant_id', true);
  IF v IS NULL OR v = '' THEN
    RAISE EXCEPTION
      'app.tenant_id not set: TenantTxInterceptor must run before tenant-scoped queries'
      USING ERRCODE = '42501';
  END IF;
  RETURN v::uuid;
END;
$$ LANGUAGE plpgsql STABLE;

-- ----------------------------------------------------------------------------
-- Standard policy template — applied to every business table.
-- FORCE so the table owner (maintenance_role) ALSO obeys the policy via
-- app_role; only true BYPASSRLS sessions skip it.
-- ----------------------------------------------------------------------------

ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_users_isolation ON tenant_users
  FOR ALL TO app_role
  USING      (tenant_id = app_current_tenant())
  WITH CHECK (tenant_id = app_current_tenant());

ALTER TABLE form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_templates FORCE ROW LEVEL SECURITY;
CREATE POLICY form_templates_isolation ON form_templates
  FOR ALL TO app_role
  USING      (tenant_id = app_current_tenant())
  WITH CHECK (tenant_id = app_current_tenant());

ALTER TABLE admission_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE admission_campaigns FORCE ROW LEVEL SECURITY;
CREATE POLICY admission_campaigns_isolation ON admission_campaigns
  FOR ALL TO app_role
  USING      (tenant_id = app_current_tenant())
  WITH CHECK (tenant_id = app_current_tenant());

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications FORCE ROW LEVEL SECURITY;
CREATE POLICY applications_isolation ON applications
  FOR ALL TO app_role
  USING      (tenant_id = app_current_tenant())
  WITH CHECK (tenant_id = app_current_tenant());

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews FORCE ROW LEVEL SECURITY;
CREATE POLICY reviews_isolation ON reviews
  FOR ALL TO app_role
  USING      (tenant_id = app_current_tenant())
  WITH CHECK (tenant_id = app_current_tenant());

ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates FORCE ROW LEVEL SECURITY;
CREATE POLICY notification_templates_isolation ON notification_templates
  FOR ALL TO app_role
  USING      (tenant_id = app_current_tenant())
  WITH CHECK (tenant_id = app_current_tenant());

ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes FORCE ROW LEVEL SECURITY;
CREATE POLICY otp_codes_isolation ON otp_codes
  FOR ALL TO app_role
  USING      (tenant_id = app_current_tenant())
  WITH CHECK (tenant_id = app_current_tenant());

ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens FORCE ROW LEVEL SECURITY;
CREATE POLICY password_reset_tokens_isolation ON password_reset_tokens
  FOR ALL TO app_role
  USING      (tenant_id = app_current_tenant())
  WITH CHECK (tenant_id = app_current_tenant());

ALTER TABLE tenant_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_configs FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_configs_isolation ON tenant_configs
  FOR ALL TO app_role
  USING      (tenant_id = app_current_tenant())
  WITH CHECK (tenant_id = app_current_tenant());

ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads FORCE ROW LEVEL SECURITY;
CREATE POLICY uploads_isolation ON uploads
  FOR ALL TO app_role
  USING      (tenant_id = app_current_tenant())
  WITH CHECK (tenant_id = app_current_tenant());

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs FORCE ROW LEVEL SECURITY;
CREATE POLICY jobs_isolation ON jobs
  FOR ALL TO app_role
  USING      (tenant_id = app_current_tenant())
  WITH CHECK (tenant_id = app_current_tenant());

-- ----------------------------------------------------------------------------
-- Append-only tables — SELECT + INSERT only, no UPDATE / DELETE for app_role.
-- Retention prune runs as maintenance_role (BYPASSRLS) on a schedule.
-- ----------------------------------------------------------------------------

ALTER TABLE application_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_history FORCE ROW LEVEL SECURITY;
CREATE POLICY application_history_select ON application_history
  FOR SELECT TO app_role
  USING (tenant_id = app_current_tenant());
CREATE POLICY application_history_insert ON application_history
  FOR INSERT TO app_role
  WITH CHECK (tenant_id = app_current_tenant());
-- No UPDATE / DELETE policy → those operations are silently filtered to zero
-- rows even if app_role had the grant. We don't grant U/D in 0003 so this is
-- defense-in-depth.

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log FORCE ROW LEVEL SECURITY;
CREATE POLICY audit_log_select ON audit_log
  FOR SELECT TO app_role
  USING (tenant_id = app_current_tenant());
CREATE POLICY audit_log_insert ON audit_log
  FOR INSERT TO app_role
  WITH CHECK (tenant_id = app_current_tenant());
