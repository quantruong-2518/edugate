-- 0003 — admission module tables.
-- Order: form_templates (no FK) → admission_campaigns (FK to form_templates)
--      → applications (FK to both) → application_history → reviews
--      → notification_templates.

-- ----------------------------------------------------------------------------
-- form_templates — versioned JSON-schema for the application form. Once a
-- template is bound to an open campaign with submissions, editing forks a
-- new version (immutable history).
-- ----------------------------------------------------------------------------
CREATE TABLE form_templates (
  id            UUID PRIMARY KEY DEFAULT gen_uuid_v7(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  code          TEXT NOT NULL,
  version       INT NOT NULL DEFAULT 1,
  status        TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft','published','archived')),
  schema        JSONB NOT NULL,
  published_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code, version)
);
CREATE INDEX form_templates_published_idx
  ON form_templates(tenant_id, code, version DESC)
  WHERE status = 'published';

GRANT SELECT, INSERT, UPDATE, DELETE ON form_templates TO app_role;

-- ----------------------------------------------------------------------------
-- admission_campaigns — per-tenant intake windows. Exclusion constraint
-- prevents two open campaigns from overlapping in time for the same tenant.
-- ----------------------------------------------------------------------------
CREATE TABLE admission_campaigns (
  id                UUID PRIMARY KEY DEFAULT gen_uuid_v7(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  code              TEXT NOT NULL,
  name              TEXT NOT NULL,
  opens_at          TIMESTAMPTZ NOT NULL,
  closes_at         TIMESTAMPTZ NOT NULL,
  form_template_id  UUID NOT NULL REFERENCES form_templates(id),
  status            TEXT NOT NULL DEFAULT 'scheduled'
                      CHECK (status IN ('scheduled','open','closed','archived')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ,
  UNIQUE (tenant_id, code),
  CHECK (closes_at > opens_at)
);
CREATE INDEX campaigns_tenant_window_idx
  ON admission_campaigns(tenant_id, opens_at, closes_at)
  WHERE deleted_at IS NULL;

ALTER TABLE admission_campaigns
  ADD CONSTRAINT campaigns_no_overlap
  EXCLUDE USING gist (
    tenant_id WITH =,
    tstzrange(opens_at, closes_at, '[)') WITH &&
  )
  WHERE (deleted_at IS NULL);

GRANT SELECT, INSERT, UPDATE, DELETE ON admission_campaigns TO app_role;

-- ----------------------------------------------------------------------------
-- applications — the core entity. `form_template_version` is snapshotted so
-- an application remains readable against the schema it was submitted under,
-- even if the template later evolves.
-- ----------------------------------------------------------------------------
CREATE TABLE applications (
  id                      UUID PRIMARY KEY DEFAULT gen_uuid_v7(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id),
  campaign_id             UUID NOT NULL REFERENCES admission_campaigns(id),
  code                    TEXT NOT NULL,
  state                   TEXT NOT NULL
                            CHECK (state IN (
                              'DRAFT','SUBMITTED','UNDER_REVIEW','NEEDS_INFO',
                              'APPROVED','REJECTED','CONFIRMED','ENROLLED',
                              'CANCELLED','EXPIRED'
                            )),
  applicant               JSONB NOT NULL,
  form_data               JSONB NOT NULL,
  form_template_id        UUID NOT NULL REFERENCES form_templates(id),
  form_template_version   INT NOT NULL,
  internal_notes          TEXT,
  submitted_at            TIMESTAMPTZ,
  decided_at              TIMESTAMPTZ,
  decided_by_user_id      UUID REFERENCES users(id),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ,
  UNIQUE (tenant_id, code)
);
CREATE INDEX applications_tenant_state_created_idx
  ON applications(tenant_id, state, created_at DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX applications_tenant_code_idx
  ON applications(tenant_id, code)
  WHERE deleted_at IS NULL;
CREATE INDEX applications_tenant_gpa_idx
  ON applications(tenant_id, ((form_data->>'gpa')::numeric))
  WHERE deleted_at IS NULL;
CREATE INDEX applications_search_idx
  ON applications USING gin(
    to_tsvector('simple',
      immutable_unaccent(coalesce(applicant->>'fullName','') || ' ' ||
                         coalesce(form_data->>'studentName','')))
  )
  WHERE deleted_at IS NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON applications TO app_role;

-- ----------------------------------------------------------------------------
-- application_history — append-only audit of every state change for one
-- application. Distinct from cross-resource audit_log (0006).
-- ----------------------------------------------------------------------------
CREATE TABLE application_history (
  id              UUID PRIMARY KEY DEFAULT gen_uuid_v7(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  application_id  UUID NOT NULL REFERENCES applications(id) ON DELETE RESTRICT,
  state           TEXT NOT NULL,
  by_user_id      UUID REFERENCES users(id),
  by_role         TEXT NOT NULL,
  note            TEXT,
  at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX application_history_app_at_idx
  ON application_history(application_id, at);
CREATE INDEX application_history_tenant_at_idx
  ON application_history(tenant_id, at DESC);

-- Append-only at app layer (enforced by RLS policy in 0008).
GRANT SELECT, INSERT ON application_history TO app_role;

-- ----------------------------------------------------------------------------
-- reviews — multiple reviewers may co-review one application; each row is one
-- reviewer's verdict at one point in time.
-- ----------------------------------------------------------------------------
CREATE TABLE reviews (
  id              UUID PRIMARY KEY DEFAULT gen_uuid_v7(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  application_id  UUID NOT NULL REFERENCES applications(id),
  reviewer_id     UUID NOT NULL REFERENCES users(id),
  verdict         TEXT NOT NULL
                    CHECK (verdict IN ('approve','reject','needs_info','noop')),
  reason          TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (application_id, reviewer_id, created_at)
);
CREATE INDEX reviews_app_idx ON reviews(application_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON reviews TO app_role;

-- ----------------------------------------------------------------------------
-- notification_templates — per-tenant email templates by kind+channel.
-- ----------------------------------------------------------------------------
CREATE TABLE notification_templates (
  id           UUID PRIMARY KEY DEFAULT gen_uuid_v7(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  kind         TEXT NOT NULL
                 CHECK (kind IN (
                   'otp','application_received','application_approved',
                   'application_rejected','application_needs_info','custom'
                 )),
  channel      TEXT NOT NULL CHECK (channel IN ('email')),
  subject      TEXT NOT NULL,
  body         TEXT NOT NULL,
  is_default   BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX notification_templates_default_idx
  ON notification_templates(tenant_id, kind, channel)
  WHERE is_default = true;

GRANT SELECT, INSERT, UPDATE, DELETE ON notification_templates TO app_role;
