# PLAN — FE Phase 1

> Source of truth cho việc đang làm. Đọc trước khi bắt đầu conversation.
> Status: `[ ]` chưa, `[~]` đang, `[x]` xong. Tick khi merge/commit task.

## Pha 1 — Frontend foundation (mục tiêu: demo luồng tuyển sinh end-to-end với mock data)

### Foundation
- [x] **1. Init Turborepo + pnpm monorepo skeleton**
  - Root: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, `.gitignore`, `.nvmrc`, `.prettierrc`, `README.md`.
  - Folder: `apps/`, `packages/ui`, `packages/shared`, `docs/`, `tools/`.
  - Docs: `CLAUDE.md`, `docs/PLAN.md`, `docs/DECISIONS.md`, `docs/STATE_MACHINE.md`, `docs/PERMISSIONS.md`.
  - pnpm install OK (turbo 2.9.14, prettier 3.8.3, typescript 5.9.3).
- [x] **2. Scaffold `apps/web` (Next.js 15 + App Router + Tailwind v4 + TS strict)**
  - Route groups: `(public)`, `(auth)`, `(admin)` với layout + page stub mỗi nhóm; 404 ở `app/not-found.tsx`.
  - Tailwind v4 qua `@tailwindcss/postcss`, `globals.css` chỉ `@import "tailwindcss"` (theme tokens để task 4).
  - ESLint 9 flat config + `eslint-config-next` (core-web-vitals + typescript); script `lint` dùng ESLint CLI (next lint deprecated v16).
  - `tsconfig.json` extends base, paths `@/*`. Build/lint/typecheck pass (Next.js 15.5.18).
- [x] **3. Setup `packages/ui` với shadcn/ui base components**
  - 16 component: button, input, label, form, card, dialog, sheet, dropdown-menu, select, checkbox, radio-group, table, badge, separator, skeleton, sonner.
  - `cn()` helper (clsx + tailwind-merge) ở `packages/ui/src/lib/utils.ts`.
  - `components.json` tại `packages/ui/` (style `new-york`, alias `@ui/components`, `@ui/lib`); shadcn CLI chạy từ `packages/ui/`.
  - Import per-subpath qua tsconfig `paths`: `@ui/components/*` → `packages/ui/src/components/*`, `@ui/lib/*` → `packages/ui/src/lib/*`. `"sideEffects": false` để tree-shake; trỏ thẳng `src/`, không build step.
  - `transpilePackages: ["ui"]` trong `apps/web/next.config.mjs` (task 4 mở rộng thành `["ui", "shared"]`).
  - Ship **default shadcn tokens** (light + dark, neutral palette) vào `apps/web/app/globals.css` qua `@theme inline` — task 4 sẽ swap sang per-tenant runtime injection (giữ nguyên key tên).
  - Tailwind v4 cross-package scan: thêm `@source "../../../packages/ui/src/**/*.{ts,tsx}"` trong `globals.css`.
  - Mount `<Toaster />` (sonner) vào `app/layout.tsx` luôn (không đợi AppShell task 7).
  - Note: `<Form>`/`<FormField>` ở đây là primitive RHF wrapper của shadcn; FormBuilder JSON-schema là task 10.
  - Deps phát sinh: `class-variance-authority`, `clsx`, `tailwind-merge`, `@radix-ui/react-{dialog,dropdown-menu,select,checkbox,radio-group,label,separator,slot}`, `lucide-react`, `sonner`, `react-hook-form`, `zod`, `@hookform/resolvers`, `tw-animate-css` (shadcn Tailwind v4 default).

### Theming (multi-tenant)
- [x] **4. Tenant CSS tokens + `globals.css` với `@theme`**
  - Full token set (light + dark) qua `:root` / `.dark` + `@theme inline` map sang Tailwind utilities.
  - `--font-sans` + `--font-mono` qua indirection `--font-sans-tenant` / `--font-mono-tenant` (sẵn override khi inject runtime).
  - Inter (next/font, subsets `latin` + `vietnamese`) gắn vào `html` qua `fontSans.variable`.
  - `TenantTheme` + `TenantColorTokens` + `DEFAULT_TENANT_THEME` + `tenantThemeToCss()` ở `packages/shared/src/theme.ts` (token shape mirror đúng tên CSS, ready cho task 6 inject).
  - `packages/shared` workspace package (`shared`) + alias `@shared/*`; apps/web add dep + `transpilePackages: ["ui", "shared"]`.
- [x] **5. Tenant resolver middleware**
  - `middleware.ts`: detect subdomain → tenant code; fallback `/t/:code/...`; set header `x-tenant-code`.
  - Resolver primitives ở `packages/shared/src/tenant.ts` (pure, không deps Next): `parseTenantFromHost`, `parseTenantFromPath`, `RESERVED_SUBDOMAINS`, `TENANT_HEADER`, `isValidTenantCode`, `resolveRootHosts`.
  - Root host list lấy từ env `TENANT_ROOT_HOSTS` (CSV); default dev `localhost,127.0.0.1`.
  - Subdomain canonical (case-insensitive theo DNS); path `/t/:code` strict-lowercase (URL case-sensitive → tránh duplicate URL cho cùng tenant).
  - Middleware strip inbound `x-tenant-code` để chống spoof — header chỉ do server set.
  - Matcher loại trừ `_next/static`, `_next/image`, `api`, `favicon.ico`, và mọi path có extension (`.*\..*`).
- [x] **6. Tenant config fetcher + CSS injection trong RootLayout**
  - `getTenantBranding(code)` cached. Inject `<style>:root{...}</style>` từ RSC. Test 2 tenant mock.
  - Contract `TenantBranding` ở `packages/shared/src/branding.ts` (code/name/shortName/logoUrl/theme) — pha 2 API trả về cùng shape.
  - Fixtures ở `apps/web/lib/tenants/fixtures.ts`: 2 tenant mock `cva-edu` (blue-600/400) + `tran-dai-nghia` (rose-700/400), helper `tenantTheme()` merge override lên `DEFAULT_TENANT_THEME` (chỉ overide primary + ring để brand-visible nhưng vẫn share neutral tokens).
  - `apps/web/lib/tenants/branding.ts`: `getTenantCode()` đọc `headers().get(TENANT_HEADER)` + re-validate shape; `getTenantBranding()` wrap `react.cache` để dedupe trong cùng RSC render (layout + page + metadata gọi nhiều lần, chỉ resolve 1).
  - `app/layout.tsx` async: render `<style id="tenant-theme" dangerouslySetInnerHTML>` trong `<body>` (React 19 hoist vào head); `generateMetadata` lấy title từ branding (per-tenant <title>).
  - Build: `/` chuyển từ `○` static → `ƒ` dynamic (do `headers()` opt-in dynamic) — expected cho multi-tenant SSR.
  - Smoke test 4 case (root / cva-edu subdomain / tran-dai-nghia subdomain / `/t/tran-dai-nghia` path): primary color, h1, title đều swap đúng; path fallback render identical với subdomain.

### Shell & cross-cutting
- [x] **7. AppShell mobile-first**
  - < 768px bottom nav + sheet drawer. ≥ 768px sidebar collapsible. Top bar: logo, tenant switcher, locale, user menu.
  - `packages/ui/src/components/app-shell/`: `app-shell.tsx` (compose, client), `sidebar.tsx`, `top-bar.tsx` (gồm `TenantSwitcher` + `LocaleSwitcher` placeholder + `UserMenu`), `bottom-nav.tsx`, `nav-link.tsx`, `types.ts`, `index.ts` barrel.
  - NavLink dùng `usePathname()` + `aria-current="page"`; variant `sidebar/drawer/bottom`. Active rule: exact hoặc `startsWith(href + '/')` → `/admin` không match `/admin/applications`.
  - Sidebar collapse state persist `localStorage["app-shell:sidebar-collapsed"]`, hydrate trong `useEffect` (chấp nhận flash nhẹ, pha 2 có thể chuyển cookie).
  - Bottom nav lấy `navItems.filter(pinned).slice(0, 4)` + nút "Thêm" mở Sheet drawer chứa full nav.
  - Top bar: hamburger mở drawer ở mobile; nút `PanelLeftClose/Open` toggle sidebar ở desktop; brand chip + `branding.shortName`; `TenantSwitcher` chỉ show khi `tenants.length > 1`, click → `window.location.assign('/t/{code}')` (pha 1 mock, pha 2 sẽ qua /switch-tenant endpoint).
  - `apps/web/app/(admin)/_components/admin-shell.tsx` ("use client") định nghĩa `ADMIN_NAV` (5 item lucide-react) + `MOCK_USER` + `MOCK_TENANTS`. "use client" cần thiết để LucideIcon ref cross RSC→client boundary qua `navItems` prop.
  - `(admin)/layout.tsx` RSC: fetch branding, pass shape `{code,name,shortName}` xuống `<AdminShell>`.
  - Web deps phát sinh: `lucide-react` (đã trong `ui`, nay add vào `web` cho admin-shell module). `ui` thêm `next` vào `peerDependencies` để resolve `next/link` + `next/navigation`.
  - DropdownMenuItem hiện chưa có `variant` prop → dùng className `text-destructive` cho mục đăng xuất.
  - Smoke test: `/admin` ở 2 tenant + 2 path form (subdomain, `/t/:code/admin`) đều render shell + theme + title đúng; `aria-current="page"` xuất hiện 2 lần (sidebar + bottom nav cùng highlight); default branding khi không có tenant code.
- [x] **8. State machine + components**
  - `APPLICATION_STATES`, `TRANSITIONS` trong `packages/shared`.
  - `<StateBadge>`, `<StateTimeline>`, `<StateActions>`. Xem `docs/STATE_MACHINE.md`.
  - `packages/shared/src/admission/`: `states.ts` (10 state + meta: code/label/description/tone/terminal + `isTerminalState`), `transitions.ts` (`TRANSITIONS` = 10 user-facing + 5 SYSTEM→EXPIRED = 15 rule + `APPLICATION_ROLES` + `getAllowedTransitions(state, role)` + `canTransition`), `index.ts` barrel.
  - EXPIRED transitions: enumerate explicit 5 from state (DRAFT/SUBMITTED/UNDER_REVIEW/NEEDS_INFO/APPROVED → EXPIRED, role SYSTEM) thay vì để '(any)' để cron pha 2 iterate được TRANSITIONS array không cần special-case.
  - `packages/ui/src/components/admission/`: `state-tone.ts` (tone → Tailwind palette light+dark), `state-icon.ts` (state → LucideIcon), `state-badge.tsx`, `state-timeline.tsx` (oldest-first vertical, highlight current), `state-actions.tsx` ("use client", render filtered transitions, destructive variant cho REJECTED/CANCELLED, Dialog + Textarea nhập reason khi `requireReason`).
  - Status colors **hardcode** Tailwind palette (gray/blue/amber/orange/green/red/emerald/violet/slate), KHÔNG đi qua tenant token — vì là semantics chung mọi trường.
  - Web deps phát sinh: `sonner` (cho `toast()` ở demo client), `lucide-react` đã có. `packages/ui/tsconfig.json` thêm path `@shared/*` → `../shared/src/*`.
  - Workaround `noUncheckedIndexedAccess`: Record lookup với key thuộc literal union vẫn return `V | undefined` — dùng `!` ở 3 site sau lookup vào `APPLICATION_STATES` / `STATE_ICON` / `TONE_BADGE_CLASS` / `TONE_DOT_CLASS` (đã có comment giải thích).
  - Thêm `<Textarea>` shadcn primitive (`packages/ui/src/components/textarea.tsx`) — cần cho reason dialog.
  - Smoke test `/admin` (cva-edu tenant): 10 badge labels + 3 timeline entries + 3 transition buttons (Duyệt default, Từ chối destructive, Yêu cầu bổ sung) đều render; tooltips từ state.description xuất hiện.
- [x] **9. Permission matrix + ability layer**
  - Matrix role × action × resource × scope (`own`/`tenant`/`*`) trong `packages/shared`.
  - `useAbility()` hook, `<Can>` gate, `<RequirePermission>` route gate. Xem `docs/PERMISSIONS.md`.
  - `packages/shared/src/auth/`: `permissions.ts` (ACTIONS/RESOURCES/SCOPES/ROLES/MODULES vocab + `moduleOf` resource→module map + `CORE_MODULES`), `abilities.ts` (`ROLE_ABILITIES` matrix mirror đúng bảng PERMISSIONS.md, `can(ctx,action,subject)`, `createAbility`), `index.ts` barrel. Re-export thêm ở `packages/shared/src/index.ts`.
  - `Subject = Resource | ResourceSubject`. String subject = coarse check (menu/route, bỏ qua scope + `when`, optimistic). Object subject = instance check (scope `own`/`tenant`/`*` + `when` state condition). Module toggle: resource thuộc module chưa mua (vd `employee`→hrms) → luôn `false` bất kể role; `platform` core không bao giờ gate.
  - FE layer ở `apps/web`: `lib/auth/ability-provider.tsx` (`AbilityProvider` nhận serializable `AbilityContext` từ RSC → build `Ability` client-side qua `useMemo` + `createAbility`; `useAbility()`), `lib/auth/session.ts` (`MOCK_ABILITY_CONTEXT` pha 1), `components/auth/can.tsx` (`<Can I a/an this fallback>`, đọc `props.this` qua property access vì `this` reserved word không destructure được), `components/auth/require-permission.tsx` (route gate + `<Forbidden>` 403 default).
  - `(admin)/layout.tsx` wrap `<AbilityProvider context={MOCK_ABILITY_CONTEXT}>` quanh `<AdminShell>`.
  - Không tách `Role` ⊇/inheritance — matrix flat, role cao khai lại rule role thấp (dễ diff với BE guard + RLS gen pha 2). `ApplicationRole` (transitions, có SYSTEM cron) giữ riêng — actor transition là khái niệm hẹp hơn user role; TENANT_ADMIN/SUPER_ADMIN vẫn pass admission action qua matrix.
  - Smoke test `/admin` (cva-edu, role mặc định ADMISSION_ADMIN): 3 coarse check bị chặn (line-through) = `update:tenant_config`, `create:tenant_user`, `read:employee` (module off); `update` trên hồ sơ own DRAFT được phép. typecheck/lint/build pass.
- [ ] **10. FormBuilder JSON schema → React Hook Form + Zod**
  - Support text/number/date/select/file/scoring/section. Conditional show/hide cơ bản.
  - Schema ở `packages/shared/src/form/` (thêm `zod` vào deps shared): `schema.ts` (discriminated union `FormFieldSchema` theo `type` + `FormSection` + `FormSchema`; base `name/label/required?/visibleWhen?/colSpan?`; `visibleWhen:{field,op:'eq'|'ne'|'in'|'nonEmpty',value?}`), `build-zod.ts` (`buildZodSchema` — field optional + `superRefine` enforce required-when-visible, field ẩn KHÔNG chặn submit), `defaults.ts` (`defaultValuesFor`).
  - Renderer ở `packages/ui/src/components/form-builder/`: `<FormBuilder schema control />` render vào FormProvider của caller (page own `<Form>` + submit, để wizard task 12 compose được). `field-renderers/` mỗi type dùng `FormField/FormItem/FormControl` sẵn có. Date = native `input[type=date]`, file = native bọc style, scoring = number bounded — KHÔNG thêm dep picker/dropzone. Visibility qua `useWatch`, field ẩn render-skip.
  - Verify: demo schema có field điều kiện trên `/admin`; typecheck/lint/build.
- [ ] **14. i18n next-intl** (VI default, EN slot, locale switcher)
  - Runtime đã dựng ở **P1** (provider, vi.json, plugin). Task 14 còn lại = EN messages thật + locale switcher (`<LocaleSwitcher>` placeholder ở top-bar task 7).
- [ ] **15. TanStack Query + axios client + OpenAPI codegen placeholder**
  - Mock data seam interim đã có ở **P2** (`apps/web/lib/api/*`). Task 15 = thay impl bằng axios + TanStack Query + OpenAPI codegen, giữ nguyên interface.
- [ ] **16. Empty / loading / error state patterns** (`<EmptyState>`, skeleton, `<ErrorBoundary>`, 404, 403)

### Prerequisites cho feature pages (chốt 2026-05-20 — làm trước 10-12)
- [x] **P1. next-intl runtime** (kéo phần runtime của task 14 lên trước)
  - Routes + mọi identifier tiếng Anh; CHỈ nội dung hiển thị (i18n messages) tiếng Việt.
  - Cài `next-intl`; `apps/web/i18n/request.ts` (locale cố định `vi`, KHÔNG locale-routing → middleware tenant nguyên vẹn); `messages/vi.json` + `en.json` (slot rỗng); `createNextIntlPlugin` trong `next.config.mjs`; root layout bọc `NextIntlClientProvider`. Namespace: `common/landing/apply/track/form`. RSC dùng `getTranslations`, client dùng `useTranslations`.
- [ ] **P2. UI primitives + mock data seam**
  - `packages/ui`: thêm `tabs` (radix-tabs), `accordion` (radix-accordion), `Stepper` custom (không dep). Dep mới: `@radix-ui/react-tabs`, `@radix-ui/react-accordion`.
  - `apps/web/lib/api/`: interface promise-based + mock impl (in-memory + localStorage để `/track` đọc được hồ sơ vừa nộp): admission (`createApplication`/`getApplicationByCode`/`sendEmailOtp`/`verifyEmailOtp`), landing (`getLandingConfig`), forms (`getApplicationFormSchema`). OTP mock = code dev cố định, hiện qua toast. 1 điểm swap sang axios+TanStack ở task 15.

### Feature pages
- [ ] **11. Landing page edu + section system configurable**
  - Hero, stats, 5-step process, info tabs, about, testimonials, FAQ, footer.
  - Section drag-orderable, mỗi section có schema content riêng. (Reorder editor = **task 17**; task 11 chỉ render theo thứ tự config.)
  - Model `packages/shared/src/landing/sections.ts`: union `LandingSection` theo `type` (`hero|stats|process|infoTabs|about|testimonials|faq|footer`), mỗi loại `content` typed + Zod schema (cho editor task 17); `LandingConfig{sections[]}`.
  - Render `apps/web`: `lib/api/landing.ts` `getLandingConfig(tenant)` mock per tenant → `components/landing/` mỗi section 1 component → `SECTION_REGISTRY` type→component → `(public)/page.tsx` RSC render theo thứ tự. Màu qua theme token; chrome qua next-intl; content per-tenant là data (không phải i18n key). Unknown type → skip + dev warn.
- [ ] **12. Admission apply flow 5 bước**
  - Route tiếng Anh, step = query param: `applicant → form → verify-email → confirmation` (`?step=`); tracking `/track/[code]`. (Slug VI `nguoi-khai/ho-so/...` trong mô tả gốc chỉ là khái niệm.)
  - 1 route `(public)/register/page.tsx` client wizard. RHF form gốc = declarant zod tĩnh **merge** `buildZodSchema(campaignFormSchema)` động.
  - "Tiếp" → `form.trigger(stepFields)` rồi `router.push('?step=...')` (mỗi bước 1 history entry → back chuẩn). **Step guard** chống nhảy bước: vào thẳng step sau khi draft rỗng → đẩy về bước hợp lệ xa nhất.
  - Draft auto-save debounced vào localStorage (loại File — không JSON được), hydrate trong `useEffect` (SSR-safe), clear khi submit thành công.
  - `_steps/`: `applicant-step`, `form-step` (`<FormBuilder>`), `verify-email-step` (OTP mock), `confirmation-step` (mã hồ sơ + link `/track/[code]`).
  - Tracking `(public)/track/[code]/page.tsx`: `getApplicationByCode` → `<StateBadge>` + `<StateTimeline>` (tái dùng task 8). Not found → empty state; `/track` index nhập mã.
  - Submit sau verify → `createApplication` mock → mã hồ sơ → lưu mock store.
- [ ] **13. Login + forgot/reset/set-password/activate**
  - Dùng tenant theme. `/t/:code/login` + `/login` đều work. Mock API.

### Admin & polish
- [ ] **17. Admin UI cho tenant chỉnh branding + landing**
  - Form chỉnh logo, colors (color picker), font, hero, sections (drag reorder), FAQ.
  - Preview live bên cạnh.
- [ ] **18. PDF export hồ sơ + biên lai** (template trước, hook BE pha 2)
- [ ] **19. Audit log viewer admin** (UI trước, BE pha 2)

---

## Pha 2 — Backend (chưa bắt đầu)

Sẽ break down khi pha 1 xong. Sơ bộ:
- NestJS skeleton + modules (`auth`, `tenant`, `admission`, `notification`).
- Drizzle schema: `tenants`, `users`, `tenant_users`, `roles`, `permissions`, `admission_campaigns`, `applications`, `form_templates`, `notification_templates`.
- Postgres RLS policies cho mọi bảng business.
- Better-Auth wiring + invite/activate/reset flows.
- BullMQ queue cho email/notification.
- Storage adapter R2/MinIO.
- OpenAPI spec export → regen FE client.

---

## Notes & decisions phát sinh

(Ghi vào đây khi có quyết định nhỏ không xứng ADR riêng.)

- 2026-05-20: Khởi tạo plan. Sử dụng tài liệu `docs/PLAN.md` làm source of truth giữa các conversation.
- 2026-05-20: Task 2 — `next lint` đã deprecated ở v16, dùng `eslint .` trực tiếp với flat config v9. `next-env.d.ts` add vào `ignores` vì Next auto-inject triple-slash reference cho `typedRoutes`.
- 2026-05-20: Task 3 — Package name = `ui` (workspace dep `ui: workspace:*`). Path aliases `@ui/components/*` và `@ui/lib/*` (apps/web tsconfig + packages/ui tsconfig). `transpilePackages: ["ui"]` ở `next.config.mjs`. `globals.css` import `tailwindcss` + `tw-animate-css`, `@source "../../../packages/ui/src/**/*.{ts,tsx}"`, full bộ tokens shadcn neutral + dark + `@theme inline`. Smoke test render Card + Button + Badge tại `/`. typecheck/lint/build cả 2 package pass.
- 2026-05-20: Task 4 — Font token đi qua indirection layer (`--font-sans-tenant` ← inject runtime) thay vì map thẳng từ `var(--font-sans)` của next/font; làm vậy để task 6 có thể swap toàn bộ stack font per-tenant mà không mất Inter làm fallback. `tenantThemeToCss()` trả về CSS string đặt trong 1 `<style>` (vì RSC chỉ render 1 lần per request — không cần CSSStyleSheet API).
- 2026-05-20: Task 5 — Tách logic resolve ra `packages/shared/src/tenant.ts` (pure, no Next deps) để pha 2 NestJS có thể reuse cùng rule. Subdomain canonical, path `/t/:code` fallback rewrite về URL gốc. Reserved set: `www, app, api, admin, static, assets, cdn`. Tenant code regex = DNS label lowercase (`^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$`). Middleware xóa inbound `x-tenant-code` để chống spoof. Smoke test qua curl OK: subdomain → header set, path → rewrite + header, reserved/invalid → 404 hoặc no header. Task 6 sẽ dùng `headers().get(TENANT_HEADER)` từ RSC.
- 2026-05-20: Task 6 — Dùng `react.cache` (per-request memoize) thay `unstable_cache`; pha 1 fixtures là pure lookup không IO nên không cần revalidation. Pha 2 swap sang Drizzle query + `unstable_cache` với tag `tenant:${code}`, signature giữ nguyên. Không dùng `server-only` package (chưa cài) — `next/headers` đã enforce server boundary ngầm. Style inject qua `<style dangerouslySetInnerHTML>` trong `<body>`, React 19 tự hoist vào `<head>`; đặt sau `globals.css` cho tenant tokens override.
- 2026-05-20: Task 7 — RSC→client boundary cho nav items: lucide `LucideIcon` không thể serialize qua boundary nếu module gốc không `"use client"`. Giải pháp: định nghĩa `ADMIN_NAV` trong `_components/admin-shell.tsx` ("use client") → tất cả lucide imports được bundler treat as client references, array đi qua được. Pattern: RSC layout fetch data (branding), client shell module own UI config + composition. `next` chuyển vào `packages/ui` peerDependencies (không phải dependency) để dev không bị duplicate next install. `Link href` cast `as Route` (typedRoutes on).
- 2026-05-20: Task 8 — Không tách `ApplicationRole` thành module riêng để chờ task 9 rationalize cùng permission matrix; hiện inline ở `transitions.ts`. State machine demo (`_components/state-machine-demo.tsx`) là throwaway sẽ thay bằng feature page thật ở task 12/17 — giữ trên `/admin` page làm visual regression test interim. `useState` toast khi transition success chỉ là mock pha 1 — pha 2 wire vào BE `POST /applications/:id/transition`.
- 2026-05-20: Kế hoạch 10-12 + prereq chốt sau review. Routes + identifier tiếng Anh, chỉ i18n content tiếng Việt. (1) i18n: dựng next-intl runtime ngay (P1), locale cố định `vi` không locale-routing để không đụng middleware tenant → xem ADR-008. (2) Apply flow: 1 route, step = query param `?step=` (không route-per-step) — RHF form sống trong 1 client component, back/forward qua `router.push`, step guard chống nhảy bước, draft localStorage loại File. (3) Mock data seam interim (P2) thay task 15 chưa làm; date/file native không thêm dep. (4) FormBuilder: shared schema + zod, conditional required qua `superRefine` (field ẩn không chặn submit); renderer ở `packages/ui` nhận `control` để wizard compose.
- 2026-05-20: P1 — next-intl 4.12 cài vào `apps/web`. `i18n/request.ts` dùng `getRequestConfig` locale cố định `vi` (export `DEFAULT_LOCALE`/`AppLocale`), import động `../messages/${locale}.json` — KHÔNG locale-routing nên middleware tenant nguyên vẹn (ADR-008). `createNextIntlPlugin("./i18n/request.ts")` wrap config trong `next.config.mjs`. Root layout bọc `<NextIntlClientProvider>` (no-prop, v4 tự kế thừa locale+messages từ request config) quanh `{children}`+`<Toaster>`; `<html lang>` lấy từ `getLocale()`. `messages/vi.json` 5 namespace (common/landing/apply/track/form) nội dung VI thật; `en.json` = `{}` slot rỗng (task 14 điền + thêm switcher). Smoke: `(public)/page.tsx` RSC dùng `getTranslations("landing.hero")` cho badge. Build warning `import(t)` từ next-intl extractor (message-extraction dev tool) vô hại — typecheck/lint/build pass.
- 2026-05-20: Task 9 — Rationalize role: giữ `ApplicationRole` (transitions, +SYSTEM) tách khỏi auth `Role` (5 user role) thay vì hợp nhất — actor transition ≠ user role. Matrix flat (no inheritance) để 3 lớp FE/BE-guard/RLS diff thẳng cùng 1 file `abilities.ts`. Coarse check (subject là string) cố tình optimistic: bỏ scope + `when`, dùng cho menu/route gate; instance check mới đầy đủ. Module toggle gate theo resource được hỏi (`moduleOf`), áp cả SUPER_ADMIN; `platform` (tenant_config/tenant_user) là core không gate. `<Can>` đọc `props.this` qua property access (không destructure được reserved word). `AbilityContext` plain-serializable → truyền từ RSC layout xuống `<AbilityProvider>` client, `createAbility` chạy client-side.
