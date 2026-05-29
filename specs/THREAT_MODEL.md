# Threat Model — EduGate

> Companion to [PRD.md](./PRD.md), [ARCHITECTURE.md](./ARCHITECTURE.md), [API_SPEC.md](./API_SPEC.md), [DATA_MODEL.md](./DATA_MODEL.md).
> Scope: STRIDE per surface, NĐ 13/2023/NĐ-CP compliance checklist, abuse cases, mitigations, and residual risk. Living document — review at every PR that touches authentication, tenant resolution, or audit.
> Status: Draft v1.0
> Last updated: 2026-05-28

---

## 1. Threat-model rationale

Three properties drive the model:

1. **Tenant isolation is the bet.** A single leak (school A sees school B's applicants) is existentially bad — for trust, for compliance, for our ability to keep selling. The model is paranoid about it.
2. **Parents are anonymous.** The only credential a parent holds is the application code we issued them. Code entropy is the single mitigation; everything else (rate limit, monitoring) is supporting.
3. **Phase 1 is a mock.** Most controls below are Phase 2. We are not insecure today — there is no production data. But we cannot ship Phase 2 without completing the rows marked **P2-launch**.

---

## 2. Assets & data classification

| Asset | Class | Where | Loss impact |
|---|---|---|---|
| Applicant PII (full name, email, phone, parent relationship) | **PII — high** | `applications.applicant`, `application_history`, `uploads` | NĐ 13/2023 violation, parent harm, contract loss |
| Applicant child data (name, DOB, gender, scores) | **PII — high** (minors) | `applications.form_data`, `uploads` | Same + minors-specific |
| Staff credentials | **Secret** | `users.password_hash`, `sessions` | Account takeover → cross-tenant access |
| Tenant configuration | Sensitive | `tenants`, `tenant_configs` | Defacement, brand damage |
| Audit log | **Tamper-evident** | `audit_log` | Loss of investigation capability |
| Internal reviewer notes | Sensitive | `applications.internal_notes`, `reviews` | Reputational |
| OTP codes | Short-lived secret | `otp_codes` | Account / application takeover |
| Reset/activation tokens | Short-lived secret | `password_reset_tokens` | Account takeover |
| Uploaded documents | **PII — high** | R2/MinIO | Same as applicant PII |

Data residency: every "where" lives on VN-located infrastructure (Postgres on VN VPS, R2 EU-bucketed only if explicitly chosen by tenant; default MinIO VN).

---

## 3. Trust boundaries

```
Internet ──────────────┐
                       │
                       ▼
                  Caddy (TLS termination, basic WAF rules)   ┐
                       │                                     │ Trust boundary 1
                       ▼                                     │ (external ↔ DMZ)
                  Next.js apps/web (BFF + RSC)               │
                       │                                     ┘
                       │ HTTP, tenant header set by middleware
                       ▼                                     ┐
                  NestJS apps/api                            │ Trust boundary 2
                       │                                     │ (DMZ ↔ data plane)
              ┌────────┼─────────┐                           │
              ▼        ▼         ▼                           │
         Postgres   Redis    R2/MinIO                        │
         (RLS on)                                            ┘
```

The **only** input we treat as trusted is `app.tenant_id` once set by the interceptor inside a transaction. Everything before — request headers, JWT claims, query strings, request body — is hostile until validated.

---

## 4. STRIDE per surface

### 4.1 Public landing (`GET /` per tenant)

| Threat | Vector | Mitigation |
|---|---|---|
| S — Spoofed tenant | Attacker sends `x-tenant-code` to make the page look like tenant B while served from tenant A's URL | **Middleware strips inbound `x-tenant-code` header before processing.** The header is only ever set by the server, never trusted from a client. ([apps/web/middleware.ts](../apps/web/middleware.ts) — already implemented.) |
| T — Tamper landing config | XSS via tenant-supplied landing copy | All landing content is rendered as text via React (auto-escaped). The only HTML-yielding path is `<style id="tenant-theme">` — content there is `tenantThemeToCss()` which only emits CSS variable assignments from a Zod-validated `TenantTheme`. No tenant-supplied HTML is allowed. |
| I — Information disclosure | Tenant enumeration via subdomain probe | Subdomain enumeration is inherent to DNS. Mitigation: return identical 404 page for unknown tenant subdomains and unknown paths under a valid tenant — same status, same body, no `tenants.length`-style leak. |
| D — Denial of service | Floods on landing or marketing | Caddy rate-limits per IP; CDN caching on landing content (1 min staleness). Marketing is static + cached aggressively. |
| E — Elevation | (none — anonymous) | n/a |

### 4.2 Public submit (`POST /v1/applications`)

| Threat | Vector | Mitigation |
|---|---|---|
| S — Submit as someone else | Attacker submits with victim's email | OTP gate: server enforces `otpToken` was issued for the same `applicant.email` and consumed once. |
| T — Form data injection | Malicious JSON in `formData` to break downstream rendering or DB | Server re-runs `buildZodSchema(template.schema).parse(formData)` — same code as FE. Unknown keys rejected. Numeric coercion explicit. JSONB stored as parsed object, never as raw string. |
| R — Repudiation | Parent denies submitting | `audit_log` row + `application_history` row + signed cookies on resubmits + Resend `messageId` on receipt email. |
| I — Cross-tenant leak | Submitting to tenant A but referencing tenant B's campaign | `campaign.tenant_id` must equal `req.tenant.id`; verified server-side. RLS prevents reading the wrong campaign anyway. |
| D — Submission spam | Bot creates thousands of garbage applications | Rate limit `5/min/IP per tenant`; tighter once an IP is flagged (`100/day/IP`). OTP requirement is the strongest gate — bots need access to thousands of inboxes. CAPTCHA optional Phase 2.5 if abuse observed; deferred because UX cost is high for the parent. |
| E — Elevation | n/a (anonymous) | n/a |

### 4.3 Public track (`GET /v1/applications/by-code/:code`)

| Threat | Vector | Mitigation |
|---|---|---|
| I — Application enumeration | Attacker iterates codes to harvest PII | **Code entropy**: `CVA-26-XXXXXX` where `XXXXXX` is 6 chars from a 32-symbol alphabet → ~1.07B codes/year/tenant. At 30 req/min/IP, brute force ≈ 68 years to enumerate 1% of one tenant's year. Acceptable. |
| I — Side-channel | Different latency for "not found" vs "found, no permission" | Public endpoint has no auth gate — only "not found" is returned for missing rows. RLS makes "found but cross-tenant" indistinguishable from "not found". |
| D — Track-endpoint flood | Hammer `by-code` to enumerate | Per-IP `30/min` + per-tenant aggregate `1000/min`. 429 on breach. Sentry alert at 95% of the per-tenant limit. |
| T — Cache poisoning | Bypass auth via cached response | This endpoint is `Cache-Control: private, no-store`. No CDN caching. |

**Residual risk**: a determined attacker with thousands of IPs and infinite time could enumerate. Open question (Q3 in API_SPEC): re-confirm applicant email before showing PII. Pilot first, instrument, decide.

### 4.4 Public OTP (`POST /v1/applications/otp/{send,verify}`)

| Threat | Vector | Mitigation |
|---|---|---|
| S — OTP relay | Attacker requests OTP for victim email | Email delivery is the gate — attacker must control the inbox to read the code. |
| T — Code guessing | 6-digit code, 1M space | After 5 wrong attempts within 15 min the email is **OTP-locked** for 15 min (DB row + Redis bucket). Codes expire in 10 min. Per-email 5/min send rate. |
| R — OTP replay | Reuse a verified token | `otpToken` is single-use, hashed at rest, tied to `(email, ip)`. Marked consumed on first use. |
| I — Email enumeration | Different response for "exists" vs "doesn't" | OTP send endpoint always returns `{ sent: true }`. The audience here is anonymous applicants — there is no "user account" to enumerate. |
| D — OTP-send DoS | Flood OTP endpoint | Per-IP + per-email rate limits, plus Resend's own per-day cap. |
| E — Elevation | OTP verifies an applicant email, not a staff session | n/a |

### 4.5 Staff login (`POST /v1/auth/login`)

| Threat | Vector | Mitigation |
|---|---|---|
| S — Credential stuffing | Password reuse from breaches | Argon2id with sane params; password ≥ 8 chars + simple banned-list check; rate limit `10/min/IP + 5/min/email`; Sentry alert at velocity threshold. |
| T — Session hijack | Stolen cookie | HTTP-only + Secure + SameSite=Lax; refresh tokens rotated; short access TTL (15 min); refresh-token reuse detection auto-revokes. |
| R — Disputed action | "Cô A says she didn't approve this" | `audit_log` with IP + UA + request ID + session fingerprint; append-only via RLS policy. |
| I — Account enumeration | Different response for "wrong password" vs "no such user" | Always returns generic `UNAUTHENTICATED`; identical latency target (~250 ms) by always running argon2id verify against a dummy hash when the user doesn't exist. |
| D — Login flood | Knock the auth path offline | Per-IP + per-email rate limit; circuit-break on auth latency spike. |
| E — Cross-tenant elevation | User logs in to tenant A, manipulates JWT to become TENANT_ADMIN on tenant B | JWT signed with HS256/RS256, signature checked on every request. `activeTenantId` claim is read but **cross-checked**: `tenant_users` membership lookup confirms the user actually belongs to that tenant with claimed roles. Trusting only the signed claim was a real industry incident class — we always re-verify membership for sensitive operations. |

### 4.6 Switch tenant (`POST /v1/me/switch-tenant`)

| Threat | Vector | Mitigation |
|---|---|---|
| E — Switch into a tenant the user doesn't belong to | Forged request body | Server reads `userId` from current JWT (not body) and verifies `tenant_users(tenantId, userId)` exists. Mints a fresh JWT only after verification. Audit `login` action on the new tenant. |

### 4.7 Authenticated admission endpoints

| Threat | Vector | Mitigation |
|---|---|---|
| E — Reviewer reads another tenant's applications | App code forgets `WHERE tenant_id = ?` | RLS — the policy enforces it at the DB. The interceptor sets `app.tenant_id`; the policy filters. Defense-in-depth: app code still includes `tenant_id` filters; integration tests assert tenant A queries return zero tenant B rows even when the filter is removed from the query (RLS catches it). |
| T — Tamper with application state | Skip workflow steps (e.g. DRAFT → APPROVED) | `canTransition(from, to, role)` against the shared `TRANSITIONS` constant — same code FE uses for buttons, BE uses for the guard. Test matrix asserts every invalid pair returns 409. |
| R — Reviewer denies clicking "Approve" | After a parent complains | `audit_log` `state_change` row + `application_history` row, both append-only, both carrying the actor. |
| I — Internal notes leak to parent track | Bug in serialization | The public track endpoint uses a separate DTO (Drizzle select narrows to a fixed column set, never `select *`); `reviews` and `applications.internal_notes` are never in that DTO. Schema-level contract tested. |
| D — Export-job abuse | Trigger many large exports | Per-tenant job concurrency = 2; per-actor cooldown 5 min; size cap per export. |

### 4.8 Settings (`PATCH /v1/tenant/config`)

| Threat | Vector | Mitigation |
|---|---|---|
| T — Malicious landing content | `<script>` in copy fields | All landing rendering is React + plain strings (auto-escape). The settings editor's Zod schema (`landingConfigSchema.safeParse`) rejects fields whose values contain HTML-tagging characters when the renderer would interpret them; in practice we just escape — no path renders raw HTML. |
| T — CSS injection via color tokens | Inject `\}` in oklch string to break out of the inline `<style>` | Color values are oklch strings validated by Zod regex; rejection on malformed. Inline `<style>` content goes through `tenantThemeToCss()` which only emits `--name: value;` pairs. |
| E — Non-admin updates settings | Permission bypass | `update:tenant_config` enforced by both `@RequirePermission` guard (Phase 2) and verified again by RLS (only TENANT_ADMIN+ role's session even reaches this row). |

### 4.9 Audit log (`GET /v1/audit-log`)

| Threat | Vector | Mitigation |
|---|---|---|
| I — Reading another tenant's audit | Same as 4.7 | RLS on `audit_log`. |
| T — Tampering audit history | Delete inconvenient rows | RLS policies on `audit_log` deny UPDATE / DELETE from `app_role`. Only the maintenance role (used by scheduled retention) can prune. Maintenance access is logged at the OS level. |
| I — Audit content reveals PII | Audit payload includes a deleted student name | `@Audit` decorators on controllers declare `omit: [...]` for sensitive fields; default behavior is "store diffs of field names, not values" for users / applicants. Reviewed in PR template. |

### 4.10 Uploads (`POST /v1/uploads`)

| Threat | Vector | Mitigation |
|---|---|---|
| T — Malware upload | Parent uploads malicious file | MIME allow-list (`pdf`, `jpg`, `png`, `heic`, `docx`); size cap 10 MiB; ClamAV scan async, status → `quarantined` blocks downstream access. |
| I — IDOR — read another tenant's file | Forge upload ID | Object key format `tenant/<tenant_id>/...`; download path goes through an authenticated endpoint that re-checks ownership against `uploads.tenant_id` (RLS) + `uploads.owner_app_id`. Direct R2 presigned URLs are short-lived (1h). |
| T — XSS via uploaded SVG | SVG with embedded script | SVG not in MIME allow-list. |
| D — Storage flood | Bots fill the bucket | Per-IP and per-application upload count caps + total quota per tenant. |

### 4.11 Notifications / email (`Resend` integration)

| Threat | Vector | Mitigation |
|---|---|---|
| T — Email-template injection | Parent name `<script>` in subject | Server escapes template variables before substitution; subject/body go through a safe substitution that rejects `<>` outside known-safe contexts. |
| I — Wrong-recipient email | Bug routes email to wrong applicant | The notification worker reads `application_id` only; it pulls `applicant.email` inside the same transaction with `app.tenant_id` set. RLS catches misrouting at the DB. |
| D — Email-bomb | Use the system to spam an inbox | Per-recipient per-hour cap; Resend handles outbound. |

### 4.12 Admin export (`POST /v1/applications/export`)

| Threat | Vector | Mitigation |
|---|---|---|
| I — Export-channel leak | Signed URL forwarded externally | URLs are short-lived (1h), single-actor-scoped, audited (`export:application`). |
| D — Export volume blows storage | Repeated huge exports | Per-actor cooldown 5 min; result auto-purged after 7 days. |

---

## 5. Multi-tenant isolation — what could go wrong

A dedicated section because this is the bet.

| Failure mode | How it could happen | What stops it |
|---|---|---|
| App-code forgets `WHERE tenant_id = ?` | Programmer mistake on a new query | RLS catches at DB. CI integration test: run every list query against a 2-tenant seed and assert tenant A's session returns zero tenant B rows even when the test deliberately strips the WHERE clause from the test query builder. |
| `SET LOCAL app.tenant_id` is forgotten on a code path | Missing interceptor on a custom controller | The interceptor is global; opt-out requires an explicit decorator. The DB role `app_role` has NO bypass — a query without `app.tenant_id` set hits the `current_setting()` error and the transaction aborts. |
| Connection pool leaks tenant context between requests | `SET` instead of `SET LOCAL`, or a connection reused outside its transaction | Interceptor uses `SET LOCAL` inside `db.transaction(...)` — the setting falls out at commit/rollback. Code review: any direct `SELECT set_config(...)` outside `transaction` is rejected. |
| JWT manipulated to claim cross-tenant access | Attacker rewrites `activeTenantId` claim | Signature check fails. Even with valid signature (e.g. shared secret leak), the BE re-verifies `tenant_users` membership for every authenticated endpoint. |
| SUPER_ADMIN superuser pool gets used for ordinary requests | Misconfigured connection pool | `app_role` and `platform_role` are separate Postgres roles attached to separate pools. The SUPER_ADMIN cross-tenant code path goes through `/v1/platform/*` controllers that explicitly tag their pool — code-reviewed, single owner. |
| Test fixtures bleed between tenants | Shared seed data | Every integration test creates two tenants and asserts isolation. The 2-tenant assertion runs on every PR. |

---

## 6. Cryptography choices

| Use | Algorithm | Notes |
|---|---|---|
| Password hashing | argon2id, m=64MB, t=3, p=1 | OWASP recommendation. Pepper from env. |
| JWT signing | HS256 (single-region) → RS256 if multi-region | Secret in Coolify env; rotated annually. |
| OTP hashing at rest | argon2id (low params) | 6-digit codes need only short-lived secrecy. |
| Password reset tokens | 32-byte random + argon2id hash at rest | Compared by hash + expiry. |
| TLS | TLS 1.3, Caddy default | `*.tuyensinhnhanh.vn` wildcard via Let's Encrypt DNS-01. |
| At rest | Postgres on encrypted volume (host-level LUKS) | Backups encrypted with `pgbackrest` cipher. |
| Object storage | R2 encrypts at rest by default; MinIO with KES if used | Per-object key per tenant (Phase 3 enhancement). |

---

## 7. Security headers (Caddy)

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
Content-Security-Policy: default-src 'self';
                         img-src 'self' data: https://images.unsplash.com <r2-origin>;
                         style-src 'self' 'unsafe-inline';
                         script-src 'self';
                         frame-ancestors 'none';
                         base-uri 'self';
                         form-action 'self'
```

`style-src 'unsafe-inline'` is required for our tenant `<style>` injection. Trade-off accepted because no tenant-supplied HTML is rendered and the inline content is generated server-side from validated tokens. Revisit when CSP nonce support is straightforward in Next 15 streaming RSC.

`script-src 'self'` is strict — no third-party analytics in scope yet. When added (Phase 3), prefer first-party proxy.

---

## 8. NĐ 13/2023/NĐ-CP compliance checklist

Vietnam's personal data protection decree. Selected requirements with mapping to controls:

| Requirement | Control | Status |
|---|---|---|
| **Consent at collection** (Art. 9, 11) | Public submit page has a clear notice + "Tôi đồng ý" checkbox before submit; consent log row in `audit_log` | **P2-launch** — wire consent checkbox |
| **Purpose limitation** (Art. 14) | Privacy notice per tenant; data used only for stated purpose (admission) | **P2-launch** — privacy page template |
| **Storage in Vietnam** (Art. 26 for Vietnamese citizens' data) | All Postgres + backup buckets on VN VPS; tenants can opt for VN-only R2/MinIO | Done at infra |
| **Access controls** | RLS + permission matrix + audit | Done in design |
| **Right to access** (Art. 13) | Parent can view own application via track endpoint; staff can view tenant data | Done |
| **Right to delete** (Art. 16) | Soft-delete on parent request; hard-delete after 30 days unless legal retention applies | **P2-launch** — UI for self-serve deletion request |
| **Right to correct** (Art. 13) | PATCH on application in DRAFT / NEEDS_INFO states | Done |
| **Breach notification** (Art. 23) | Within 72h to MoIC; sentry alerts → on-call runbook → notification template | **P2-launch** — runbook |
| **DPO designation** (Art. 28, for orgs processing sensitive data) | EduGate designates a DPO; per tenant, school designates one | **P2-launch** — contractual |
| **Cross-border transfer** (Art. 25) | If a tenant chooses non-VN object storage, an impact assessment record is required | **P2-launch** — admin warning on storage choice |
| **Retention limit** (Art. 16) | Documented per data class (§8 in DATA_MODEL.md) | Done |

Decree alignment is a compliance posture, not a checkbox — annual review and a designated DPO are the durable controls.

---

## 9. Logging & monitoring (Phase 2)

| Signal | Source | Action |
|---|---|---|
| Failed login velocity | App logs → Loki | Alert at >50/min cross-tenant |
| OTP failure velocity | App logs | Alert at >100/hour, breakdown by email |
| RLS catch (transaction abort) | Postgres logs | Page on-call — indicates a missing app-side filter |
| Permission denial 403 | App logs | Aggregate weekly; spikes worth investigating |
| Audit log gaps | Heartbeat job inserts a sentinel row hourly | Alert if missing |
| `SET LOCAL` missing | Drizzle middleware check in dev + assertion in CI | Build fails |

All logs carry `tenant_id, actor_user_id, request_id`. No PII in log lines — applicants are referenced by `application_id`, not by email or name.

---

## 10. Incident response (sketch)

| Severity | Definition | Response time | Notifications |
|---|---|---|---|
| **SEV-1** | Cross-tenant data leak; auth bypass; production outage > 30 min | < 30 min | CEO, all tenants, MoIC if PII breached |
| **SEV-2** | Single-tenant outage; suspected breach (no confirmed leak) | < 2 hours | Affected tenant + leadership |
| **SEV-3** | Degraded performance; bug with workaround | < 1 day | On-call + tenant if asked |

SEV-1 playbook outlines:
1. Acknowledge in pager.
2. Pull a forensic snapshot of `audit_log` + relevant `application_history` rows immediately, before retention or anything else touches them.
3. Convene war room.
4. Containment first (revoke tokens, disable affected endpoints), root cause second.
5. Tenant communication within 24h with what is known.
6. NĐ 13 72-hour MoIC notification clock starts at confirmation.
7. Post-incident review within 7 days, public-facing within 14.

---

## 11. Pen test & review cadence

- **Internal review**: this document is re-read at every PR that touches auth, tenant resolution, audit, or RLS policies. PR checklist item.
- **External pen test**: before the first paying-tenant go-live; annually thereafter; after every change to the auth provider.
- **Threat model refresh**: every 6 months, or when a new module is added (each new module gets its STRIDE table appended here).

---

## 12. Residual risks accepted

| Risk | Accepted because |
|---|---|
| Application code is enumerable in theory | Code entropy + rate limit make practical enumeration infeasible at admission scale. Re-evaluate if abuse observed. |
| `style-src 'unsafe-inline'` for tenant theming | Inline style content is server-generated from Zod-validated tokens, never tenant-supplied HTML. Reconsider when streaming-RSC CSP nonce story matures. |
| Email-based OTP, not SMS / Zalo | Phase 2 launch decision; email coverage is acceptable for Vietnamese parents. Add SMS if pilot pinpoints delivery friction. |
| No 2FA for staff in Phase 2 | Staff population is small per tenant; password + rate limit acceptable for pilot. Add TOTP in Phase 3. |
| Public landing serves the school's brand to anyone | Schools want this — it's how parents discover them. There is no version of this product where landing is non-public. |
| Tenant subdomain enumeration via DNS | Inherent to DNS; mitigated by returning identical 404 for unknown tenants. |

---

## 13. Open questions

| # | Question | Owner | Trigger |
|---|---|---|---|
| Q1 | Should `/v1/applications/by-code/:code` require email re-confirmation? | PO | Pilot abuse signals |
| Q2 | Per-tenant separate Postgres role vs shared `app_role`? | BE lead | Scale review at 100 tenants |
| Q3 | CSP nonce for inline `<style>` once Next 15 RSC supports stable nonce per-request | BE lead | Next.js feature support |
| Q4 | Hardware key (WebAuthn) for SUPER_ADMIN | PO | Year 2 |
| Q5 | Bug bounty program | PO | After 50 tenants |
| Q6 | Compliance with MoET data-sharing rules (if pilot is a public school) | PO + legal | Pre-pilot |

---

## 14. Reference

- Architecture: [specs/ARCHITECTURE.md §8 (Security)](./ARCHITECTURE.md)
- Data model: [specs/DATA_MODEL.md §4 (RLS)](./DATA_MODEL.md)
- API: [specs/API_SPEC.md §1.8 (Rate limits) and §1.10 (Audit)](./API_SPEC.md)
- ADR-004 Data residency, ADR-006 Theming, ADR-008 i18n: [docs/DECISIONS.md](../docs/DECISIONS.md)
- NĐ 13/2023/NĐ-CP: https://thuvienphapluat.vn/van-ban/Cong-nghe-thong-tin/Nghi-dinh-13-2023-ND-CP-bao-ve-du-lieu-ca-nhan-465185.aspx
