# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> Context: `apps/web` is the Next.js 15 App Router frontend in a Turborepo monorepo. Root `CLAUDE.md` + `docs/PLAN.md` are the source of truth for conventions and task state — read those first.

## Commands

```bash
# From apps/web (or from repo root with --filter web)
pnpm dev           # Next.js dev server on :3000
pnpm build         # Production build
pnpm lint          # ESLint 9 flat config
pnpm typecheck     # tsc --noEmit (strict + noUncheckedIndexedAccess)
pnpm clean         # Delete .next and .turbo
pnpm codegen:api   # openapi-typescript → lib/api/generated/schema.d.ts (pha 2)
```

## Multi-tenant request flow

1. `middleware.ts` resolves `tenantCode` from subdomain (`cva-edu.localhost`) → `/t/:code` path → custom domain map (`CUSTOM_DOMAIN_TENANTS`). Sets `x-tenant-code` header (server-authoritative; strips inbound spoofs).
2. RSC layouts call `getTenantCode()` (reads header) → `getTenantBranding(code)` (`react.cache`-deduped per render).
3. Root layout injects `<style id="tenant-theme">` with override CSS vars from `tenantThemeToCss()`. Tenant tokens win over `globals.css` defaults at `:root` / `.dark`.
4. Admin layout also injects `<style id="admin-brand-mark">` for the brand accent only — admin uses `.admin-neutral` which pins `--primary` neutral with `!important` regardless of tenant theme.

## Route groups

| Group | Path | Notes |
|---|---|---|
| `(public)` | `/`, `/register`, `/track/[code]`, `/track/[code]/print` | Mobile-first, tenant-branded |
| `(admin)` | `/admin`, `/admin/applications`, `/admin/settings`, `/admin/audit-log` | Desktop-only, neutral palette |

`(auth)` route group was removed (ADR-013); admin access is token-gated instead.

## Admin auth (pha 1)

No session store. `(admin)/layout.tsx` reads cookie `ADMIN_COOKIE` (slug); if absent renders `<AdminGate>` (password input → server action sets cookie). `MOCK_ABILITY_CONTEXT` in `lib/auth/session.ts` is the hardcoded identity (role `TENANT_ADMIN`, tenant `cva-edu`). Pha 2 swaps this to a real JWT decode.

## Permission / ability system

`@shared/auth`: `ROLE_ABILITIES` matrix, `createAbility(ctx)`, `can(ability, action, subject)`.

FE layer:
- `lib/auth/ability-provider.tsx` — `AbilityProvider` receives a serializable `AbilityContext` from RSC, builds `Ability` client-side.
- `components/auth/can.tsx` — `<Can I="update" a="tenant_config">` gate (note: `this` is a reserved word → use `a`/`an`/`the` props).
- `components/auth/require-permission.tsx` — route-level gate; renders `<Forbidden>` (403) on deny.

## i18n

Cookie-based locale (`EDUGATE_LOCALE`), no URL prefix — see `i18n/request.ts`. No locale routing so middleware stays untouched. Default `vi`. `i18n/locale-actions.ts` is `"use server"` to write the cookie.

All UI strings go through `next-intl` (`getTranslations` in RSC, `useTranslations` in client). Namespaces: `common`, `landing`, `apply`, `track`, `form`, `print`, `admin.*`, `marketing`, `errors`.

## Data seam pattern

`lib/api/` is the single swap-point for pha 1 → pha 2. The public apply flow (`createApplication`, `getApplicationByCode`, `sendEmailOtp`, `verifyEmailOtp` in `admission.ts`) is **mock-backed** for offline FE work: OTP is the fixed code `123456` (`MOCK_OTP_CODE`), submitted applications persist to `localStorage` (`ghidanh:applications`) so confirmation + `/track/:code` resolve without a back-end. Admin/management endpoints are mixed — `listApplications` calls the real NestJS API via `lib/api/http.ts` (axios), analytics/notifications use the seeded generator. To go live, set `NEXT_PUBLIC_API_URL` and swap the apply-flow bodies back to `http` (signatures are API-compatible). TanStack Query hooks live in `queries.ts`; call sites never import seam functions directly.

RSC fetchers (`getLandingConfig`, `getApplicationFormSchema`, `getTenantBranding`) stay server-only and are **not** wrapped in `useQuery`. Per-tenant form schemas live in `lib/api/form-schemas/` (one file per tenant + registry, validated by the `@shared/form` meta-validator).

## FormBuilder

`<FormBuilder schema={FormSchema} control={control} />` (from `@ui/components/form-builder`) renders into the caller's `<Form>` / `useForm`. It does **not** own a `<form>` element. Use `fieldShape(schema)` + `refineFields(...)` to compose dynamic fields into a flat Zod object — `buildZodSchema` returns a `ZodEffects` that cannot be `.merge()`-d; use the two-part API instead.

## Theming tokens

Default tokens in `globals.css` (`:root` / `.dark`). Tenant override injected at runtime via `<style>` in root layout. Admin override in `(admin)/layout.tsx`. Font: `--font-sans-tenant` (Inter via next/font) + `--font-display-tenant` (Space Grotesk) for prominent names. Semantic colors (state-tone, audit action badges) are hardcoded Tailwind palette — intentional, cross-tenant.
