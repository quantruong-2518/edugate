# Data Model — EduGate (Phase 2)

> Companion to [PRD.md](./PRD.md), [ARCHITECTURE.md](./ARCHITECTURE.md), [API_SPEC.md](./API_SPEC.md).
> Scope: PostgreSQL schema, indexing strategy, Row-Level Security policies, identifier conventions, and migration order. Authoritative TypeScript shapes live in `packages/shared/src/*`; this document is the SQL side and must stay in lockstep.
> Status: Draft v1.0
> Last updated: 2026-05-28

---

## 1. Principles

1. **Every business table has `tenant_id UUID NOT NULL` indexed.** No exceptions. Tables that intentionally span tenants (e.g. `tenants`, `users`, `sessions`) live under a "platform" namespace and are explicitly enumerated in §3.
2. **RLS is the last line of defense.** Every business table enables RLS. Policies read `current_setting('app.tenant_id')::uuid`, which a NestJS interceptor sets per request transaction. App-layer bugs cannot leak cross-tenant data.
3. **IDs are UUIDv7.** Time-ordered for index locality; opaque externally. Human-friendly codes (e.g. `CVA-26-7K3QF2`) are a separate `code` column where parents need to type one.
4. **Soft delete by default** via `deleted_at TIMESTAMPTZ`. Hard delete only after 30 days, via a worker. Audit rows are append-only (no soft delete).
5. **Append-only history.** `application_history` and `audit_log` have no UPDATE / DELETE policy. The only way "out" is via the 30-day retention worker which runs against a separate maintenance role.
6. **JSONB for shape-by-tenant data only.** `tenants.theme`, `form_templates.schema`, `applications.form_data`, `tenant_config.flags`. Everything else is a column.
7. **Timestamps**: `created_at`, `updated_at` on every mutable table; `TIMESTAMPTZ` only, never `TIMESTAMP`. UTC stored; FE converts to `Asia/Ho_Chi_Minh`.
8. **Case-insensitive email** via `citext` extension. Email comparison is per-tenant (one user may have the same email at two tenants).

---

## 2. Identifier conventions

| Kind | Type | Example | Notes |
|---|---|---|---|
| Primary key | `UUID` (v7) | `01J7K0F8...` | `gen_uuid_v7()` function (extension or PL/pgSQL) |
| Tenant FK | `UUID` | — | Always `tenant_id`, always indexed, always NOT NULL on business tables |
| Tenant code | `TEXT` | `cva-edu` | DNS label, lowercase, unique, length 1–63, regex enforced |
| Application code | `TEXT` | `CVA-26-7K3QF2` | Unique per tenant; 6-char suffix from 32-char alphabet → ~1B keyspace per tenant per year |
| Audit ID | `UUID` (v7) | — | Time-ordered helps log scan |
| Currency | (deferred to Fee module) | — | Will be `NUMERIC(15,0)` for VND |

---

## 3. Schema

Below is the Drizzle definition outline; full TypeScript schemas live in `packages/db/src/schema/*.ts`. SQL DDL is what Drizzle migrations produce.

### 3.1 Platform tables (cross-tenant)

#### `tenants`

```sql
CREATE TABLE tenants (
  id              UUID PRIMARY KEY DEFAULT gen_uuid_v7(),
  code            TEXT NOT NULL UNIQUE
                    CHECK (code ~ '^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$'),
  name            TEXT NOT NULL,
  short_name      TEXT NOT NULL,
  logo_url        TEXT,
  theme           JSONB NOT NULL DEFAULT '{}',          -- TenantTheme shape
  modules         TEXT[] NOT NULL DEFAULT ARRAY['admission','platform'],
  status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','suspended','archived')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);
CREATE INDEX tenants_code_active_idx ON tenants(code) WHERE deleted_at IS NULL;
```

`tenants` does NOT enable RLS — it's accessed via a dedicated `platform_role` connection from the tenant-resolver code. App-tier code never touches this table outside the resolver.

#### `users`

```sql
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_uuid_v7(),
  email           CITEXT NOT NULL,                       -- case-insensitive
  password_hash   TEXT,                                  -- nullable for pending activation
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','active','suspended')),
  display_name    TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);
-- Email global-unique on platform users (staff). Parents are anonymous applicants.
CREATE UNIQUE INDEX users_email_active_idx ON users(email) WHERE deleted_at IS NULL;
```

**Decision pending (AQ1 in ARCH)**: case-insensitive email per tenant vs global. Current default = global unique. If we need per-tenant, the unique index becomes `(tenant_id, email)` and `tenant_users.email` carries the per-tenant email.

#### `tenant_users`

```sql
CREATE TABLE tenant_users (
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  roles           TEXT[] NOT NULL CHECK (cardinality(roles) > 0),
  status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('invited','active','suspended')),
  invited_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  activated_at    TIMESTAMPTZ,
  PRIMARY KEY (tenant_id, user_id)
);
CREATE INDEX tenant_users_user_idx ON tenant_users(user_id);
```

`tenant_users` enables RLS — see §4.2.

#### `sessions` (Better-Auth)

Owned by Better-Auth migrations. Includes `user_id`, `active_tenant_id`, `expires_at`, `last_seen_at`, fingerprint.

---

### 3.2 Admission module

#### `admission_campaigns`

```sql
CREATE TABLE admission_campaigns (
  id                UUID PRIMARY KEY DEFAULT gen_uuid_v7(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  code              TEXT NOT NULL,                       -- "intake-2026"
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
```

A trigger enforces "at most one campaign with overlapping window per tenant", since `EXCLUDE USING gist` with `tstzrange` is the clean way:

```sql
ALTER TABLE admission_campaigns
  ADD CONSTRAINT campaigns_no_overlap
  EXCLUDE USING gist (
    tenant_id WITH =,
    tstzrange(opens_at, closes_at, '[)') WITH &&
  )
  WHERE (deleted_at IS NULL);
```

#### `form_templates`

```sql
CREATE TABLE form_templates (
  id            UUID PRIMARY KEY DEFAULT gen_uuid_v7(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  code          TEXT NOT NULL,                          -- "lop6-2026"
  version       INT NOT NULL DEFAULT 1,
  status        TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft','published','archived')),
  schema        JSONB NOT NULL,                         -- FormSchema
  published_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code, version)
);
CREATE INDEX form_templates_published_idx
  ON form_templates(tenant_id, code, version DESC)
  WHERE status = 'published';
```

A form template is **immutable once published**. Editing a published template creates a new `version` row in `draft`; `POST /form-templates/:id/publish` flips the new draft to published and archives the previous one (or leaves it queryable for old applications — see §3.3 `applications.form_template_version`).

#### `applications`

The heart of the admission module. Designed for write-heavy intake bursts and read-heavy review queues.

```sql
CREATE TABLE applications (
  id                      UUID PRIMARY KEY DEFAULT gen_uuid_v7(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id),
  campaign_id             UUID NOT NULL REFERENCES admission_campaigns(id),
  code                    TEXT NOT NULL,                   -- "CVA-26-7K3QF2"
  state                   TEXT NOT NULL
                            CHECK (state IN (
                              'DRAFT','SUBMITTED','UNDER_REVIEW','NEEDS_INFO',
                              'APPROVED','REJECTED','CONFIRMED','ENROLLED',
                              'CANCELLED','EXPIRED'
                            )),
  applicant               JSONB NOT NULL,                  -- Applicant shape
  form_data               JSONB NOT NULL,                  -- per FormSchema
  form_template_id        UUID NOT NULL REFERENCES form_templates(id),
  form_template_version   INT NOT NULL,
  internal_notes          TEXT,                            -- reviewer notes; never in public API
  submitted_at            TIMESTAMPTZ,
  decided_at              TIMESTAMPTZ,
  decided_by_user_id      UUID REFERENCES users(id),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ,
  UNIQUE (tenant_id, code)
);

-- List queries are filtered by (tenant_id, state, created_at desc).
CREATE INDEX applications_tenant_state_created_idx
  ON applications(tenant_id, state, created_at DESC)
  WHERE deleted_at IS NULL;

-- Parent lookups: code is rare-but-hot.
CREATE INDEX applications_tenant_code_idx
  ON applications(tenant_id, code)
  WHERE deleted_at IS NULL;

-- Score range filter (gpa lives in form_data) is hot for admin tables.
CREATE INDEX applications_tenant_gpa_idx
  ON applications(tenant_id, ((form_data->>'gpa')::numeric))
  WHERE deleted_at IS NULL;

-- Search over applicant + student name (accent-insensitive via unaccent).
CREATE INDEX applications_search_idx
  ON applications USING gin(
    to_tsvector('simple',
      unaccent(coalesce(applicant->>'fullName', '') || ' ' ||
               coalesce(form_data->>'studentName', '')))
  )
  WHERE deleted_at IS NULL;
```

`form_template_version` is snapshotted at submission so an old application stays readable even if the template evolves.

#### `application_history`

Append-only audit trail of state transitions. Distinct from cross-resource `audit_log` (§3.5).

```sql
CREATE TABLE application_history (
  id              UUID PRIMARY KEY DEFAULT gen_uuid_v7(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  application_id  UUID NOT NULL REFERENCES applications(id) ON DELETE RESTRICT,
  state           TEXT NOT NULL,
  by_user_id      UUID REFERENCES users(id),               -- NULL for SYSTEM
  by_role         TEXT NOT NULL,                           -- ApplicationRole
  note            TEXT,                                    -- reason on REJECTED / NEEDS_INFO
  at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX application_history_app_at_idx
  ON application_history(application_id, at);
CREATE INDEX application_history_tenant_at_idx
  ON application_history(tenant_id, at DESC);
```

No UPDATE or DELETE policy. The 30-day retention worker uses a maintenance role with explicit DELETE privileges and only deletes rows belonging to deleted parent applications.

#### `reviews`

Reviewer notes and decision payloads, separate from `applications.internal_notes` so multiple reviewers can co-review.

```sql
CREATE TABLE reviews (
  id              UUID PRIMARY KEY DEFAULT gen_uuid_v7(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  application_id  UUID NOT NULL REFERENCES applications(id),
  reviewer_id     UUID NOT NULL REFERENCES users(id),
  verdict         TEXT NOT NULL CHECK (verdict IN ('approve','reject','needs_info','noop')),
  reason          TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (application_id, reviewer_id, created_at)
);
CREATE INDEX reviews_app_idx ON reviews(application_id);
```

#### `notification_templates`

```sql
CREATE TABLE notification_templates (
  id           UUID PRIMARY KEY DEFAULT gen_uuid_v7(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  kind         TEXT NOT NULL
                 CHECK (kind IN ('otp','application_received','application_approved',
                                 'application_rejected','application_needs_info','custom')),
  channel      TEXT NOT NULL CHECK (channel IN ('email')),
  subject      TEXT NOT NULL,
  body         TEXT NOT NULL,                              -- Handlebars-like {{var}}
  is_default   BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, kind, channel) WHERE is_default = true
);
```

A tenant without a custom template falls back to the platform default (resolved in app code, not DB).

---

### 3.3 Auth & OTP

#### `otp_codes`

```sql
CREATE TABLE otp_codes (
  id              UUID PRIMARY KEY DEFAULT gen_uuid_v7(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  email           CITEXT NOT NULL,
  code_hash       TEXT NOT NULL,                           -- argon2id of the 6-digit code
  purpose         TEXT NOT NULL DEFAULT 'application'
                    CHECK (purpose IN ('application')),
  attempts        INT NOT NULL DEFAULT 0,
  consumed_at     TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX otp_codes_tenant_email_active_idx
  ON otp_codes(tenant_id, email)
  WHERE consumed_at IS NULL AND expires_at > now();
```

After 5 failed `attempts` within 15 min, the `email` is locked for OTP (enforced by app + Redis token-bucket; OTP table keeps the durable record).

#### `password_reset_tokens`

```sql
CREATE TABLE password_reset_tokens (
  id           UUID PRIMARY KEY DEFAULT gen_uuid_v7(),
  user_id      UUID NOT NULL REFERENCES users(id),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),       -- which tenant context this was issued for
  token_hash   TEXT NOT NULL,
  purpose      TEXT NOT NULL CHECK (purpose IN ('reset','set','activate')),
  used_at      TIMESTAMPTZ,
  expires_at   TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX prt_user_active_idx
  ON password_reset_tokens(user_id)
  WHERE used_at IS NULL AND expires_at > now();
```

---

### 3.4 Tenant config

#### `tenant_configs`

A single-row-per-tenant config that the resolver caches.

```sql
CREATE TABLE tenant_configs (
  tenant_id      UUID PRIMARY KEY REFERENCES tenants(id),
  landing        JSONB NOT NULL DEFAULT '{"sections":[]}',  -- LandingConfig
  flags          JSONB NOT NULL DEFAULT '{}',               -- feature flags
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by     UUID REFERENCES users(id)
);
```

`tenants.theme` lives on `tenants` because the resolver reads it before the auth context; `tenant_configs.landing` lives here because it changes more often and is edited by `TENANT_ADMIN`.

---

### 3.5 Audit & platform observability

#### `audit_log`

```sql
CREATE TABLE audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_uuid_v7(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor_user_id   UUID REFERENCES users(id),               -- NULL = SYSTEM
  actor_role      TEXT NOT NULL,
  action          TEXT NOT NULL CHECK (action IN (
                    'create','update','delete','approve','reject',
                    'login','export','state_change','settings_update'
                  )),
  resource        TEXT NOT NULL,                           -- "application" etc
  target_id       UUID,
  target_label    TEXT,                                    -- e.g. "CVA-26-7K3QF2"
  payload         JSONB NOT NULL DEFAULT '{}',             -- before/after diff or context
  request_id      TEXT NOT NULL,
  ip              INET,
  user_agent      TEXT
);
CREATE INDEX audit_log_tenant_at_idx ON audit_log(tenant_id, at DESC);
CREATE INDEX audit_log_tenant_action_at_idx ON audit_log(tenant_id, action, at DESC);
CREATE INDEX audit_log_tenant_actor_at_idx ON audit_log(tenant_id, actor_user_id, at DESC);

-- Free-text search over actor name + target label is handled in app code with a join
-- onto users, not via a tsvector here (audit search volume stays low).
```

`audit_log` enables RLS (§4.4). No UPDATE or DELETE policy — only the maintenance role can prune after 2 years (per NĐ 13/2023 plan).

---

### 3.6 Uploads (file fields)

```sql
CREATE TABLE uploads (
  id            UUID PRIMARY KEY DEFAULT gen_uuid_v7(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  owner_user_id UUID REFERENCES users(id),                 -- NULL for anonymous applicant
  owner_app_id  UUID REFERENCES applications(id),
  bucket        TEXT NOT NULL,
  object_key    TEXT NOT NULL,
  mime          TEXT NOT NULL,
  size_bytes    BIGINT NOT NULL CHECK (size_bytes BETWEEN 1 AND 10485760), -- 10 MiB
  sha256        TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'uploaded'
                  CHECK (status IN ('uploaded','scanning','clean','quarantined')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX uploads_app_idx ON uploads(owner_app_id);
CREATE INDEX uploads_tenant_status_idx ON uploads(tenant_id, status);
```

Files are stored in R2 / MinIO under `tenant/<tenant_id>/applications/<application_id>/<upload_id>`. The DB row is the source of truth for metadata + status. An async ClamAV scan flips `status` from `uploaded` → `clean` or `quarantined`.

---

### 3.7 Jobs (async work)

```sql
CREATE TABLE jobs (
  id            UUID PRIMARY KEY DEFAULT gen_uuid_v7(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  kind          TEXT NOT NULL,                             -- "export.applications" etc
  status        TEXT NOT NULL DEFAULT 'queued'
                  CHECK (status IN ('queued','running','succeeded','failed')),
  payload       JSONB NOT NULL DEFAULT '{}',
  result        JSONB,
  error         TEXT,
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at    TIMESTAMPTZ,
  finished_at   TIMESTAMPTZ
);
CREATE INDEX jobs_tenant_status_idx ON jobs(tenant_id, status);
```

BullMQ holds the live queue (in Redis); `jobs` is the durable record for the user-facing job status page.

---

## 4. Row-Level Security policies

### 4.1 Roles

Three Postgres roles, attached to three connection pools:

| Role | Granted to | Privileges |
|---|---|---|
| `app_role` | NestJS API connection pool | DML on business tables; subject to RLS |
| `platform_role` | NestJS resolver pool (tenant lookup only) | SELECT on `tenants`, `tenant_users`; bypasses RLS for those |
| `maintenance_role` | Migration & retention worker | DDL + DML; BYPASSRLS; never used by request-handling code |

### 4.2 Standard tenant policy (applied to every business table)

```sql
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications FORCE ROW LEVEL SECURITY;        -- even for the owner

CREATE POLICY tenant_isolation_select ON applications
  FOR SELECT TO app_role
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_isolation_modify ON applications
  FOR ALL TO app_role
  USING      (tenant_id = current_setting('app.tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
```

The same template applies to `admission_campaigns`, `form_templates`, `application_history`, `reviews`, `notification_templates`, `tenant_configs`, `tenant_users`, `otp_codes`, `password_reset_tokens`, `uploads`, `jobs`. Codegen produces them all from a single Drizzle migration helper.

### 4.3 Append-only policy

```sql
-- application_history: no UPDATE / DELETE from app_role.
CREATE POLICY history_no_modify ON application_history
  FOR UPDATE TO app_role USING (false) WITH CHECK (false);
CREATE POLICY history_no_delete ON application_history
  FOR DELETE TO app_role USING (false);
```

Same for `audit_log`.

### 4.4 SUPER_ADMIN cross-tenant

`SUPER_ADMIN` requests do **not** bypass RLS by default. They go through `/v1/platform/*` endpoints which:

1. Authenticate the SUPER_ADMIN.
2. Run inside a transaction WITHOUT `SET LOCAL app.tenant_id` — every query must explicitly carry tenant filters, code-reviewed at the endpoint layer.
3. Audit-log every access with elevated severity.

This deliberately keeps RLS strict; cross-tenant access is a route-level capability, not a transparent superuser path. Trade-off chosen because (a) cross-tenant queries are rare, (b) accidentally leaking with a superuser pool is the highest-blast-radius failure mode.

### 4.5 Setting `app.tenant_id`

NestJS interceptor (sketch):

```ts
@Injectable()
export class TenantTxInterceptor implements NestInterceptor {
  constructor(private readonly db: NodePgDatabase) {}
  intercept(ctx: ExecutionContext, next: CallHandler) {
    const req = ctx.switchToHttp().getRequest();
    const tenantId = req.tenant?.id;
    if (!tenantId) throw new ForbiddenException('TENANT_REQUIRED');

    return from(this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.tenant_id', ${tenantId}, true)`);
      // 'true' = local to transaction; falls out when tx commits/rolls back.
      req.tx = tx;
      return await firstValueFrom(next.handle());
    }));
  }
}
```

Every repository inside the request reads `req.tx` instead of the global pool. The interceptor is global; opt-out via `@SkipTenantTx()` decorator (used only on `/v1/auth/*` and `/v1/platform/*`).

---

## 5. Indexing strategy summary

| Pattern | Index |
|---|---|
| Tenant + state + recency (admin list) | `(tenant_id, state, created_at DESC)` |
| Tenant + code (parent track) | `(tenant_id, code)` |
| Tenant + score range | expression index on `(tenant_id, (form_data->>'gpa')::numeric)` |
| Free-text search | GIN on tsvector of unaccented applicant + student name |
| Audit by time | `(tenant_id, at DESC)` |
| Audit by actor | `(tenant_id, actor_user_id, at DESC)` |
| OTP active rows | partial index `WHERE consumed_at IS NULL AND expires_at > now()` |

Partial indexes (`WHERE deleted_at IS NULL`) keep hot indexes small as soft-deleted rows pile up.

---

## 6. Migration order (first deploy)

Drizzle migrations under `packages/db/migrations`:

```
0001_extensions.sql          -- citext, unaccent, btree_gist; uuid v7 helper
0002_platform_tables.sql     -- tenants, users, tenant_users, sessions
0003_admission_tables.sql    -- campaigns, form_templates, applications, history, reviews
0004_auth_tables.sql         -- otp_codes, password_reset_tokens, notification_templates
0005_tenant_config.sql       -- tenant_configs
0006_audit.sql               -- audit_log + append-only policies
0007_uploads_jobs.sql        -- uploads, jobs
0008_rls.sql                 -- enable RLS + policies (idempotent — codegen)
0009_seed_platform.sql       -- platform fixtures: pilot tenant, super admin
```

Migrations are forward-only with safe defaults (NOT NULL columns get a default for the migration window, then the default is dropped in a follow-up). Every migration carries a down script for emergency rollback; in practice we roll forward.

---

## 7. Audit interceptor

Phase 2 NestJS interceptor writes an `audit_log` row after every successful mutation:

```ts
// outline
await this.tx.insert(auditLog).values({
  tenantId,
  actorUserId: actor.id,
  actorRole: actor.activeRole,
  action: inferAction(method, controller),      // POST → create, PATCH → update, ...
  resource: routeResource,                       // from @Audit('application')
  targetId: result?.id,
  targetLabel: result?.code ?? result?.name,
  payload: diff(before, after),                  // for update; before+after JSON; for create: after only
  requestId: req.id,
  ip: req.ip,
  userAgent: req.headers['user-agent'],
});
```

Controllers tag their resource and any sensitive payload-omission rules via decorators:

```ts
@Audit({ resource: 'application', omit: ['formData'] })
@Patch(':id')
async update(...) { ... }
```

PII reduction: `payload` on `users` mutations stores only the changed field names, not values, for password / contact updates.

---

## 8. Backups & retention

| Asset | Backup | Retention |
|---|---|---|
| Postgres (full + WAL) | `pgbackrest` nightly full + 5-min WAL → VN-located object bucket | 30 days online, 1 year cold |
| Object storage (uploads) | R2/MinIO replication to VN bucket | Tied to application retention |
| Audit log | Same as Postgres backup | 2 years (NĐ 13/2023 alignment), then archived to cold storage |
| Applications | Same | Soft-deleted after intake close + 6 months; hard-deleted after 30 days soft-delete |

Quarterly restore drill: spin up an isolated environment from last night's backup, verify a known tenant can be read, tear down.

---

## 9. Data volume projection (pilot → year 1)

| Entity | Pilot (1 tenant) | Year 1 (50 tenants avg 800 apps) |
|---|---|---|
| tenants | 1 | 50 |
| users | 20 | 1,500 |
| applications | 800 | 40,000 |
| application_history | 5,000 | 250,000 |
| audit_log | 50,000 | 3M |
| uploads | 4,000 | 200,000 |

Audit and history are the only tables likely to need partitioning before year 3. Plan: `RANGE` partition `audit_log` by month if the active partition exceeds 50M rows; deferred until measured.

---

## 10. Open questions

| # | Question | Resolution path |
|---|---|---|
| Q1 | User email global-unique vs per-tenant | Spike during pilot; if friction observed (one person needing two `a@school.vn` accounts), switch to per-tenant unique. |
| Q2 | Cursor format for list APIs | Backend choice; default opaque base64 `{ createdAt, id }`. |
| Q3 | When to partition `audit_log` | Monitor; trigger at 30M rows in active partition. |
| Q4 | Use `pgcrypto` for password reset tokens vs argon2id app-side | Default: argon2id app-side. Postgres hash exposes timing if misused. |
| Q5 | `form_template` archival — keep all versions forever or prune unused? | Keep — disk is cheap, audit value is high. |
| Q6 | Multi-region (read replica in another VN city) for DR | Out of scope until 100+ tenants. |
| Q7 | uuid v7 function — extension (`pg_uuidv7`) vs PL/pgSQL | Prefer extension when available on managed VN hosting; PL/pgSQL fallback. |

---

## 11. Reference

- TS types: `packages/shared/src/admission/`, `packages/shared/src/auth/`, `packages/shared/src/audit/`, `packages/shared/src/form/`, `packages/shared/src/landing/`, `packages/shared/src/theme.ts`, `packages/shared/src/branding.ts`, `packages/shared/src/tenant.ts`.
- State machine: [docs/STATE_MACHINE.md](../docs/STATE_MACHINE.md)
- Permission matrix: [docs/PERMISSIONS.md](../docs/PERMISSIONS.md)
- API contract: [specs/API_SPEC.md](./API_SPEC.md)
- Architecture: [specs/ARCHITECTURE.md](./ARCHITECTURE.md)
- Threat model: [specs/THREAT_MODEL.md](./THREAT_MODEL.md)
