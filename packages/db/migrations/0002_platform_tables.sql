-- 0002 — platform-scope tables: tenants, users, tenant_users.
-- These tables do NOT enable RLS (per DATA_MODEL §3.1):
--   tenants/users — read by the resolver before tenant context exists
--   tenant_users — RLS is added in 0008 so app_role reads only its own rows

-- ----------------------------------------------------------------------------
-- tenants — one row per school. Resolver reads by `code`. `theme` is the
-- JSONB blob TenantBranding writes (see packages/shared/src/theme.ts).
-- ----------------------------------------------------------------------------
CREATE TABLE tenants (
  id          UUID PRIMARY KEY DEFAULT gen_uuid_v7(),
  code        TEXT NOT NULL UNIQUE
                CHECK (code ~ '^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$'),
  name        TEXT NOT NULL,
  short_name  TEXT NOT NULL,
  logo_url    TEXT,
  theme       JSONB NOT NULL DEFAULT '{}'::jsonb,
  modules     TEXT[] NOT NULL DEFAULT ARRAY['admission','platform']::TEXT[],
  status      TEXT NOT NULL DEFAULT 'active'
                CHECK (status IN ('active','suspended','archived')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ
);
CREATE INDEX tenants_code_active_idx
  ON tenants(code) WHERE deleted_at IS NULL;

GRANT SELECT ON tenants TO app_role, platform_role;
GRANT INSERT, UPDATE, DELETE ON tenants TO maintenance_role;

-- ----------------------------------------------------------------------------
-- users — staff. Email is case-insensitive (CITEXT), globally unique among
-- non-deleted rows (ADR-011). Parents who submit applications are anonymous
-- and don't land here; their identity lives on applications.applicant.
-- ----------------------------------------------------------------------------
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_uuid_v7(),
  email           CITEXT NOT NULL,
  password_hash   TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','active','suspended')),
  display_name    TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);
CREATE UNIQUE INDEX users_email_active_idx
  ON users(email) WHERE deleted_at IS NULL;

GRANT SELECT ON users TO app_role, platform_role;
GRANT INSERT, UPDATE, DELETE ON users TO app_role;

-- ----------------------------------------------------------------------------
-- tenant_users — many-to-many: a user can staff several tenants. `roles[]` is
-- the active role set for this membership (e.g. ['ADMISSION_ADMIN']).
-- ----------------------------------------------------------------------------
CREATE TABLE tenant_users (
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  user_id       UUID NOT NULL REFERENCES users(id)   ON DELETE RESTRICT,
  roles         TEXT[] NOT NULL CHECK (cardinality(roles) > 0),
  status        TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('invited','active','suspended')),
  invited_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  activated_at  TIMESTAMPTZ,
  PRIMARY KEY (tenant_id, user_id)
);
CREATE INDEX tenant_users_user_idx ON tenant_users(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON tenant_users TO app_role;
GRANT SELECT ON tenant_users TO platform_role;
