# Product Requirements Document — EduGate

> **Product**: EduGate — Multi-tenant Education SaaS
> **Phase 1 module**: Admission (school enrollment) for K-6 / lower-secondary schools
> **Reference model**: `tuyensinhlop6.cva-edu.com` (cogi-framework)
> **Author**: Product Owner
> **Status**: Draft v1.0
> **Last updated**: 2026-05-28

---

## 1. Executive Summary

EduGate is a multi-tenant SaaS platform that lets each Vietnamese school operate its own branded online admission portal — without per-school redeployment. Phase 1 ships the **Admission module** end-to-end: a public landing page, a 5-step parent registration flow, an OTP-verified submission, parent self-tracking, and an internal admin console for reviewers and tenant administrators.

The product is sold to schools (B2B), used by parents (B2C front-stage), and operated by school staff (B2B back-stage). One codebase, one deployment, one database — `tenant_id` isolation plus Postgres RLS enforce data separation; CSS variables enforce visual separation.

Subsequent phases add HRMS, Fee, LMS, Survey, CRM, POS, and Content modules sold à la carte per tenant. The shape of the platform — module toggling, role × resource permissions, configurable forms and landings — is designed today so those modules drop in without re-architecture.

---

## 2. Problem Statement

### 2.1 Current pain (validated against the reference site `cva-edu.com`)

Vietnamese schools running admission today rely on a mix of Google Forms, Facebook posts, printed paperwork, and in-person submission. The result:

- **For parents**: unclear status ("did the school receive my form?"), repeat data entry, in-person trips to confirm a document, slow feedback when something is missing.
- **For school staff**: paper folders, manual Excel, duplicate / inconsistent records, no audit trail, no defensible answer when a parent escalates.
- **For school leadership**: no real-time admission funnel, no per-campaign reporting, no way to brand the experience.

### 2.2 Why a custom build per school doesn't work

- Each school is too small to justify a bespoke build (~30 to 2,000 applications per intake).
- Off-the-shelf international SaaS (e.g. PowerSchool, Bromcom) is overpriced, English-only, and stores data outside Vietnam — violating NĐ 13/2023/NĐ-CP data residency requirements.
- Generic Vietnamese form tools (e.g. CoGi) lack the multi-tenant theming + permission matrix needed when schools want their *own* branded portal.

### 2.3 Why EduGate

A single multi-tenant platform amortizes engineering cost across N schools while preserving per-school branding, configurable forms, locale, and audit. Data lives in Vietnam (self-hosted on VN VPS via Coolify + Docker + Caddy). Modules are sold incrementally — admission first because every school needs it once a year, creating a recurring entry point for upsell into HRMS, Fee, and LMS.

---

## 3. Goals & Non-goals

### 3.1 Goals (Phase 1)

| # | Goal | Success signal |
|---|---|---|
| G1 | Ship a public admission portal a parent can complete end-to-end on mobile in < 10 minutes | Time-to-submit p50 ≤ 8 min, mobile completion rate ≥ 70% |
| G2 | Each tenant brands its own portal without redeploy | Tenant admin changes logo, color, hero, and 3 sections from UI; preview shows change within 1s |
| G3 | Reviewers process applications in a single screen with clear status semantics | Median time from `SUBMITTED` → `APPROVED`/`REJECTED` ≤ 48h; 0 status-ambiguity tickets after launch |
| G4 | Demonstrate the platform foundation (theming, permissions, audit, i18n, multi-tenant routing) so later modules drop in | Adding HRMS module in Phase 2 requires ≤ 1 new permission row, ≤ 1 new nav item, zero changes to tenant routing |
| G5 | Meet Vietnam data-residency expectations | All production data + backups stored in VN-located infrastructure |

### 3.2 Non-goals (Phase 1)

- Payment collection for application fees (Phase 2 — Fee module).
- Automated PDF generation server-side (Phase 1 uses browser `window.print()` → Save as PDF; Phase 2 adds Puppeteer worker).
- SMS / Zalo notifications (Phase 2 — email-only in Phase 1 via Resend).
- Enrollment workflow after admission acceptance (Phase 2 — once `ENROLLED`, parents are handed off to school's existing process).
- Mobile native apps. Mobile web is a first-class target; native is not on the roadmap.
- Live chat with parents. Existing channels (Zalo, phone) suffice.
- AI-assisted application screening. Out of scope.

---

## 4. Target Users & Personas

### 4.1 Parent / Applicant (primary B2C user)

- **Profile**: 30–45 years old, mobile-first (80%+ traffic from Android), variable digital literacy, often submits at 22:00 after dinner.
- **Jobs to be done**:
  - "Find the school's official admission portal and trust it's the right one."
  - "Submit my child's application without making a mistake I can't fix."
  - "Know what happens next, and when."
- **Pain to relieve**: anxiety about whether the form actually went through; needing to call the school to check.
- **Key behavior assumption**: will *not* create an account before applying. First-touch must be frictionless; identity verification happens via email OTP at the end of the flow.

### 4.2 Reviewer (school admission staff)

- **Profile**: teacher or admin assistant given the reviewer hat for one intake season per year.
- **Jobs**: open a queue of `SUBMITTED` applications, read each, approve / reject / ask for more info with a clear reason.
- **Pain**: drowning in paper, no way to share the queue with a colleague without losing track of who looked at what.
- **Constraint**: works on desktop in the office, but needs to be able to check from a phone at home.

### 4.3 Admission Admin (head of admission)

- **Profile**: deputy principal or admission coordinator.
- **Jobs**: configure the application form for the year, assign reviewers, monitor the funnel, export the final accepted list, answer escalations.
- **Authority**: full CRUD on applications, campaigns, form templates, and reviews within their tenant.

### 4.4 Tenant Admin (principal / school IT lead)

- **Profile**: school principal or the one IT-literate teacher.
- **Jobs**: configure branding (logo, colors, hero copy, landing sections), manage staff accounts and roles, view the audit log.
- **Authority**: everything Admission Admin can do, plus tenant configuration and user management.

### 4.5 Super Admin (EduGate operator)

- **Profile**: EduGate platform staff.
- **Jobs**: provision new tenants, toggle modules per tenant, investigate cross-tenant issues, run platform-wide audits.
- **Constraint**: cross-tenant access is logged and gated by route (`/platform/*`, Phase 2).

### 4.6 Persona priorities for Phase 1

P0 — Parent, Reviewer, Admission Admin, Tenant Admin.
P1 — Super Admin (skeletal: provisioning happens via internal script in Phase 1, full UI in Phase 2).

---

## 5. User Stories & Acceptance Criteria

### Epic A — Public-facing admission

#### A1. Parent discovers the school's admission portal

- As a parent, I land on `truong-x.tuyensinhnhanh.vn` (or `tuyensinhnhanh.vn/t/truong-x/`), and I see the school's brand (logo, colors, name) — not the EduGate brand.
- **AC**:
  - Hero, stats, 5-step process, info tabs, about, testimonials, FAQ, and footer sections render in the order the tenant admin configured.
  - The page is SSR (good for SEO + first paint), no flash of unstyled content.
  - The page is usable on a 360px-wide screen with thumb-only navigation.
  - Language defaults to Vietnamese; English is a one-click toggle in the header (persisted via cookie, no URL prefix).

#### A2. Parent submits an application

- As a parent, I click "Đăng ký", fill in 4 declarant fields, then a per-campaign dynamic form, then verify my email via 6-digit OTP, and I see a confirmation screen with an application code.
- **AC**:
  - 5 visible steps: applicant → form → verify-email → confirmation (the registration UI shows 4 steps; the underlying funnel is 5 if we count "landing"). The wizard surfaces a step indicator at all times.
  - Going back via browser back button does not lose entered data.
  - A draft auto-saves to `localStorage` every ~500ms while typing and is restored on refresh.
  - Field-level validation (required, email, VN phone, numeric min/max) shows inline before the user can advance.
  - A field hidden by conditional logic does NOT block submission, even if marked required.
  - OTP code in Phase 1 mock is `123456` and is surfaced to the developer via toast for demo purposes (will be a real email in Phase 2 via Resend).
  - After a successful submission, the URL becomes `?step=confirmation&code=XXX`; refreshing the page keeps the user on the confirmation screen with the same code.
  - The confirmation screen shows: the application code, instructions to save it, and a link to `/track/[code]`.

#### A3. Parent tracks an application

- As a parent, I open `/track`, enter my application code, and see the current state, a timeline, and download buttons for profile + receipt PDFs.
- **AC**:
  - `/track/[code]` resolves the application and renders `<StateBadge>` + `<StateTimeline>` (oldest-first, current state highlighted).
  - If the code is not found, an `<EmptyState>` is shown with copy explaining what to check.
  - The two download buttons open `/track/[code]/print?doc=profile|receipt` in a new tab; print CSS hides chrome and auto-triggers the print dialog.
  - Print output fits A4, paper colors are neutral (works regardless of theme), brand accent uses the tenant primary color.

### Epic B — Admin-facing admission

#### B1. Reviewer processes a queue

- As a reviewer, I open `/admin/applications`, see a list filtered to `SUBMITTED` + `UNDER_REVIEW`, open one, and approve / reject / request more info.
- **AC**:
  - State transitions visible in the UI exactly match `packages/shared/admission/transitions.ts`.
  - Rejecting and requesting-more-info require a reason; a dialog with a `<Textarea>` collects it before the transition fires.
  - Approving and confirming do not require a reason.
  - All transitions appear in the application's history with `{state, at, note}`.
  - State colors / icons match `docs/STATE_MACHINE.md`.

#### B2. Admission Admin configures the campaign form

- As an admission admin, I edit the JSON-schema-backed form for the current intake (add a "sibling at school" select, add a conditional "sibling name" text field shown when "has sibling" = yes).
- **AC** (UI implemented in Phase 1 via the FormBuilder primitives; full form-editor UI is a Phase 2 extension):
  - 6 field types: `text`, `number`, `date`, `select`, `file`, `scoring`. Plus `section`.
  - Conditional visibility: `{ field, op: 'eq'|'ne'|'in'|'nonEmpty', value? }`. Hidden fields do not validate.
  - Files store filename strings in Phase 1 (no upload); Phase 2 wires Cloudflare R2 / MinIO.

#### B3. Tenant Admin configures branding and landing

- As a tenant admin, I open `/admin/settings`, change my school's primary color, edit the hero copy, drag sections to reorder, and see a live preview.
- **AC**:
  - 4 color inputs (light + dark, primary + ring) with canonical text + native swatch.
  - 8 landing section types are editable (hero, stats, process, infoTabs, about, testimonials, faq, footer).
  - Section list supports drag-reorder via `@dnd-kit/sortable`, add/remove.
  - Preview pane renders the actual landing components with the draft data and the draft branding (CSS variable override).
  - Save persists to draft (Phase 1: localStorage; Phase 2: API). Reset reverts to the server copy.

#### B4. Tenant Admin reviews the audit log

- As a tenant admin, I open `/admin/audit-log`, see who did what in my tenant, and can filter by action and free-text search.
- **AC**:
  - Columns: timestamp, actor (name + role), action (color-coded badge), target.
  - Filter: action select + search box (300ms debounce, accent-insensitive).
  - Empty state and error state both render.
  - Only `TENANT_ADMIN` and `SUPER_ADMIN` see this route; others see a 403 `<EmptyState>` with `ShieldX` icon.

### Epic C — Authentication

#### C1. Staff logs in to their tenant

- As staff, I open `/login` (root) or `/t/:code/login` (path fallback), I enter email + password, and I land on `/admin`.
- **AC** (Phase 1 mock; Phase 2 wires Better-Auth):
  - 5 routes: `login`, `forgot-password`, `reset-password`, `set-password`, `activate`.
  - The 3 token-driven routes (`reset/set/activate`) share one `<CredentialForm>` component.
  - `forgot-password` always reports "sent" regardless of whether the email exists (anti-enumeration).
  - Tokens missing or empty → invalid-link `<EmptyState>`.

### Epic D — Platform / marketing

#### D1. Visitor without a tenant lands on the EduGate marketing site

- As a prospective school, I open `tuyensinhnhanh.vn` (no tenant subdomain), I see EduGate's brand (indigo), what the product does, which modules are live, and a "demo" CTA.
- **AC**:
  - When the host does not resolve to a tenant, `(public)/page.tsx` branches to `<MarketingHome>`.
  - EduGate brand color (indigo-600) is scoped via inline CSS variable override; tenant theming is untouched.
  - "Admission" module is labeled `live`; other 5 modules show a `coming soon` badge.

---

## 6. Functional Requirements

### 6.1 Multi-tenancy

- **Resolution**: subdomain canonical (`truong-x.tuyensinhnhanh.vn`), `/t/:code/...` path fallback for dev/staging. Reserved subdomains: `www, app, api, admin, static, assets, cdn`.
- **Header contract**: middleware sets `x-tenant-code` from resolved tenant; inbound header from clients is stripped (anti-spoof).
- **Tenant code rule**: DNS label, lowercase, regex `^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$`.
- **Switcher**: when a user belongs to multiple tenants, top-bar dropdown lets them switch.

### 6.2 Theming

- Per-tenant: logo URL, short name, full name, 4 color tokens (primary + ring × light + dark), font family, radius.
- Injected as `<style id="tenant-theme">` in `<body>` from RSC RootLayout (React 19 hoists to `<head>`). No FOUC.
- Status colors (state badges, audit actions) are hardcoded palettes — semantics that span every tenant, not theming.

### 6.3 Internationalization

- Default locale: `vi`. English (`en`) is a one-click toggle persisted in cookie `EDUGATE_LOCALE`.
- No locale URL prefix (preserves tenant middleware integrity — see ADR-008).
- Namespaces: `common, landing, apply, track, form, auth, admin, marketing, print, errors`.
- All visible strings flow through `next-intl`; data (per-tenant landing copy, form labels) is stored in the DB / config, not in message files.

### 6.4 Permission model

- 5 roles in Phase 1: `APPLICANT, REVIEWER, ADMISSION_ADMIN, TENANT_ADMIN, SUPER_ADMIN`.
- Matrix is `action × resource × scope` (`own | tenant | *`). Flat — no role inheritance, so all three layers (FE, BE, RLS) diff against the same file.
- `<Can I="..." this={resource}>` for instance checks; string subjects for coarse menu/route checks.
- Module toggle: a resource whose module isn't purchased always returns `false` regardless of role (e.g. `read:employee` when HRMS is off).
- Core modules (`platform`: `tenant_config`, `tenant_user`, `audit_log`) are never gated by purchase.

### 6.5 Application state machine

- 10 states, 15 transitions. Definition is the single source of truth at `packages/shared/admission/states.ts` + `transitions.ts`.
- 4 terminal states: `REJECTED`, `ENROLLED`, `CANCELLED`, `EXPIRED`.
- `EXPIRED` is system-driven by a Phase 2 cron iterating campaigns past their deadline.
- Reason required on `REJECTED` and `NEEDS_INFO`. Optional on `CANCELLED` (parent-initiated).

### 6.6 Form Builder

- Schema = `FormSchema { sections[]: FormSection { fields[]: FormFieldSchema } }`. Discriminated union by `type`.
- Field types: `text, number, date, select, file, scoring`. (`section` groups fields.)
- `buildZodSchema(schema)` returns a `ZodEffects` that:
  1. Makes every field optional at the base.
  2. In `.superRefine`, enforces required-when-visible + numeric `min/max` only when a value is present.
- `defaultValuesFor(schema)` seeds RHF.
- Renderer (`<FormBuilder schema control />`) renders into the caller's `FormProvider`, so a wizard can merge a static declarant section with the dynamic per-campaign schema in a single `useForm`.

### 6.7 Landing builder

- 8 section types: `hero, stats, process, infoTabs, about, testimonials, faq, footer`.
- Each has a Zod schema; `LandingSection` is a discriminated union; `LandingConfig { sections[] }`.
- Renderer dispatches by `section.type`; unknown types skip with a dev warning (forward-compat for new types added by a future tenant).

### 6.8 Audit log

- Cross-resource ledger of `who did what`. Entry: `{id, tenantId, at, actor{id,name,role}, action, resource, targetLabel?}`.
- 9 action types: `create, update, delete, approve, reject, login, export, state_change, settings_update`.
- Phase 1 = read-only viewer with in-memory fixtures. Phase 2 wires an interceptor that writes every mutation.

### 6.9 PDF export

- Phase 1: dedicated route `/track/[code]/print?doc=profile|receipt` rendered with print CSS, triggers `window.print()`. User saves as PDF via browser dialog.
- Phase 2: NestJS worker uses Puppeteer to navigate the same route headlessly and emit a real PDF for email attachment / archival.

### 6.10 Notifications (Phase 1 scope)

- Email only via Resend (Phase 2 wire). Templates: OTP, application received, application approved, application rejected, more-info-needed.
- Phase 1 mock: console + toast `devCode` for OTP.

---

## 7. Non-functional Requirements

| Category | Target |
|---|---|
| **Performance** | First contentful paint ≤ 1.5s on 4G mobile for landing. Wizard step transitions ≤ 200ms. Track page query ≤ 500ms p95. |
| **Accessibility** | WCAG 2.1 AA. Keyboard-navigable wizard, semantic landmarks, `aria-current="page"` on active nav, focus-visible. |
| **Mobile** | Mobile-first. AppShell switches at 768px (bottom nav + sheet drawer below; sidebar above). Landing tested at 360px. |
| **Browser support** | Last 2 versions of Chrome, Safari, Edge, Firefox. Safari iOS 15+. Android Chrome 100+. |
| **Security** | Tenant isolation enforced at 3 layers: app `tenant_id` filter, BE guard, Postgres RLS. FE permission gate is UX only. Inbound `x-tenant-code` always stripped. Anti-enumeration on `forgot-password`. |
| **Data residency** | All production data, backups, and ops infrastructure located in Vietnam (NĐ 13/2023/NĐ-CP). |
| **Compliance** | NĐ 13/2023/NĐ-CP personal data protection. Records retained per school's own policy; 30-day soft-delete window before hard delete (Phase 2). |
| **i18n** | All strings translatable. Locale switch is one click, no reload. Vietnamese diacritics handled in search (NFD + `\p{Diacritic}` strip). |
| **Observability (Phase 2)** | Structured logs with `tenant_id`, request id, actor id. Audit log captures every mutation. Sentry for FE errors. |
| **SEO** | Per-tenant `<title>` from branding. Landing is SSR. Marketing site indexable. Admin and parent personal pages noindex. |

---

## 8. Information Architecture & Routing

```
tuyensinhnhanh.vn                           → Marketing home (no tenant)
truong-x.tuyensinhnhanh.vn  ─┐
tuyensinhnhanh.vn/t/truong-x ─┴── (public)  ─── /                Tenant landing (8 configurable sections)
                                     ─── /register               5-step wizard (?step=applicant|form|verify-email|confirmation)
                                     ─── /track                  Track index (enter code)
                                     ─── /track/[code]           Application status (badge + timeline + print buttons)
                                     ─── /track/[code]/print     Print-CSS document (?doc=profile|receipt)

                            (auth)   ─── /login
                                     ─── /forgot-password
                                     ─── /reset-password?token=
                                     ─── /set-password?token=
                                     ─── /activate?token=

                           (admin)   ─── /admin                  Dashboard
                                     ─── /admin/applications     Queue + detail (Phase 2 full table)
                                     ─── /admin/settings         Branding + landing editor (live preview)
                                     ─── /admin/audit-log        TENANT_ADMIN+ only
```

Route guards: `(admin)` wraps everything in `<AbilityProvider>` + `<RequirePermission>`; tenant theme injected at root layout regardless of group.

---

## 9. Data Model (Phase 1, shared types)

Authoritative shapes live in `packages/shared/`. Phase 2 Drizzle schemas mirror these 1:1 with `tenant_id NOT NULL + index` on every business table.

- **Tenant**: `{ code, name, shortName, logoUrl, theme: TenantTheme }`
- **TenantTheme**: 4 color tokens (light + dark × primary + ring), font, radius — stored as oklch.
- **Application**: `{ code, tenantCode, campaignId?, state, applicant, formData, history, createdAt, updatedAt }`
- **Applicant**: `{ fullName, email, phone, relationship: 'father'|'mother'|'guardian'|'self' }`
- **ApplicationHistoryEntry**: `{ state, at, note? }`
- **FormSchema**: `{ sections[]: FormSection { id, title?, fields[]: FormFieldSchema } }`
- **LandingConfig**: `{ sections[]: LandingSection }`
- **AuditLogEntry**: `{ id, tenantId, at, actor{id,name,role}, action, resource, targetLabel? }`
- **AbilityContext**: `{ tenant{id,code,modules[]}, user{id,roles[]} }` — serializable from RSC to client.

---

## 10. Release Plan & Milestones

| Phase | Scope | Status |
|---|---|---|
| **Phase 1 — FE foundation + Admission demo** | All 20 tasks in `docs/PLAN.md`: monorepo, theming, AppShell, state machine, FormBuilder, landing renderer, 5-step wizard, tracking, print, auth pages, audit viewer, marketing site. Mock data via localStorage seam. | **Done** |
| **Phase 2 — Backend + production wire-up** | NestJS API, Drizzle schema, Postgres + RLS, Better-Auth, Resend email, R2/MinIO storage, BullMQ workers, Puppeteer PDF, OpenAPI codegen swapping mock seams. | Not started |
| **Phase 3 — First paying tenant onboarding** | One school pilot (e.g. CVA-edu), production deploy on VN VPS, support runbook, monitoring. | Not started |
| **Phase 4+ — Additional modules** | HRMS, Fee, LMS, Survey, CRM, POS, Content — added per tenant demand. Each module follows the same pattern (own routes under `/admin/<module>`, own permissions, own DB tables). | Not started |

### 10.1 Phase 1 acceptance gate

- A demo user can: open the tenant landing → register → submit → see status → print receipt. End-to-end with mock data.
- A staff demo user can: log in → see admin shell → walk the state machine demo → edit branding/landing in `/admin/settings` → see the audit log.
- All routes pass `typecheck`, `lint`, `build` cleanly.
- Mobile tested at 360px on a real device for the landing + wizard.

### 10.2 Phase 2 entry criteria

- One pilot tenant signed.
- Backend stack approved (`docs/DECISIONS.md` ADR-003, ADR-004).
- Schema review for `tenants, users, tenant_users, applications, campaigns, form_templates, notification_templates`.

---

## 11. Metrics & Success Criteria

### 11.1 Parent-facing (B2C)

- **Funnel conversion** — view-landing → start-wizard → reach-OTP → submit. Target ≥ 60% submit-among-starters.
- **Time to submit** (p50) — target ≤ 8 minutes.
- **Mobile completion rate** — target ≥ 70% (Android dominant).
- **Track page revisits per submission** — proxy for status anxiety. Target ≤ 3 visits in the first 7 days.

### 11.2 Staff-facing (B2B)

- **Time to first review** (`SUBMITTED` → `UNDER_REVIEW`) — target ≤ 24h.
- **Time to decision** (`SUBMITTED` → terminal) — target ≤ 48h median.
- **Reason completeness** — 100% of `REJECTED` / `NEEDS_INFO` transitions carry a non-empty reason (enforced).

### 11.3 Platform (operator)

- **Tenants onboarded** — count.
- **Tenants live in admission season** — count concurrent.
- **Module attach rate** — % of admission tenants who also buy HRMS / Fee / LMS within 12 months. Target ≥ 30% by end of Phase 4.
- **Uptime** — target 99.5% during admission season; 99.0% otherwise.

### 11.4 Audit / compliance

- 100% of mutations produce an audit row (Phase 2 enforcement).
- 0 cross-tenant data leak incidents.

---

## 12. Risks & Open Questions

| # | Risk / question | Severity | Mitigation / owner |
|---|---|---|---|
| R1 | Tailwind v4 still maturing; some plugins may break. | Med | Stick to `@theme` + CSS variables, avoid niche plugins. |
| R2 | Postgres RLS performance under wide `tenant_id` indexes when tenant count is high. | Med | Index plan in ADR; benchmark at 100 tenants × 10k applications before pilot 2. |
| R3 | Puppeteer on self-hosted VN VPS requires chromium + sandbox tuning. | Low | Accepted in ADR-009; document Coolify Dockerfile. |
| R4 | Vietnamese phone format variability (mobile prefixes, `+84` vs `0`). | Low | Regex `^(0|\+84)\d{9,10}$` covers it; revisit if rejection complaints surface. |
| R5 | Parents losing application codes. | Med | Email receipt at submission (Phase 2 Resend) + show code in confirmation + print receipt. |
| R6 | Form schema migrations across years (last year's "sibling at school" field vs this year's). | Med | Form templates are versioned per campaign; an application snapshots its `formData` against the template version it was submitted with. |
| Q1 | Should `tenant_users` be a separate concept from `users`, or should users be tenant-scoped from the start? | Open | Current decision: separate; one user, many tenants via `tenant_users`. Revisit if Phase 2 pilot reveals friction. |
| Q2 | Application fee collection — Phase 2 or held until Fee module? | Open | Held until Fee module; pilot schools confirm they collect fees offline today. |
| Q3 | Document upload during application — required at submission or post-decision? | Open | Phase 1 leaves filename-string fields as placeholders; pilot school decides. |
| Q4 | SMS OTP — needed, or is email sufficient for parents? | Open | Email-only for Phase 2 launch; revisit based on pilot OTP-failure rate. |

---

## 13. Out of Scope (Phase 1) — explicit

- Payment processing.
- Real OTP email delivery (mock value `123456`).
- Real PDF generation (browser print only).
- File upload to object storage (filename string only).
- BE-driven audit log (in-memory fixtures only).
- Super Admin platform UI (`/platform/*`).
- Cross-tenant analytics.
- Tenant module marketplace UI.
- Tenant provisioning self-serve flow.
- Application import (CSV / Google Form migration).

---

## 14. Appendix

- **State machine**: `docs/STATE_MACHINE.md`
- **Permission matrix**: `docs/PERMISSIONS.md`
- **Architecture decisions**: `docs/DECISIONS.md`
- **Phase 1 implementation plan**: `docs/PLAN.md`
- **Stack & conventions**: `CLAUDE.md`
- **Architecture overview**: `specs/ARCHITECTURE.md` (companion to this PRD)
