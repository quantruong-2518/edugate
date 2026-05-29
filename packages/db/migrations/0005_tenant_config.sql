-- 0005 — per-tenant config row (landing + feature flags).
-- Branding/theme lives on tenants.theme because the resolver reads it before
-- the auth context exists. Landing changes more often and is edited by
-- TENANT_ADMIN, so it lives here.

CREATE TABLE tenant_configs (
  tenant_id   UUID PRIMARY KEY REFERENCES tenants(id),
  landing     JSONB NOT NULL DEFAULT '{"sections":[]}'::jsonb,
  flags       JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by  UUID REFERENCES users(id)
);

GRANT SELECT, INSERT, UPDATE ON tenant_configs TO app_role;
