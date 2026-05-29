-- 0007 — uploads (file metadata; bytes live in R2/MinIO) + jobs (durable
-- record for async work tracked in BullMQ).

CREATE TABLE uploads (
  id              UUID PRIMARY KEY DEFAULT gen_uuid_v7(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  owner_user_id   UUID REFERENCES users(id),
  owner_app_id    UUID REFERENCES applications(id),
  bucket          TEXT NOT NULL,
  object_key      TEXT NOT NULL,
  mime            TEXT NOT NULL,
  size_bytes      BIGINT NOT NULL CHECK (size_bytes BETWEEN 1 AND 10485760),
  sha256          TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'uploaded'
                    CHECK (status IN ('uploaded','scanning','clean','quarantined')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX uploads_app_idx           ON uploads(owner_app_id);
CREATE INDEX uploads_tenant_status_idx ON uploads(tenant_id, status);

GRANT SELECT, INSERT, UPDATE ON uploads TO app_role;

CREATE TABLE jobs (
  id           UUID PRIMARY KEY DEFAULT gen_uuid_v7(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  kind         TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'queued'
                 CHECK (status IN ('queued','running','succeeded','failed')),
  payload      JSONB NOT NULL DEFAULT '{}'::jsonb,
  result       JSONB,
  error        TEXT,
  created_by   UUID REFERENCES users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at   TIMESTAMPTZ,
  finished_at  TIMESTAMPTZ
);
CREATE INDEX jobs_tenant_status_idx ON jobs(tenant_id, status);

GRANT SELECT, INSERT, UPDATE ON jobs TO app_role;
