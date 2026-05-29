# Architecture Design — EduGate

> Companion to [PRD.md](./PRD.md). One monorepo at the project root — `apps/web` (Next.js FE+BFF), `apps/api` (NestJS backend, Phase 2), shared types in `packages/shared`, Drizzle schema in `packages/db`.
> Status: Phase 1 frontend complete (mock seam); Phase 2 backend in progress (foundation + RLS up; admission slice next).
> Last updated: 2026-05-28

---

## 1. Architectural Goals

The architecture must support five hard requirements that flow from the PRD:

1. **One codebase serves N tenants, branded per tenant, without redeploy.** Theming, forms, and landing content are data, not code.
2. **Tenant isolation is defense-in-depth.** Three independent layers must each be capable of preventing cross-tenant data leakage on its own.
3. **The platform is module-extensible.** Admission is one of many modules; adding HRMS / Fee / LMS later cannot require rewriting permissions, routing, or theming.
4. **Data residency Vietnam.** All persistent data and ops infra lives on VN-located infrastructure.
5. **Phase 1 ships with mock data; Phase 2 swaps in the real backend without changing call sites.** Every network boundary is a clearly named seam.

Every decision in this document traces back to one of these five.

---

## 2. System Context

```
                  ┌──────────────────────────────────────────────────────────┐
                  │                       Internet (Vietnam)                 │
                  └────────────┬─────────────────────────────────────────────┘
                               │ HTTPS, *.tuyensinhnhanh.vn wildcard
                ┌──────────────▼────────────────┐
                │   Caddy (TLS, reverse proxy)  │  Self-hosted VN VPS via Coolify
                └──────────────┬────────────────┘
                               │
   ┌───────────────────────────┼──────────────────────────────┐
   │                           │                              │
┌──▼─────────────┐    ┌────────▼─────────┐         ┌──────────▼──────────┐
│ apps/web       │    │ apps/api         │         │ Workers (Phase 2)   │
│ Next.js 15     │◄──►│ NestJS 10        │◄────────│ BullMQ consumers    │
│ App Router     │HTTP│ Drizzle ORM      │  Redis  │ - email (Resend)    │
│ SSR + RSC      │JSON│ Better-Auth      │ pub/sub │ - PDF (Puppeteer)   │
└────────┬───────┘    └─────┬────┬──────┘          │ - scheduled cron    │
         │                  │    │                 └──────────┬──────────┘
         │                  │    │                            │
         │           ┌──────▼────▼───┐                ┌───────▼────────┐
         │           │ PostgreSQL    │                │ Redis          │
         │           │ + RLS         │                │ (BullMQ queue) │
         │           └───────────────┘                └────────────────┘
         │                                                    │
         │                                          ┌─────────▼─────────┐
         │                                          │ Object storage    │
         └─────────────────────────────────────────►│ Cloudflare R2     │
                                                    │ or MinIO (VN)     │
                                                    └───────────────────┘

External: Resend (transactional email)
```

Phase 1 boundary: only `apps/web` and the mock seam exist. Everything to the right of `apps/web` is Phase 2.

---

## 3. Stack — Frozen Choices

| Layer | Choice | Rationale (ADR) |
|---|---|---|
| Monorepo | Turborepo + pnpm workspaces, Node 20 | ADR-001 — shared types FE↔BE, build cache |
| Frontend | Next.js 15 App Router + TypeScript strict | ADR-002 — RSC for no-FOUC theme injection |
| Styling | Tailwind v4 (CSS-first `@theme`) + shadcn/ui (copied into `packages/ui`) | ADR-002, ADR-006 — runtime per-tenant tokens |
| Forms | React Hook Form + Zod | Convention — single resolver, type-inferred |
| Server state | TanStack Query v5 + axios | Standard, mock-swappable via seam |
| i18n | next-intl 4 (no locale routing) | ADR-008 — preserves tenant middleware |
| Backend (Phase 2) | NestJS 10 | ADR-003 — module-per-feature, request-scoped interceptors |
| ORM (Phase 2) | Drizzle | ADR-003 — SQL-first, RLS-friendly, lightweight |
| Database | PostgreSQL self-host in VN | ADR-004 — data residency |
| Auth (Phase 2) | Better-Auth | Tenant-aware sessions; custom JWT fallback if needed for case-insensitive email per tenant |
| Queue (Phase 2) | Redis + BullMQ | Standard; email + PDF + cron |
| Storage (Phase 2) | Cloudflare R2 (default) or MinIO (VN-resident option) | Configurable per deployment |
| Email (Phase 2) | Resend | Vietnam delivery acceptable; simple API |
| Deploy | Coolify + Docker Compose + Caddy on VN VPS | ADR-004 — data residency |

**Excluded by ADR**: Prisma (RLS feels grafted on), TypeORM (migration flakiness), Supabase Auth (no first-class tenant concept).

---

## 4. Monorepo Layout

```
.
├── apps/
│   ├── web/                  Next.js 15 — FE + BFF
│   └── api/                  NestJS 10 (Phase 2)
├── packages/
│   ├── ui/                   shadcn primitives, AppShell, FormBuilder, admission UI, dispatchers
│   ├── shared/               Types, Zod schemas, state machine, permission matrix, tenant resolver — framework-agnostic
│   └── db/                   Drizzle schema + migrations (Phase 2)
├── docs/                     Plan, ADRs, state machine, permissions
├── tools/                    Scripts
├── turbo.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

### Why three packages

- **`shared/`** has zero framework dependencies. It runs in Next RSC, Next client, NestJS, and a future cron worker. State machine + permissions + Zod schemas live here so the three security layers diff against a single file.
- **`ui/`** depends on React, Radix, and `lucide-react`. It is consumed by `apps/web` (and any future `apps/admin` or storybook). It owns no business logic — only presentational pieces and slot-based shells.
- **`db/`** (Phase 2) is the only package that imports Drizzle. It re-exports types from `shared/` where shapes overlap.

### Path aliases

- `@/...` inside `apps/web`
- `@ui/components/*`, `@ui/lib/*` for `packages/ui`
- `@shared/*` for `packages/shared`

Cross-package source is consumed directly (`transpilePackages: ["ui", "shared"]` in `next.config.mjs`) — no build step for packages, faster dev loop, tree-shaking preserved via `"sideEffects": false`.

---

## 5. Multi-tenancy Architecture

### 5.1 Three layers of isolation

```
┌──────────────────────────────────────────────────────────────────────┐
│  Layer 1 — Application code                                          │
│  Every query attaches tenant_id from request context.                │
│  Phase 1: mock seam reads tenant code from header / fixture.         │
│  Phase 2: NestJS interceptor reads JWT.tenant_id_active, sets it.    │
├──────────────────────────────────────────────────────────────────────┤
│  Layer 2 — Backend guard                                             │
│  @RequirePermission(action, resource) on every controller route.     │
│  Same matrix as FE, but authoritative — returns 403.                 │
├──────────────────────────────────────────────────────────────────────┤
│  Layer 3 — Postgres Row-Level Security                               │
│  Every business table: tenant_id NOT NULL + index.                   │
│  RLS policy: USING (tenant_id = current_setting('app.tenant_id')).   │
│  Connection sets SET LOCAL app.tenant_id per transaction.            │
│  If app code forgets WHERE tenant_id=?, DB still returns zero rows.  │
└──────────────────────────────────────────────────────────────────────┘
```

The FE permission gate (`<Can>`, `<RequirePermission>`) is **UX, not security**. It hides buttons and redirects users away from forbidden routes. It is not a defense.

### 5.2 Tenant resolution flow

```
Request → Caddy (TLS) → Next.js middleware
                          │
                          ▼
           parseTenantFromHost(host, rootHosts) ─┐
              ├─ subdomain matches?              │ found?
              │  truong-x.tuyensinhnhanh.vn → "truong-x"│
              ▼                                  ▼
           parseTenantFromPath(pathname) ─────►  set request header
              ├─ /t/:code/...                    x-tenant-code = code
              └─ /t/truong-x → "truong-x"       (inbound header stripped)
                                                 │
                                                 ▼
                                       RSC layout reads
                                       headers().get(TENANT_HEADER)
                                                 │
                                                 ▼
                                       getTenantBranding(code) — cached
                                                 │
                                                 ▼
                                       render <style id="tenant-theme">
                                       inside <body>
                                       (React 19 hoists to <head>)
```

- Subdomain is **canonical**.
- Path is a **fallback** for dev / staging that lacks wildcard SSL.
- `RESERVED_SUBDOMAINS` = `www, app, api, admin, static, assets, cdn`.
- Tenant code regex = DNS label, lowercase. URLs case-sensitive → enforce lowercase to avoid duplicate URLs for the same tenant.
- The middleware **strips inbound `x-tenant-code`** before processing — clients cannot spoof tenant context.

### 5.3 Tenant theming via CSS variables

```css
/* globals.css — Tailwind tokens reference CSS variables */
@theme inline {
  --color-primary: var(--primary);
  --color-ring:    var(--ring);
  --font-sans:     var(--font-sans-tenant), var(--font-sans);
  ...
}

/* RSC injects this <style> per-request */
<style id="tenant-theme">
  :root { --primary: oklch(0.55 0.20 250); --ring: oklch(0.55 0.20 250); ... }
  .dark { --primary: oklch(0.70 0.18 250); ... }
</style>
```

- Token shape ships in `packages/shared/src/theme.ts` — same key names for default and per-tenant.
- Indirection layer for fonts (`--font-sans-tenant`) so swap doesn't lose Inter fallback.
- `getTenantBranding(code)` wraps `react.cache` for per-request dedup (layout + page + metadata call it).
- Phase 2 swaps the fixture lookup for a Drizzle query under `unstable_cache` with tag `tenant:${code}`.

### 5.4 Module toggle

A resource resolves to a module via `moduleOf(resource)`:

- `application, campaign, review, form_template, notification_template` → `admission`
- `employee, department, position` → `hrms`
- `fee_item, fee_sheet, payment` → `fee`
- ... (other modules)
- `tenant_config, tenant_user, audit_log` → `platform` (core, never gated)

```ts
can(ctx, action, resource) {
  if (!ctx.tenant.modules.includes(moduleOf(resource))) return false;
  // ... role check
}
```

Toggling a module off **everywhere** is a single config flip on the tenant; no permissions rewrite. This is the single biggest reason the matrix is flat and reads `action × resource × scope`.

---

## 6. Frontend Architecture

### 6.1 Route groups (Next.js App Router)

```
app/
├── layout.tsx                Root: providers, theme injection, locale, fonts
├── error.tsx                 In-layout error boundary (i18n available)
├── global-error.tsx          Last-resort (replaces layout, no providers)
├── not-found.tsx             404
├── (public)/                 Public-facing, no auth required
│   ├── layout.tsx            Floating LocaleSwitcher overlay
│   ├── page.tsx              Tenant landing OR marketing home (branches on tenant)
│   ├── register/             5-step admission wizard
│   └── track/                Tracking + print
├── (auth)/                   Login, forgot, reset, set, activate
└── (admin)/                  Authenticated admin
    ├── layout.tsx            <AbilityProvider>, AdminShell
    └── admin/
        ├── page.tsx          Dashboard
        ├── applications/     Queue
        ├── settings/         Branding + landing editor
        └── audit-log/        TENANT_ADMIN+ only
```

### 6.2 RSC / Client boundary

**Default rule**: RSC unless the component needs:
- Browser-only API (`localStorage`, `IntersectionObserver`)
- Interactivity (form state, event handlers, animations)
- React hooks beyond `cache`

Concrete boundaries:

| Concern | Lives where | Why |
|---|---|---|
| Tenant resolution + theme injection | RSC root layout | Per-request, header-driven, single source of theme HTML |
| Landing section dispatcher | RSC | Pure render, content is data |
| Wizard | Client | RHF state, `useSearchParams`, draft autosave |
| `/track/[code]` | Client | localStorage mock (Phase 2 becomes a useQuery → server-fetched) |
| `<FormBuilder>` field gates | Client | `useWatch` for conditional visibility |
| `<StateBadge>`, `<StateTimeline>` | Component (works in both) | Presentational, no hooks |
| `<StateActions>` | Client | Dialog state for reason input |
| `<Can>`, `<RequirePermission>` | Client | Reads ability from context |
| Audit log viewer | Client | Filter state, useQuery |
| Settings editor | Client | dnd-kit, draft state, live preview |
| Print route | Client (inside RSC page) | `window.print()`, useQuery for data |

### 6.3 Data flow — Phase 1 mock seam vs Phase 2 swap

```
Component
  │
  ▼
useApplication(code), useCreateApplication(), useSendEmailOtp(), useAuditLog(...)
  │   (TanStack Query hooks — bodies unchanged in Phase 2)
  ▼
lib/api/admission.ts, lib/api/audit.ts, lib/api/forms.ts, lib/api/landing.ts, ...
  │   (Phase 1: localStorage / in-memory fixtures)
  │   (Phase 2: http.<method>() to NestJS)
  ▼
lib/api/http.ts (axios instance)
  │   - baseURL ← NEXT_PUBLIC_API_URL
  │   - request interceptor sets x-tenant-code from URL
  │   - TODO Phase 2: auth bearer
  ▼
NestJS controllers (Phase 2)
```

The hooks and call sites are **invariant across phases**. Only the function bodies inside `lib/api/*` change. This is the single most important Phase 1 → Phase 2 contract.

### 6.4 Shared component vocabulary

- **`<AppShell>`** — composes sidebar (≥768px) / sheet drawer + bottom nav (<768px) / top bar. Slot-based for `tenantSwitcher`, `localeSwitcher`, `userMenu`.
- **`<StateBadge state>`**, **`<StateTimeline history>`**, **`<StateActions app role>`** — the admission state machine UI kit. Colors hardcoded (cross-tenant semantics).
- **`<FormBuilder schema control>`** — renders into the caller's `FormProvider`. Field types: text / number / date / select / file / scoring + section.
- **`<EmptyState>`**, **`<ErrorState>`** — presentational, i18n-free (strings via props). Used for 404, 403, not-found, query errors.
- **`<Stepper steps current>`** — progress indicator for the wizard.
- **`<Reveal>`** — IntersectionObserver-based reveal-on-scroll; respects `prefers-reduced-motion`; gated by `RevealStaticContext` for use inside live previews.

### 6.5 Form Builder — the hardest piece

The wizard mixes:
- A static `declarant` section (fullName, email, phone, relationship) — hand-written Zod.
- A dynamic per-campaign section produced by the FormBuilder.

Both must live inside **one** `useForm` so `form.trigger(stepFields)` can advance the wizard. This drives the two exported helpers in `@shared/form`:

```ts
fieldShape(schema): Record<name, ZodTypeAny>    // base shape, mergeable
refineFields(fields, data, ctx, messages)       // required-when-visible + min/max
```

The wizard builds a flat schema:

```ts
z.object({ ...declarantShape, ...fieldShape(campaignFormSchema) })
  .superRefine((data, ctx) =>
    refineFields(allFields(campaignFormSchema), data, ctx, msgs)
  )
```

`buildZodSchema(schema)` (used outside the wizard) is just `fieldShape + superRefine(refineFields)` under the hood — preserved as a single-call convenience.

### 6.6 State machine — single source of truth

`packages/shared/admission/states.ts` exports `APPLICATION_STATES` (with `code, label, description, tone, terminal`). `transitions.ts` exports `TRANSITIONS` (15 rules: 10 user-facing + 5 explicit `SYSTEM → EXPIRED`, enumerated so a Phase 2 cron can iterate without special-casing). FE uses `getAllowedTransitions(state, role)`; Phase 2 BE re-imports the same constants for guard checks.

### 6.7 Permissions — single source of truth

`packages/shared/auth/abilities.ts` exports `ROLE_ABILITIES` (a flat matrix), `createAbility(ctx)`, and `can(ctx, action, subject)`.

- String subject = coarse check (menu / route). Skips scope + `when`. Optimistic.
- Object subject = instance check. Includes scope (`own` / `tenant` / `*`) and `when` predicates (e.g. parent can update only if `state ∈ {DRAFT, NEEDS_INFO}`).

Phase 2 BE wraps the same matrix in a NestJS `@RequirePermission(action, resource)` decorator + guard. Phase 2 also generates RLS policies from the same matrix where feasible.

### 6.8 i18n architecture (ADR-008)

- next-intl 4, locale fixed at request time, **no URL prefix**.
- Cookie `EDUGATE_LOCALE` persists user choice; switcher is a server action.
- `i18n/locale.ts` is pure (safe for client bundle); `i18n/locale-actions.ts` is `"use server"`.
- Namespaces: `common, landing, apply, track, form, auth, admin, marketing, print, errors`.
- All chrome strings flow through `t('key')`. Per-tenant landing content is **data**, not i18n keys.

### 6.9 Print architecture (ADR-009)

A dedicated route `(public)/track/[code]/print` renders the document with regular React + Tailwind under `@media print { @page A4 14mm }`. The toolbar is `print:hidden`.

- Phase 1: client component calls `window.print()` after data load.
- Phase 2: NestJS worker uses Puppeteer to navigate the same URL headlessly, capture PDF, store, attach to email.

Single source of truth — the document is the React component, regardless of where the PDF is born.

---

## 7. Backend Architecture (Phase 2 Plan)

### 7.1 NestJS modules

```
src/
├── auth/                 Login, OTP, password reset, sessions (Better-Auth)
├── tenant/               Tenant CRUD, branding, module toggling (SUPER_ADMIN)
├── tenant-context/       Interceptor: read JWT, SET LOCAL app.tenant_id
├── admission/
│   ├── application/      CRUD + state transitions
│   ├── campaign/         Per-tenant intake windows
│   ├── form-template/    JSON schema versioned per campaign
│   └── review/           Reviewer assignment
├── notification/         Email queue producer (Resend via BullMQ)
├── audit/                Cross-cutting interceptor + viewer
├── storage/              R2 / MinIO adapter
└── platform/             Cross-tenant ops for SUPER_ADMIN
```

### 7.2 Tenant context interceptor

```ts
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler) {
    const req = ctx.switchToHttp().getRequest();
    const tenantId = req.user?.activeTenantId;
    if (!tenantId) throw new ForbiddenException();
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SET LOCAL app.tenant_id = ${tenantId}`);
      return next.handle().toPromise(); // tx is bound for the whole request
    });
  }
}
```

Every business endpoint runs inside one transaction with `app.tenant_id` set, so RLS policies authoritatively scope every read and write.

### 7.3 RLS policy template

```sql
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON applications
  USING      (tenant_id = current_setting('app.tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

-- SUPER_ADMIN bypass via a separate connection role with BYPASSRLS
```

Generated, not hand-written, from a code-gen step that reads `packages/shared/auth/abilities.ts`.

### 7.4 Drizzle schema (sketch)

```ts
tenants            (id, code unique, name, short_name, logo_url, theme jsonb, modules text[])
users              (id, email lower-citext, password_hash, status)
tenant_users       (tenant_id, user_id, roles text[], PRIMARY KEY (tenant_id, user_id))
roles              (id, code, label)
admission_campaigns(id, tenant_id, code, name, opens_at, closes_at, form_template_id)
form_templates     (id, tenant_id, version, schema jsonb)
applications       (id, tenant_id, campaign_id, code, state, applicant jsonb, form_data jsonb,
                    submitted_at, decided_at, decided_by, created_at, updated_at)
application_history(id, application_id, tenant_id, state, at, by, note)
notification_templates(id, tenant_id, channel, kind, subject, body)
audit_log          (id, tenant_id, at, actor_id, actor_role, action, resource, target_id, target_label, payload jsonb)
sessions           (id, user_id, tenant_id_active, ...)  -- Better-Auth
```

- Every business table has `tenant_id NOT NULL` + index on `tenant_id` and composite indexes including `tenant_id` first.
- `applications.code` is unique per `tenant_id` (composite), human-friendly: `CVA-26-7K3QF2`.
- `application_history` is append-only — no UPDATE / DELETE policy.

### 7.5 Async work (BullMQ)

| Queue | Producer | Consumer | Purpose |
|---|---|---|---|
| `email` | application submit, state change | notification worker → Resend | Receipt, status update, OTP |
| `pdf` | admin export, post-decision | PDF worker → Puppeteer → R2 | Receipts, application PDFs |
| `cron-expire` | scheduler | admission worker | Iterate `TRANSITIONS` `SYSTEM → EXPIRED` for past-deadline campaigns |
| `audit-flush` (optional) | interceptor | audit worker | Batched writes if hot |

### 7.6 OpenAPI / codegen

- NestJS exports an OpenAPI 3.1 spec at `/openapi.json`.
- `apps/web/openapi/schema.json` is regenerated from this.
- `pnpm codegen:api` runs `openapi-typescript` → `lib/api/generated/schema.d.ts` (types only).
- Hooks remain hand-written; `lib/api/*` bodies switch from mock to `http.<method>` typed against the generated schema.

### 7.7 Auth (Better-Auth or custom JWT)

- One user can belong to multiple tenants via `tenant_users`.
- JWT embeds `activeTenantId`; switching tenants hits `POST /auth/switch-tenant` which mints a fresh JWT after verifying membership.
- Email is case-insensitive per tenant — implementation may need a custom JWT if Better-Auth global email uniqueness conflicts. ADR slot reserved.
- 4 flows in Phase 2 hook into existing Phase 1 routes: login, forgot-password, reset-password, set-password (invited), activate (newly-created).

---

## 8. Security Architecture

### 8.1 Tenant boundary — recap

1. App layer: every query has `tenant_id`.
2. BE guard: every controller checks `@RequirePermission`.
3. RLS: every business table enforces tenant policy.

No layer is sufficient alone; no two layers are sufficient together; all three are required.

### 8.2 Auth

- Sessions HTTP-only, Secure, SameSite=Lax.
- Passwords hashed with argon2id.
- Anti-enumeration on `forgot-password` (always reports "sent").
- OTP for parents (no password — they don't have accounts in Phase 1).
- Rate limiting on `login`, `forgot-password`, `verify-otp`, `register`/`createApplication` per IP + per email (Phase 2 via Redis token-bucket).

### 8.3 Headers and CSRF

- Caddy adds standard security headers (`Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`).
- Content-Security-Policy in Phase 2: `default-src 'self'; img-src 'self' data: https://images.unsplash.com [R2 origin]; style-src 'self' 'unsafe-inline'` (theme `<style>` injected inline). Refine before launch.
- Inbound `x-tenant-code` always stripped.
- CSRF: same-origin cookies + Next server actions are CSRF-safe by design; explicit cross-origin endpoints require token.

### 8.4 Data residency & PII

- All persistent data + backups in VN.
- Backups via `pgbackrest` to VN-located object storage. Encrypted at rest.
- Application data export available to TENANT_ADMIN via CSV / PDF (Phase 2).
- Soft delete (30 days) before hard delete on applications (Phase 2).

### 8.5 Audit

- Every mutation produces an `audit_log` row via NestJS interceptor (Phase 2). Append-only.
- Cross-tenant access by SUPER_ADMIN logged with elevated severity.

---

## 9. Deployment & Operations

### 9.1 Topology

```
VN VPS (single host for pilot; multi-host for scale)
├── Coolify (deploy orchestration)
└── Docker Compose
    ├── caddy           Wildcard TLS via Let's Encrypt DNS-01
    ├── apps-web        Next.js standalone build
    ├── apps-api        NestJS (Phase 2)
    ├── postgres        PostgreSQL 16 + WAL archive
    ├── redis           BullMQ
    └── minio           Object storage (optional; R2 alternative)
```

- TLS: wildcard cert `*.tuyensinhnhanh.vn` via Let's Encrypt DNS-01 (e.g. Cloudflare DNS plugin).
- Backups: nightly `pgbackrest` full + WAL streaming to remote VN bucket. Restore drill quarterly.
- Monitoring: Coolify logs + a thin Prometheus + Grafana stack on the same host (Phase 2). Sentry for FE errors.
- Secrets: Coolify env, mounted into containers; never in repo.

### 9.2 Environments

| Env | Purpose | Tenant resolution |
|---|---|---|
| `dev` (local) | Developer machines | localhost + path fallback `/t/:code` |
| `staging` | QA, pilot rehearsal | `*.staging.tuyensinhnhanh.vn` wildcard |
| `prod` | Live tenants | `*.tuyensinhnhanh.vn` wildcard |

### 9.3 CI/CD

- Push → GitHub Actions → `pnpm install`, `turbo run typecheck lint build` → Docker image build → Coolify deploy hook.
- Migrations run as a one-shot job before the `apps-api` container is updated. Down-migrations exist for forward-only schema with safe defaults.

### 9.4 Scaling assumptions (Phase 2)

| Metric | Pilot | Steady state per tenant | Notes |
|---|---|---|---|
| Tenants | 1 | up to 200 / instance | Postgres connection limits drive the ceiling |
| Applications / tenant / year | 500 | 30–2,000 | Bursty during intake season |
| Peak concurrency / tenant | 50 | 200 | Submission deadline night |
| Email throughput | 100 / day | 5,000 / day | Resend handles |

Vertical scale first (one well-provisioned VPS); horizontal scale by tenant-shard when one host is full.

---

## 10. Observability (Phase 2)

- **Logs**: structured JSON; every log line carries `request_id, tenant_id, actor_id`. Stream to a host-local log aggregator (e.g. Loki).
- **Metrics**: Prometheus — request rate, latency p50/p95/p99, error rate, queue depth, DB connection pool usage. Per-tenant labels for billing-relevant counters.
- **Tracing**: optional Phase 2.5 — OpenTelemetry to a self-hosted Tempo.
- **Frontend errors**: Sentry.
- **Audit log**: business-level "who did what" — orthogonal to logs.

---

## 11. Testing Strategy

### 11.1 Phase 1 (current)

- TypeScript strict + `noUncheckedIndexedAccess` + `verbatimModuleSyntax` — catches a wide class at compile time.
- `pnpm lint`, `pnpm typecheck`, `pnpm build` gates every change.
- Manual smoke tests per task documented in `docs/PLAN.md` notes.
- Visual smoke: `/admin` renders state machine demo as a visual regression target.

### 11.2 Phase 2 plan

- **Unit**: business logic in `packages/shared` (state machine transitions, permission matrix, form Zod refinement).
- **Integration**: NestJS — each module's controllers spun up against a real Postgres with RLS enabled. Two tenants seeded; every test asserts tenant-A cannot see tenant-B data.
- **E2E**: Playwright — landing → register → submit → track. Smoke runs in CI per PR; full suite nightly.
- **Visual**: Playwright screenshots per tenant for landing and admin shell.
- **Load**: k6 against the wizard submit path before each admission season.

---

## 12. Open Architectural Questions

| # | Question | Defer until |
|---|---|---|
| AQ1 | Better-Auth vs custom JWT for per-tenant case-insensitive email — confirm via spike. | Phase 2 backend kickoff |
| AQ2 | Should RLS policies be code-gen'd from `abilities.ts` or hand-written? | Phase 2 schema review |
| AQ3 | Per-tenant subdomain on Vietnamese DNS providers — is wildcard `*.tuyensinhnhanh.vn` + DNS-01 reliable? | Pilot pre-launch |
| AQ4 | Object storage default — Cloudflare R2 (better DX, non-VN) vs MinIO (VN-resident). Likely depends on legal review per tenant. | Pilot pre-launch |
| AQ5 | Tenant-shard by host or one-DB-many-schemas — start with one DB / shared schema + RLS; revisit at 100+ tenants. | Scale review |
| AQ6 | OpenTelemetry tracing — pull in Phase 2 or defer to Phase 3? | Post-pilot |
| AQ7 | Form template versioning storage — keep versions in `form_templates` row vs an event log? | Phase 2 schema review |

---

## 13. Decision Log Reference

All architectural decisions referenced above live in `docs/DECISIONS.md` as ADRs:

- **ADR-001** Monorepo Turborepo + pnpm
- **ADR-002** Next.js 15 App Router + Tailwind v4 + shadcn/ui
- **ADR-003** NestJS + Drizzle (not Prisma, not TypeORM)
- **ADR-004** PostgreSQL self-host VN (not Supabase prod)
- **ADR-005** Tenant resolution subdomain + path fallback
- **ADR-006** Theming per tenant via CSS variables (not build-time)
- **ADR-007** Multi-conversation continuity via `CLAUDE.md` + `docs/PLAN.md`
- **ADR-008** i18n via next-intl, runtime built before feature pages, no locale routing
- **ADR-009** PDF export via print-CSS + dedicated route (not @react-pdf)

New decisions append to that file; this architecture doc is updated to point at them.

---

## 14. Appendix — File Map of Phase 1 Implementation

For reviewers wanting to trace each architectural claim above to code:

| Concern | Path |
|---|---|
| Tenant resolver primitives | [packages/shared/src/tenant.ts](../packages/shared/src/tenant.ts) |
| Tenant middleware | [apps/web/middleware.ts](../apps/web/middleware.ts) |
| Theme tokens + CSS injection | [packages/shared/src/theme.ts](../packages/shared/src/theme.ts), [apps/web/lib/tenants/branding.ts](../apps/web/lib/tenants/branding.ts), [apps/web/app/layout.tsx](../apps/web/app/layout.tsx) |
| State machine | [packages/shared/src/admission/states.ts](../packages/shared/src/admission/states.ts), [transitions.ts](../packages/shared/src/admission/transitions.ts) |
| State UI kit | [packages/ui/src/components/admission/](../packages/ui/src/components/admission/) |
| Permission matrix | [packages/shared/src/auth/abilities.ts](../packages/shared/src/auth/abilities.ts) |
| Ability provider + gates | [apps/web/lib/auth/](../apps/web/lib/auth/), [apps/web/components/auth/](../apps/web/components/auth/) |
| Form schema + Zod | [packages/shared/src/form/](../packages/shared/src/form/) |
| FormBuilder renderer | [packages/ui/src/components/form-builder/](../packages/ui/src/components/form-builder/) |
| Landing model | [packages/shared/src/landing/sections.ts](../packages/shared/src/landing/sections.ts) |
| Landing renderer | [apps/web/components/landing/](../apps/web/components/landing/) |
| Wizard | [apps/web/app/(public)/register/_steps/](../apps/web/app/(public)/register/_steps/) |
| Track + print | [apps/web/app/(public)/track/](../apps/web/app/(public)/track/), [apps/web/components/print/](../apps/web/components/print/) |
| Admin shell + nav | [apps/web/app/(admin)/_components/admin-shell.tsx](../apps/web/app/(admin)/_components/admin-shell.tsx), [packages/ui/src/components/app-shell/](../packages/ui/src/components/app-shell/) |
| Settings (branding + landing editor) | [apps/web/app/(admin)/admin/settings/](../apps/web/app/(admin)/admin/settings/) |
| Audit | [packages/shared/src/audit/](../packages/shared/src/audit/), [apps/web/app/(admin)/admin/audit-log/](../apps/web/app/(admin)/admin/audit-log/) |
| API seam | [apps/web/lib/api/](../apps/web/lib/api/) |
| TanStack Query hooks | [apps/web/lib/api/queries.ts](../apps/web/lib/api/queries.ts) |
| i18n | [apps/web/i18n/](../apps/web/i18n/), [apps/web/messages/](../apps/web/messages/) |
| Marketing site | [apps/web/components/marketing/](../apps/web/components/marketing/) |
