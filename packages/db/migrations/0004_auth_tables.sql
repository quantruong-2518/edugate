-- 0004 — auth artifacts: OTP codes (parents) + password reset/activation tokens (staff).
-- Better-Auth sessions land in a separate migration when we wire it (P2.6).

CREATE TABLE otp_codes (
  id          UUID PRIMARY KEY DEFAULT gen_uuid_v7(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  email       CITEXT NOT NULL,
  code_hash   TEXT NOT NULL,                   -- argon2id of the 6-digit code
  purpose     TEXT NOT NULL DEFAULT 'application'
                CHECK (purpose IN ('application')),
  attempts    INT NOT NULL DEFAULT 0,
  consumed_at TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Index covers unconsumed OTPs; expiry filter is applied at query time
-- (now() isn't IMMUTABLE so it can't appear in an index predicate).
CREATE INDEX otp_codes_tenant_email_active_idx
  ON otp_codes(tenant_id, email, expires_at)
  WHERE consumed_at IS NULL;

GRANT SELECT, INSERT, UPDATE ON otp_codes TO app_role;

CREATE TABLE password_reset_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_uuid_v7(),
  user_id     UUID NOT NULL REFERENCES users(id),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  token_hash  TEXT NOT NULL,
  purpose     TEXT NOT NULL CHECK (purpose IN ('reset','set','activate')),
  used_at     TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX prt_user_active_idx
  ON password_reset_tokens(user_id, expires_at)
  WHERE used_at IS NULL;

GRANT SELECT, INSERT, UPDATE ON password_reset_tokens TO app_role;
