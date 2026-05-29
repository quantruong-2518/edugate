-- 0006 — cross-resource audit ledger. One row per successful mutation, written
-- by the AuditInterceptor (P2.3). Append-only at app layer (RLS in 0008).
-- Indexed for the three filter modes the admin viewer uses: by time, by
-- action, by actor.

CREATE TABLE audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_uuid_v7(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor_user_id   UUID REFERENCES users(id),                -- NULL = SYSTEM
  actor_role      TEXT NOT NULL,
  action          TEXT NOT NULL CHECK (action IN (
                    'create','update','delete','approve','reject',
                    'login','export','state_change','settings_update'
                  )),
  resource        TEXT NOT NULL,
  target_id       UUID,
  target_label    TEXT,
  payload         JSONB NOT NULL DEFAULT '{}'::jsonb,
  request_id      TEXT NOT NULL,
  ip              INET,
  user_agent      TEXT
);
CREATE INDEX audit_log_tenant_at_idx        ON audit_log(tenant_id, at DESC);
CREATE INDEX audit_log_tenant_action_at_idx ON audit_log(tenant_id, action, at DESC);
CREATE INDEX audit_log_tenant_actor_at_idx  ON audit_log(tenant_id, actor_user_id, at DESC);

-- App layer can INSERT and SELECT but cannot UPDATE/DELETE (RLS reinforces).
GRANT SELECT, INSERT ON audit_log TO app_role;
