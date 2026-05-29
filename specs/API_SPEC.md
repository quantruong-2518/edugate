# API Specification — EduGate (Phase 2)

> Companion to [PRD.md](./PRD.md) and [ARCHITECTURE.md](./ARCHITECTURE.md).
> Scope: the HTTP API the Phase 2 NestJS backend exposes. Phase 1 FE consumes mock seams (`apps/web/lib/api/*.ts`) whose signatures mirror these endpoints — the seams swap to `http.<verb>(...)` calls without touching call sites.
> Status: Draft v1.0
> Last updated: 2026-05-28

---

## 1. Conventions

### 1.1 Base URL & versioning

- Production: `https://api.tuyensinhnhanh.vn`
- Path versioning: `/v1/...`. Breaking changes bump to `/v2/...`; both run side-by-side for at least one admission season.
- FE reads base URL from `NEXT_PUBLIC_API_URL` (default `/api` in dev).

### 1.2 Tenant context

Every business endpoint resolves a tenant. Two-stage:

1. **Header `x-tenant-code`** — set by the FE axios interceptor from the current URL (subdomain or `/t/:code/...`). Anonymous endpoints (landing, register, track) read tenant from this header only.
2. **JWT `activeTenantId`** — set by Better-Auth at login. Authenticated endpoints prefer the JWT claim and verify it matches the header; mismatch → `403 TENANT_MISMATCH`.

The backend then runs the request inside one DB transaction with `SET LOCAL app.tenant_id = '<uuid>'` so RLS authoritatively scopes every read/write.

Endpoints under `/v1/platform/*` (SUPER_ADMIN only) bypass tenant scoping and require an elevated session.

### 1.3 Auth

- **Public endpoints** (no auth): `POST /v1/applications`, `POST /v1/applications/otp/send`, `POST /v1/applications/otp/verify`, `GET /v1/applications/by-code/:code`, `GET /v1/landing`, `POST /v1/auth/*`.
- **Authenticated endpoints**: standard `Authorization: Bearer <JWT>`. Tokens are short-lived (15 min) + refresh token (7 days, rotated). Better-Auth manages this.
- **Cookies**: HTTP-only, Secure, SameSite=Lax. FE never reads tokens from JS.

### 1.4 Content type

- Request bodies: `application/json` for everything except file upload (`multipart/form-data` on `POST /v1/uploads`).
- Response bodies: `application/json; charset=utf-8`.
- Dates: ISO 8601 strings (`2026-05-28T14:30:00+07:00`); never raw epoch.

### 1.5 Pagination

Cursor-based on list endpoints with high cardinality (applications, audit log). Page-based on small lists (campaigns, users).

```jsonc
// Request
GET /v1/applications?cursor=<opaque>&limit=20

// Response
{
  "items": [ ... ],
  "nextCursor": "<opaque or null>",
  "total": 137         // null if cursor mode
}
```

### 1.6 Error envelope

All errors share this shape — never raw stack traces, never DB messages:

```jsonc
{
  "error": {
    "code": "APPLICATION_NOT_FOUND",
    "message": "Không tìm thấy hồ sơ với mã đã nhập.",  // i18n by Accept-Language
    "details": { "code": "CVA-26-XXXXXX" },             // optional, code-specific
    "requestId": "01J..."                                // traceable in logs
  }
}
```

Standard error codes:

| HTTP | `code` | When |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Zod / DTO validation rejected the body. `details.fields` lists field-level errors. |
| 401 | `UNAUTHENTICATED` | Missing / expired token on an authenticated route. |
| 403 | `FORBIDDEN` | Authenticated but permission matrix says no. |
| 403 | `TENANT_MISMATCH` | JWT tenant ≠ header tenant. |
| 403 | `MODULE_DISABLED` | Resource's module not purchased by tenant. |
| 404 | `RESOURCE_NOT_FOUND` | Generic missing resource. Specific subtypes (`APPLICATION_NOT_FOUND`, `TENANT_NOT_FOUND`) when useful. |
| 409 | `STATE_TRANSITION_INVALID` | Requested transition not in `TRANSITIONS`. |
| 409 | `STALE_UPDATE` | Optimistic concurrency conflict (see 1.7). |
| 422 | `BUSINESS_RULE_VIOLATED` | Logically valid request that breaks a domain rule (e.g. submitting outside campaign window). |
| 429 | `RATE_LIMITED` | Too many requests; `Retry-After` header set. |
| 500 | `INTERNAL_ERROR` | Anything uncaught. Sentry alerts. |

### 1.7 Optimistic concurrency

Mutating endpoints on entities with `updatedAt` accept an `If-Match: "<updatedAt>"` header. Server compares; mismatch → `409 STALE_UPDATE` with the current row in `details.current`. FE refetches and retries.

### 1.8 Rate limiting

Token-bucket via Redis. Default 60 req/min/IP per endpoint family. Tighter on sensitive endpoints:

| Endpoint family | Limit |
|---|---|
| `POST /v1/auth/login` | 10/min/IP + 5/min/email |
| `POST /v1/auth/forgot-password` | 5/min/IP + 3/hour/email |
| `POST /v1/applications/otp/send` | 5/min/email + 20/hour/IP |
| `POST /v1/applications/otp/verify` | 10/min/email (lock email for 15 min after 5 failed) |
| `POST /v1/applications` | 5/min/IP per tenant |
| `GET /v1/applications/by-code/:code` | 30/min/IP |

Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After`.

### 1.9 Idempotency

Mutating public endpoints accept `Idempotency-Key: <uuid>` header. Server caches the response for 24h; replays return the cached body. Critical for `POST /v1/applications` (parent double-tap) and `POST /v1/applications/otp/send`.

### 1.10 Audit

Every mutation produces an `audit_log` row via a NestJS interceptor (see [DATA_MODEL.md §7](./DATA_MODEL.md)). Endpoints that produce audit explicitly note it below.

### 1.11 i18n

`Accept-Language: vi | en` controls server-side error messages. Default `vi`. Business strings (state labels, action verbs) are returned as codes, not display strings — FE owns translation via `next-intl`.

---

## 2. Endpoint Catalog

```
Public (no auth)
  POST   /v1/applications                       Submit a new application
  POST   /v1/applications/otp/send              Request email OTP
  POST   /v1/applications/otp/verify            Verify email OTP
  GET    /v1/applications/by-code/:code         Track an application (parent view)
  GET    /v1/landing                            Get landing config for current tenant
  GET    /v1/tenants/current/branding           Get branding for current tenant
  GET    /v1/campaigns/current                  Get the open campaign + its form schema

Auth (no auth)
  POST   /v1/auth/login
  POST   /v1/auth/logout
  POST   /v1/auth/refresh
  POST   /v1/auth/forgot-password
  POST   /v1/auth/reset-password
  POST   /v1/auth/set-password
  POST   /v1/auth/activate

Tenant scope (authenticated, scoped by JWT.activeTenantId)
  GET    /v1/me                                 Session user + abilities
  POST   /v1/me/switch-tenant                   Switch active tenant, mint new JWT

  GET    /v1/applications                       List with filters
  GET    /v1/applications/:id                   Detail
  PATCH  /v1/applications/:id                   Update editable fields
  POST   /v1/applications/:id/transition        Apply state transition
  POST   /v1/applications/export                Async export job (CSV / XLSX)
  GET    /v1/applications/analytics             Funnel + counters

  GET    /v1/campaigns                          List
  POST   /v1/campaigns                          Create
  GET    /v1/campaigns/:id                      Detail
  PATCH  /v1/campaigns/:id                      Update
  DELETE /v1/campaigns/:id                      Delete (soft)

  GET    /v1/form-templates                     List
  POST   /v1/form-templates                     Create new version
  GET    /v1/form-templates/:id                 Detail
  PATCH  /v1/form-templates/:id                 Update (only DRAFT versions)
  POST   /v1/form-templates/:id/publish         Publish

  GET    /v1/notifications                      In-app notifications for current user
  POST   /v1/notifications/:id/read             Mark one read
  POST   /v1/notifications/read-all             Mark all read

  GET    /v1/tenant/config                      Branding + landing + modules + flags
  PATCH  /v1/tenant/config                      Update (TENANT_ADMIN+)
  POST   /v1/tenant/config/landing/preview      Render preview (no save)

  GET    /v1/tenant/users                       List staff users
  POST   /v1/tenant/users                       Invite
  PATCH  /v1/tenant/users/:id                   Update roles / status
  DELETE /v1/tenant/users/:id                   Remove (soft)

  GET    /v1/audit-log                          TENANT_ADMIN+ only
  GET    /v1/audit-log/export                   CSV export (TENANT_ADMIN+)

  POST   /v1/uploads                            Pre-signed upload (R2 / MinIO)

Platform scope (SUPER_ADMIN only, cross-tenant)
  GET    /v1/platform/tenants
  POST   /v1/platform/tenants
  PATCH  /v1/platform/tenants/:code
  POST   /v1/platform/tenants/:code/modules    Toggle modules
  GET    /v1/platform/audit-log                 Cross-tenant audit

Health
  GET    /v1/health                             Liveness
  GET    /v1/health/ready                       Readiness (DB + Redis reachable)
```

---

## 3. Public — Admission

### 3.1 `POST /v1/applications`

Submit a new application. Idempotent on `Idempotency-Key`.

**Headers**: `x-tenant-code`, `Idempotency-Key` (optional but recommended).

**Body**:
```jsonc
{
  "campaignId": "01J...",                       // optional; defaults to current open campaign
  "applicant": {
    "fullName": "Nguyễn Văn A",
    "email": "phuhuynh@example.com",
    "phone": "0912345678",
    "relationship": "father"                    // father | mother | guardian | self
  },
  "formData": {                                 // shape matches the campaign's FormSchema
    "studentName": "Nguyễn Văn B",
    "dob": "2014-05-12",
    "gpa": 9.2,
    "hasSibling": "yes",
    "siblingName": "Nguyễn Văn C"
  },
  "otpToken": "<verified-otp-token>"            // returned by POST /otp/verify
}
```

**Preconditions**:
- Campaign exists, is open (`now ∈ [opensAt, closesAt]`), and belongs to the tenant.
- `formData` validates against the campaign's form schema (server re-runs `buildZodSchema`).
- `otpToken` was issued for `applicant.email` within the last 30 min and not yet consumed.

**Response 201**:
```jsonc
{
  "code": "CVA-26-7K3QF2",
  "state": "SUBMITTED",
  "createdAt": "2026-05-28T22:14:00+07:00"
}
```

**Errors**: `VALIDATION_FAILED`, `BUSINESS_RULE_VIOLATED` (campaign closed), `RATE_LIMITED`.

**Side effects**: audit `create:application`, enqueue `email` (receipt to applicant + new-application notification to admins), create initial `application_history` row.

---

### 3.2 `POST /v1/applications/otp/send`

Request a one-time email code (6 digits, valid 10 min). Resend allowed once per minute.

**Body**: `{ "email": "phuhuynh@example.com" }`

**Response 200**: `{ "sent": true, "expiresAt": "2026-05-28T22:24:00+07:00" }`

The endpoint never reveals whether the email is already on file. Mock Phase 1 also returns `devCode` for self-serve demo; the Phase 2 contract drops `devCode`.

**Errors**: `RATE_LIMITED`, `VALIDATION_FAILED`.

**Side effects**: enqueue `email` (Resend), insert `otp_codes` row hashed.

---

### 3.3 `POST /v1/applications/otp/verify`

Verify a code and obtain a short-lived `otpToken` to pass into `POST /v1/applications`.

**Body**: `{ "email": "phuhuynh@example.com", "code": "123456" }`

**Response 200**: `{ "verified": true, "otpToken": "<opaque-token>", "expiresAt": "2026-05-28T22:54:00+07:00" }`

Token: opaque, single-use, 30-min TTL, tied to `(email, ip)`. Stored hashed.

**Errors**: 5 wrong attempts within 15 min → email locked for OTP for 15 min (`429 RATE_LIMITED` with `lockedUntil`).

---

### 3.4 `GET /v1/applications/by-code/:code`

Look up by human-friendly code (e.g. `CVA-26-7K3QF2`). Parent-facing.

**Response 200**: Application (see §11 schema), with `history` array.

**Privacy**: returns only the fields needed for the track page — no internal reviewer notes (those live on a separate `reviews` resource, never returned to public). PII (applicant phone, email) is returned only if the code is unguessable enough; we accept the trade-off because the code is the only credential a parent has (mitigated by code entropy — see [THREAT_MODEL.md §4](./THREAT_MODEL.md)).

**Errors**: `APPLICATION_NOT_FOUND` (404, generic — never confirm "wrong code vs no permission").

---

## 4. Public — Tenant content

### 4.1 `GET /v1/landing`

Return the landing config (sections + branding) for the tenant resolved from `x-tenant-code`. RSC layer caches via `unstable_cache` tagged `tenant:${code}`.

**Response 200**:
```jsonc
{
  "branding": {
    "code": "cva-edu",
    "name": "Trường Trung học cơ sở Chu Văn An",
    "shortName": "CVA",
    "logoUrl": "https://...",
    "theme": { ...TenantTheme }
  },
  "config": {
    "sections": [
      { "type": "hero", "headline": "...", ... },
      ...
    ]
  }
}
```

### 4.2 `GET /v1/campaigns/current`

Returns the current open campaign + form schema bound to it.

**Response 200**:
```jsonc
{
  "id": "01J...",
  "code": "intake-2026",
  "name": "Tuyển sinh lớp 6 năm 2026",
  "opensAt": "2026-04-01T00:00:00+07:00",
  "closesAt": "2026-06-30T23:59:59+07:00",
  "formTemplate": {
    "id": "01J...",
    "version": 3,
    "schema": { ...FormSchema }
  }
}
```

`404` if no open campaign — FE renders an "intake closed" empty state.

---

## 5. Auth

### 5.1 `POST /v1/auth/login`

**Body**: `{ "email": "...", "password": "..." }`
**Response 200**: `{ "user": { ... }, "tenant": { ... }, "accessToken": "...", "refreshToken": "..." }`
Sets HTTP-only cookies. JWT carries `userId`, `activeTenantId`, `roles[]`.

If the user belongs to multiple tenants, returns `tenants[]` instead and FE shows `/choose-tenant`.

**Errors**: `UNAUTHENTICATED` (generic — never reveal whether email exists), `RATE_LIMITED`.

### 5.2 `POST /v1/auth/logout`

Revoke refresh token + clear cookies. `204 No Content`.

### 5.3 `POST /v1/auth/refresh`

Rotate refresh token. Body empty (token in cookie). Response: new tokens.

### 5.4 `POST /v1/auth/forgot-password`

**Body**: `{ "email": "...", "tenantCode": "cva-edu" }`
**Response 200** always: `{ "sent": true }` (anti-enumeration).

Side effect: if email exists in that tenant, enqueue reset email with single-use token.

### 5.5 `POST /v1/auth/reset-password` / `set-password` / `activate`

All three share shape: `{ "token": "...", "password": "..." }`. Differ in token type and post-condition (`reset` clears the password reset flag; `set` and `activate` mark the user `active`).

**Response 200**: `{ "ok": true }`. Token consumed.

**Errors**: `VALIDATION_FAILED` (token invalid / expired / password too weak).

---

## 6. Authenticated — Session

### 6.1 `GET /v1/me`

**Response 200**:
```jsonc
{
  "user": { "id": "01J...", "name": "Cô A", "email": "a@school.vn" },
  "tenant": {
    "id": "01J...",
    "code": "cva-edu",
    "name": "...",
    "modules": ["admission", "platform"]
  },
  "roles": ["ADMISSION_ADMIN"],
  "abilities": [
    { "action": "read", "resource": "application", "scope": "tenant" },
    ...
  ]
}
```

FE hydrates `AbilityContext` from this; `<Can>` / `<RequirePermission>` resolve client-side without further calls.

### 6.2 `POST /v1/me/switch-tenant`

**Body**: `{ "tenantCode": "tran-dai-nghia" }`
**Response 200**: new `{ accessToken, refreshToken }` with `activeTenantId` updated. Verifies membership in `tenant_users`. Audit `login` on the new tenant.

---

## 7. Authenticated — Admission management

### 7.1 `GET /v1/applications`

List with filters. Mirrors `lib/api/admission.ts > ListApplicationsInput`.

**Query**:
| Param | Type | Notes |
|---|---|---|
| `search` | string | Free-text over code, applicant name, student name (accent-insensitive). |
| `states` | `state[]` | Repeat key: `?states=SUBMITTED&states=UNDER_REVIEW`. |
| `dateFrom`, `dateTo` | ISO date | Inclusive bounds on `createdAt`. |
| `scoreMin`, `scoreMax` | number | Filter on `formData.gpa`. |
| `sort` | `createdAt:desc \| createdAt:asc \| score:desc \| score:asc` | Default `createdAt:desc`. |
| `cursor` | string | Cursor pagination. |
| `limit` | number | Default 20, max 100. |

**Response 200**: `{ items: Application[], nextCursor: string|null, total: number }`.

**Permission**: `read:application` (any role with it).

### 7.2 `GET /v1/applications/:id`

**Response 200**: full `Application` including reviewer-internal `reviews[]` (omitted on the public endpoint).

### 7.3 `PATCH /v1/applications/:id`

Editable fields per role (state machine enforces what can change in which state):

| Role | Editable when |
|---|---|
| APPLICANT (own) | state ∈ {DRAFT, NEEDS_INFO} → `applicant`, `formData` |
| REVIEWER / ADMISSION_ADMIN | state = UNDER_REVIEW → `formData` (correct typos), `internalNotes` |

Requires `If-Match` (optimistic concurrency). Side effects: audit `update:application`.

### 7.4 `POST /v1/applications/:id/transition`

**Body**:
```jsonc
{
  "to": "REJECTED",                            // target state
  "reason": "Hồ sơ thiếu giấy khai sinh."      // required for REJECTED / NEEDS_INFO
}
```

**Validation**:
1. `canTransition(from, to, role)` against `TRANSITIONS` (shared module).
2. Reason non-empty when `requireReason: true`.
3. Tenant scope (RLS).

**Response 200**: updated `Application` with new `state` and appended `history` entry.

**Errors**: `STATE_TRANSITION_INVALID` (409), `VALIDATION_FAILED` (missing reason).

**Side effects**: audit `state_change:application`, append `application_history`, enqueue `email` to applicant for state changes that surface to them (`APPROVED`, `REJECTED`, `NEEDS_INFO`, `CONFIRMED`, `ENROLLED`).

### 7.5 `POST /v1/applications/export`

Start an async export job. Body: `{ filters: <same as list>, format: "csv" | "xlsx" }`.

**Response 202**: `{ "jobId": "01J...", "statusUrl": "/v1/jobs/01J..." }`.

Job worker writes to R2/MinIO, signs a 1h URL, emails the requester. Audit `export:application`.

### 7.6 `GET /v1/applications/analytics`

Mirrors `lib/api/admission.ts > ApplicationAnalytics`:

```jsonc
{
  "total": 137,
  "byState": { "DRAFT": 4, "SUBMITTED": 12, "UNDER_REVIEW": 20, ... },
  "todaySubmissions": 5,
  "weekSubmissions": 32,
  "series": [
    { "date": "2026-05-15", "count": 3 },
    ...                                          // trailing 14 days
  ],
  "funnel": [
    { "state": "SUBMITTED", "count": 137 },
    { "state": "UNDER_REVIEW", "count": 110 },
    { "state": "APPROVED", "count": 78 },
    { "state": "CONFIRMED", "count": 61 },
    { "state": "ENROLLED", "count": 55 }
  ]
}
```

`count` for a funnel step = applications that *reached at least* that state.

---

## 8. Authenticated — Campaigns & Form Templates

### 8.1 Campaigns

`GET /v1/campaigns` → list. `POST` / `PATCH` / `DELETE` standard.

```jsonc
{
  "id": "01J...",
  "code": "intake-2026",
  "name": "Tuyển sinh lớp 6 năm 2026",
  "opensAt": "2026-04-01T00:00:00+07:00",
  "closesAt": "2026-06-30T23:59:59+07:00",
  "formTemplateId": "01J...",
  "status": "open" | "scheduled" | "closed" | "archived"
}
```

Constraint: at most one campaign with overlapping `[opensAt, closesAt]` per tenant — server enforces.

### 8.2 Form Templates

Versioned. Once a template is bound to an open campaign with submissions, edits create a new version (immutable history).

```jsonc
{
  "id": "01J...",
  "code": "lop6-2026",
  "version": 3,
  "status": "draft" | "published" | "archived",
  "schema": { ...FormSchema },                  // see shared FormSchema
  "publishedAt": "..."
}
```

`POST /v1/form-templates/:id/publish` → flips `status` to `published`, sets `publishedAt`. Subsequent edits → new draft version.

---

## 9. Authenticated — Tenant settings

### 9.1 `GET /v1/tenant/config`

```jsonc
{
  "branding": { ... },                          // see §11.4
  "landing": { "sections": [ ... ] },           // LandingConfig
  "modules": ["admission", "platform"],         // currently enabled
  "flags": { "selfServeOtp": true, "publicTracking": true }
}
```

### 9.2 `PATCH /v1/tenant/config`

**Permission**: `update:tenant_config` (TENANT_ADMIN, SUPER_ADMIN).

**Body**: any subset of the above. Server validates `landing.sections` against the Zod discriminated union; rejects unknown section types (forward-compat for FE is renderer-side only — DB stays clean).

**Side effects**: audit `settings_update:tenant_config`, invalidate `tenant:${code}` cache tag (RSC re-fetches on next request, no redeploy).

### 9.3 `POST /v1/tenant/config/landing/preview`

Render-time validation only. Used by the settings editor to preflight a draft without saving.

**Body**: `{ "landing": { "sections": [...] } }`
**Response 200**: `{ "ok": true }` or `{ "ok": false, "errors": [...] }`.

---

## 10. Authenticated — Audit log

### 10.1 `GET /v1/audit-log`

**Permission**: `read:audit_log` (TENANT_ADMIN, SUPER_ADMIN).

**Query**:
| Param | Type |
|---|---|
| `action` | `AuditAction` (one of 9) |
| `q` | free text on actor name + targetLabel |
| `from`, `to` | ISO datetime |
| `actorId` | UUID |
| `resource` | string |
| `cursor`, `limit` | pagination |

**Response 200**:
```jsonc
{
  "items": [
    {
      "id": "01J...",
      "tenantId": "01J...",
      "at": "2026-05-28T14:30:00+07:00",
      "actor": { "id": "01J...", "name": "Cô A", "role": "ADMISSION_ADMIN" },
      "action": "state_change",
      "resource": "application",
      "targetLabel": "CVA-26-7K3QF2"
    }
  ],
  "nextCursor": "...",
  "total": null                                 // cursor mode
}
```

### 10.2 `GET /v1/audit-log/export`

Async — same job pattern as `applications/export`. CSV with the same filters.

---

## 11. Schemas (canonical shapes)

The shapes below are the wire format. They mirror `packages/shared/src/*` — when in doubt, the TypeScript types win, and the spec is updated to track.

### 11.1 `Application`

```ts
{
  id: string;                                   // UUIDv7
  code: string;                                 // "CVA-26-XXXXXX"
  tenantId: string;
  campaignId: string;
  state: ApplicationState;                      // see §11.2
  applicant: {
    fullName: string;
    email: string;
    phone: string;
    relationship: "father" | "mother" | "guardian" | "self";
  };
  formData: Record<string, JsonValue>;          // shape per FormSchema
  history: ApplicationHistoryEntry[];
  createdAt: string;                            // ISO 8601
  updatedAt: string;
  submittedAt: string | null;
  decidedAt: string | null;
  decidedBy: { id: string; name: string; role: Role } | null;
}
```

### 11.2 `ApplicationState`

`"DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "NEEDS_INFO" | "APPROVED" | "REJECTED" | "CONFIRMED" | "ENROLLED" | "CANCELLED" | "EXPIRED"`

### 11.3 `ApplicationHistoryEntry`

```ts
{
  state: ApplicationState;
  at: string;
  by: { id: string; name: string; role: Role } | null;   // null = SYSTEM
  note?: string;                                          // reason for REJECTED / NEEDS_INFO
}
```

### 11.4 `Branding`

```ts
{
  code: string;
  name: string;
  shortName: string;
  logoUrl: string | null;
  theme: {
    light: { primary: string; ring: string; ... };       // oklch strings
    dark:  { primary: string; ring: string; ... };
    fontSans?: string;
    radius?: string;
  };
}
```

### 11.5 `LandingConfig` / `LandingSection`

Discriminated union by `type`. 8 types: `hero, stats, process, infoTabs, about, testimonials, faq, footer`. Authoritative Zod schemas live in `packages/shared/landing/sections.ts`.

### 11.6 `FormSchema`

```ts
{
  sections: Array<{
    title?: string;
    description?: string;
    fields: FormFieldSchema[];
  }>;
}
```

13 field types: `text, number, date, select, file, scoring, email, phone, radio, checkbox, address, heading, studentLookup`. Authoritative shapes in `packages/shared/form/schema.ts`.

### 11.7 `AuditLogEntry`

See §10.1.

---

## 12. OpenAPI

The NestJS API exports OpenAPI 3.1 at `GET /openapi.json`. FE codegen:

```bash
pnpm --filter web codegen:api   # writes apps/web/openapi/schema.json + lib/api/generated/schema.d.ts
```

Hooks remain hand-written; only the typed http client is regenerated. Each seam file in `apps/web/lib/api/*.ts` swaps its mock body to:

```ts
import { http } from "./http";
import type { paths } from "./generated/schema";

export async function listApplications(input: ListApplicationsInput) {
  const { data } = await http.get<paths["/v1/applications"]["get"]["responses"]["200"]["content"]["application/json"]>(
    "/v1/applications",
    { params: input }
  );
  return data;
}
```

Signatures defined in the seam files in Phase 1 are the FE contract; this spec is the BE contract; OpenAPI is the bridge.

---

## 13. Webhooks (Phase 3+)

Not in scope for Phase 2 launch. Reserved namespace: `POST <tenant-configured-url>` with events `application.submitted`, `application.state_changed`, `application.exported`. Signed with `X-EduGate-Signature: sha256=...`.

---

## 14. Open questions

| # | Question | Owner |
|---|---|---|
| Q1 | Per-tenant API base URL (e.g. `api.cva-edu.tuyensinhnhanh.vn`) or shared `api.tuyensinhnhanh.vn` with tenant header? | BE lead — start shared header-based; revisit when a tenant asks. |
| Q2 | Long-running export — return signed R2 URL or stream from API? | BE lead — signed URL, cheaper. |
| Q3 | Public tracking lookup — protect with applicant email re-confirmation? | PO — pilot first, instrument abuse signals. |
| Q4 | Cursor format — opaque base64-encoded `{lastCreatedAt,lastId}` or backend choice? | BE lead. |
| Q5 | Pagination on `audit-log` exposes total count? | PO — yes for TENANT_ADMIN, no for SUPER_ADMIN cross-tenant view. |
