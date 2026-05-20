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
- [x] **10. FormBuilder JSON schema → React Hook Form + Zod**
  - Support text/number/date/select/file/scoring/section. Conditional show/hide cơ bản.
  - Schema ở `packages/shared/src/form/` (thêm `zod` vào deps shared): `schema.ts` (discriminated union `FormFieldSchema` theo `type` + `FormSection` + `FormSchema`; base `name/label/required?/visibleWhen?/colSpan?`; `visibleWhen:{field,op:'eq'|'ne'|'in'|'nonEmpty',value?}`), `build-zod.ts` (`buildZodSchema` — field optional + `superRefine` enforce required-when-visible, field ẩn KHÔNG chặn submit), `defaults.ts` (`defaultValuesFor`).
  - Renderer ở `packages/ui/src/components/form-builder/`: `<FormBuilder schema control />` render vào FormProvider của caller (page own `<Form>` + submit, để wizard task 12 compose được). `field-renderers/` mỗi type dùng `FormField/FormItem/FormControl` sẵn có. Date = native `input[type=date]`, file = native bọc style, scoring = number bounded — KHÔNG thêm dep picker/dropzone. Visibility qua `useWatch`, field ẩn render-skip.
  - Mock `getApplicationFormSchema(tenantCode)` ở `apps/web/lib/api/forms.ts` (dời từ P2) trả `FormSchema` demo per-tenant, cùng seam với `lib/api/admission.ts`.
  - Verify: demo schema có field điều kiện trên `/admin`; typecheck/lint/build.
- [x] **14. i18n next-intl** (VI default, EN slot, locale switcher)
  - Runtime đã dựng ở **P1** (provider, vi.json, plugin). Task 14 còn lại = EN messages thật + locale switcher (`<LocaleSwitcher>` placeholder ở top-bar task 7).
  - Locale persist qua **cookie** `EDUGATE_LOCALE` (không URL routing — ADR-008 giữ middleware tenant nguyên vẹn). `i18n/locale.ts` = hằng số pure (`LOCALES`/`AppLocale`/`DEFAULT_LOCALE`/`isAppLocale`) **không** import `next/headers` (an toàn cho client bundle); `i18n/locale-actions.ts` (`"use server"`) = `setUserLocale` set cookie; `request.ts` đọc cookie → `getRequestConfig`.
  - `en.json` dịch đầy đủ 5 namespace (mirror vi.json, giữ placeholder `{code}`/`{min}`/`{max}`).
  - `LocaleSwitcher` thật ở `apps/web/components/i18n/locale-switcher.tsx` (`"use client"`, `useLocale()` + `useTransition` → action + `router.refresh()`). `packages/ui` top-bar đổi từ placeholder no-op sang **slot** `localeSwitcher?: ReactNode` (AppShell forward) → ui không dính next-intl. Wire: AdminShell (admin top-bar) + `(public)/layout.tsx` (thanh mỏng top-right cho landing/register/track).
  - Verify: typecheck/lint/build pass; runtime smoke — không cookie → VI, cookie `en` → text EN + `<html lang="en">` ở cả public; switcher swap qua server action.
- [x] **15. TanStack Query + axios client + OpenAPI codegen placeholder**
  - Mock data seam interim đã có ở **P2** (`apps/web/lib/api/*`). Task 15 = thay impl bằng axios + TanStack Query + OpenAPI codegen, giữ nguyên interface.
  - **Scope thực tế pha 1** (BE pha 2 chưa tồn tại → không swap network thật): dựng tầng infra + bọc Query lên seam mock. Seam bodies giữ nguyên localStorage mock; pha 2 chỉ swap ruột sang `http.<method>()`, hooks + call-site bất biến.
  - `lib/api/http.ts`: axios instance (`baseURL` ← `NEXT_PUBLIC_API_URL` default `/api`), request interceptor set `x-tenant-code` (resolve client-side qua `@shared/tenant` `parseTenantFromHost`/`parseTenantFromPath` + `resolveRootHosts(NEXT_PUBLIC_TENANT_ROOT_HOSTS)`) + TODO auth bearer pha 2. Scaffold — chưa fire request thật.
  - `components/providers/query-provider.tsx` (`"use client"`, `QueryClient` lazy qua `useState`, defaults staleTime 30s/retry 1/no refetchOnFocus) wrap trong root layout **bên trong** `NextIntlClientProvider`.
  - `lib/api/queries.ts` (`"use client"`): hooks bọc seam — `useApplication(code)` (useQuery, `enabled` khi code≠rỗng), `useCreateApplication` (useMutation, `onSuccess` seed cache `admissionKeys.application(code)` → `/track/[code]` resolve tức thì), `useSendEmailOtp`/`useVerifyEmailOtp`. Query keys tập trung `admissionKeys`.
  - Refactor call-site: `/track/[code]` bỏ useEffect/useState thủ công → `useApplication`; wizard submit → `useCreateApplication().mutateAsync`; verify-email-step → `useSendEmailOtp`/`useVerifyEmailOtp` (bỏ `sending` state, dùng `isPending`). **RSC config giữ nguyên** (`getLandingConfig`/`getApplicationFormSchema` vẫn server-fetched, KHÔNG biến thành useQuery).
  - **OpenAPI codegen = placeholder** (chốt: `openapi-typescript` types-only + hooks viết tay, KHÔNG orval): devDep `openapi-typescript`, script `codegen:api` trỏ `./openapi/schema.json` → `./lib/api/generated/schema.d.ts` (spec chưa tồn tại, không chạy), `openapi/README.md` mô tả wiring pha 2.
  - Deps: `@tanstack/react-query` ^5.100, `axios` ^1.16, devDep `openapi-typescript` ^7.13.
  - Verify: typecheck/lint/build pass; smoke 4 route 200, `/track/[code]` render loading skeleton (useQuery), không lỗi server.
- [ ] **16. Empty / loading / error state patterns** (`<EmptyState>`, skeleton, `<ErrorBoundary>`, 404, 403)

### Prerequisites cho feature pages (chốt 2026-05-20 — làm trước 10-12)
- [x] **P1. next-intl runtime** (kéo phần runtime của task 14 lên trước)
  - Routes + mọi identifier tiếng Anh; CHỈ nội dung hiển thị (i18n messages) tiếng Việt.
  - Cài `next-intl`; `apps/web/i18n/request.ts` (locale cố định `vi`, KHÔNG locale-routing → middleware tenant nguyên vẹn); `messages/vi.json` + `en.json` (slot rỗng); `createNextIntlPlugin` trong `next.config.mjs`; root layout bọc `NextIntlClientProvider`. Namespace: `common/landing/apply/track/form`. RSC dùng `getTranslations`, client dùng `useTranslations`.
- [x] **P2. UI primitives + mock data seam** (admission seam only — landing/form mock dời sang task model của chúng)
  - `packages/ui`: thêm `tabs` (radix-tabs), `accordion` (radix-accordion), `Stepper` custom (không dep). Dep mới: `@radix-ui/react-tabs`, `@radix-ui/react-accordion`.
  - `@shared/admission/application.ts`: `Application` entity + `Applicant`/`ApplicantRelationship`/`ApplicationHistoryEntry` + `generateApplicationCode()`.
  - `apps/web/lib/api/`: interface promise-based + mock localStorage-backed cho **admission** (`createApplication`/`getApplicationByCode`/`sendEmailOtp`/`verifyEmailOtp`). OTP fixed `123456` (API trả `devCode`, step component toast). 1 điểm swap sang axios+TanStack ở task 15.
  - **Dời**: `getLandingConfig` → làm trong **task 11** (cần `@shared/landing` model); `getApplicationFormSchema` → làm trong **task 10** (cần `@shared/form` model). Tránh định nghĩa return type 2 lần trước khi model tồn tại.

### Feature pages
- [x] **11. Landing page edu + section system configurable**
  - Hero, stats, 5-step process, info tabs, about, testimonials, FAQ, footer.
  - Section drag-orderable, mỗi section có schema content riêng. (Reorder editor = **task 17**; task 11 chỉ render theo thứ tự config.)
  - Model `packages/shared/src/landing/sections.ts`: union `LandingSection` theo `type` (`hero|stats|process|infoTabs|about|testimonials|faq|footer`), mỗi loại `content` typed + Zod schema (cho editor task 17); `LandingConfig{sections[]}`.
  - Render `apps/web`: `lib/api/landing.ts` `getLandingConfig(tenant)` mock per tenant → `components/landing/` mỗi section 1 component → `SECTION_REGISTRY` type→component → `(public)/page.tsx` RSC render theo thứ tự. Màu qua theme token; chrome qua next-intl; content per-tenant là data (không phải i18n key). Unknown type → skip + dev warn.
- [x] **12. Admission apply flow 5 bước** (plan chi tiết hóa 2026-05-20 sau review — sửa 6 điểm vs mô tả gốc)
  - **Routes** (English, content VI qua next-intl namespace `apply`): wizard 1 route `(public)/register/page.tsx`; step = query param `?step=` theo thứ tự `applicant → form → verify-email → confirmation`. Tracking: `(public)/track/page.tsx` (index nhập mã) + `(public)/track/[code]/page.tsx`.
  - **#1 (sửa) — KHÔNG `.merge` zod được**: `buildZodSchema` trả `ZodEffects` (`.superRefine`) → không có `.merge`/`.extend`. Refactor `@shared/form` export 2 mảnh: `fieldShape(schema)` (record `name→ZodTypeAny` base, chưa refine) + `refineFields(fields, data, ctx, messages)` (body required-when-visible + numeric min/max). Wizard tự build 1 schema phẳng:
    ```
    z.object({ ...declarantShape, ...fieldShape(campaignFormSchema) })
      .superRefine((data, ctx) => refineFields(allFields(campaignFormSchema), data, ctx, msgs))
    ```
    `buildZodSchema` cũ giữ nguyên (refactor nội bộ gọi 2 hàm mới — không đổi chữ ký). Field name declarant (`fullName/email/phone/relationship`) ≠ dynamic (`studentName...`) nên phẳng không đụng. 1 `useForm` + 1 resolver → `form.trigger(stepFields)` chạy native.
  - **Declarant schema tĩnh** (zod): `fullName` min 1, `email` `.email()`, `phone` regex VN cơ bản, `relationship` `z.enum(["father","mother","guardian","self"])` (khớp `ApplicantRelationship` ở `@shared/admission`). Messages VI qua `useTranslations("apply"/"form")`.
  - **Điều hướng step**: "Tiếp" → `await form.trigger(STEP_FIELDS[step])`; pass → `router.push('?step=next')` (mỗi bước 1 history entry → back chuẩn). "Quay lại" → `router.back()` hoặc push prev.
  - **#3 (sửa) — Suspense**: `register/page.tsx` (RSC mỏng) bọc `<Suspense>` quanh `<RegisterWizard>` client vì wizard dùng `useSearchParams()` (Next 15 yêu cầu boundary, nếu không lỗi build).
  - **#4 (sửa) — Step guard dùng `replace`**: tính `furthestValidStep` từ data đã có (applicant valid? form valid?); nếu `?step=` vượt quá → `router.replace('?step=<furthest>')` (KHÔNG push, tránh history rác). Guard chạy trong `useEffect` sau hydrate.
  - **#5 (sửa) — draft KHÔNG cần loại File**: task 10 đã quyết file field lưu **filename string** → toàn bộ values JSON-serialize được. Draft auto-save debounced (~500ms) toàn bộ values vào localStorage key `edugate:draft:register:<tenant>`; hydrate trong `useEffect` (SSR-safe, tránh hydration mismatch); clear khi submit thành công.
  - **`_steps/`**: `applicant-step.tsx` (4 field declarant hand-written RHF, KHÔNG qua FormBuilder), `form-step.tsx` (`<FormBuilder schema control />` với `campaignFormSchema` từ `getApplicationFormSchema(tenant)`), `verify-email-step.tsx` (OTP mock), `confirmation-step.tsx`.
  - **Verify-email**: vào step → `sendEmailOtp({ email: declarantEmail })` (1 lần, có nút "Gửi lại"); `devCode` hiện qua `toast` (mock). Nhập mã → `verifyEmailOtp`. Verify OK → trigger submit toàn form → `createApplication({ tenantCode, applicant, formData })` (tách declarant vs dynamic từ values theo key) → nhận `code`.
  - **#6 (sửa) — confirmation refresh-safe**: sau `createApplication` → `router.replace('?step=confirmation&code=<CODE>')` + clear draft; `confirmation-step` đọc `code` từ query (không giữ ở state) → hiện mã + link `/track/[code]`.
  - **#2 (sửa) — `/track/[code]` là CLIENT component**: `getApplicationByCode` đọc localStorage (client-only) → RSC luôn null. Page client lấy `code` từ `params`, gọi trong `useEffect`: loading skeleton → tìm thấy render `<StateBadge state>` + `<StateTimeline history>` (reuse task 8) → not found render empty state. `/track` index = client form nhập mã → `router.push('/track/<code>')`.
  - **Stepper**: dùng `<Stepper steps current>` (P2) hiển thị tiến trình 4 bước ở đầu wizard.
  - Verify: typecheck/lint/build; SSR/dev smoke 1 tenant đi hết flow applicant→confirmation, mã hồ sơ vào store, `/track/[code]` đọc lại được; back/forward + guard không nhảy bước; refresh ở confirmation vẫn giữ mã.
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
- 2026-05-20: Task 11 — `@shared/landing/sections.ts` **zod-first**: zod schema mỗi section (8 type) → `z.discriminatedUnion("type")` → `z.infer` ra TS type (1 nguồn, editor task 17 dùng zod validate). `LandingConfig{sections[]}` + `LANDING_SECTION_TYPES`. Section content = **data** (VI string trong config, per-tenant editable) — KHÔNG i18n key; key `landing.*` seed ở P1 dùng làm default seeding, không lookup runtime. Mock `lib/api/landing.ts` `getLandingConfig(tenantCode)` 2 fixture khác **thứ tự + content** (cva-edu full 8 section; tran-dai-nghia order khác + ít section hơn) + default fallback; fixture tran-dai-nghia nhét 1 section `type:"gallery"` (cast `as unknown as LandingSection`) để test forward-compat. KHÔNG zod-parse trong mock (parse sẽ reject unknown — parse là việc của editor task 17). Components `apps/web/components/landing/` (8 RSC; infoTabs bọc `<Tabs>`, faq bọc `<Accordion>` — P2 client primitive). `section-registry.tsx` = dispatcher `switch(section.type)` (type-safe narrow) + `default` skip + `console.warn` dev (unknown type không crash). CTA href trỏ `/register`,`/track` (chưa tồn tại) → cast `as Route` (typedRoutes). `(public)/page.tsx` RSC map config order, key `${type}-${index}`. Màu qua token (`bg-primary/5`, `text-primary`...). Verify SSR curl: cva-edu render 8 section đúng order; tran-dai-nghia order khác + `gallery` skip (dispatcher trả null, warn log `[landing] Bỏ qua section type không hỗ trợ: gallery`, "gallery" trong HTML chỉ là dev RSC debug payload không phải DOM). Tabs/Accordion interactive chưa click-test headless. typecheck/lint/build pass.
- 2026-05-20: Task 10 — `@shared/form` (zod ^3.24.1 vào shared): `schema.ts` (union 6 type text/number/date/select/file/scoring + `FormSection`/`FormSchema` + `allFields`/`isNumericField`/`evalVisibility`/`isFieldVisible`), `build-zod.ts` (`buildZodSchema` — field optional ở base, `superRefine` enforce required-when-visible + numeric min/max khi có value; messages injectable qua param, default VI fallback — caller pha 12 truyền `t('form.*')`), `defaults.ts` (`defaultValuesFor` — numeric `undefined`, còn lại `""`). Renderer `@ui/components/form-builder/`: `form-builder.tsx` nhận `control` (render vào FormProvider của caller, cho task 12 merge declarant tĩnh + schema động 1 useForm), `FieldGate` dùng `useWatch({name: cond.field})` render-skip field ẩn (hook order ổn định: luôn watch). `field-renderers/` mỗi type 1 file + dispatcher `switch` (narrow union); number+scoring share renderer; date/file native; file lưu **filename string** (JSON-safe, upload pha 2); number onChange `valueAsNumber`/`undefined`. Web thêm deps `react-hook-form`/`@hookform/resolvers`/`zod` (task 12 cũng cần). Mock `lib/api/forms.ts` `getApplicationFormSchema(tenantCode)` per-tenant (tran-dai-nghia +field điểm tiếng Anh) — config là data, RSC-readable. Demo `/admin` (RSC fetch schema → `<FormBuilderDemo>` client). Verify SSR curl 2 tenant: field visible render, conditional `siblingName` ẩn khi `hasSibling` rỗng (rendered label count 0), tran-dai-nghia có englishScore. Interactive toggle/submit chưa test headless (cần browser) — logic FieldGate + superRefine + typecheck/lint/build pass.
- 2026-05-20: P2 — Tách scope: chỉ làm admission seam + UI primitives bây giờ. `getLandingConfig`/`getApplicationFormSchema` dời sang task 11/10 vì return type của chúng (`LandingConfig`/`FormSchema`) là model của các task đó, chưa tồn tại → định nghĩa kèm model, tránh khai 2 lần. UI: `tabs`/`accordion` (shadcn new-york, radix) + `Stepper` custom (no dep, pure presentational, server-safe). Accordion cần keyframes `accordion-down/up` → thêm `--animate-*` token + `@keyframes` vào `globals.css` (tw-animate-css không kèm). `Application` entity ở `@shared/admission/application.ts` (FE mock + pha 2 BE dùng chung). Mock store `lib/api/store.ts` localStorage-backed, client-only (SSR đọc trả rỗng) → apply wizard + `/track` chạy client. `lib/api/admission.ts` = swap point duy nhất cho task 15, có `MOCK_LATENCY_MS` 250ms cho loading states (task 16) + OTP fixed `123456` (API trả `devCode`, không import sonner — UI layer toast). ESLint: thêm `no-unused-vars` với `argsIgnorePattern:^_` (cho param giữ chữ ký nhưng mock bỏ qua).
- 2026-05-20: P1 — next-intl 4.12 cài vào `apps/web`. `i18n/request.ts` dùng `getRequestConfig` locale cố định `vi` (export `DEFAULT_LOCALE`/`AppLocale`), import động `../messages/${locale}.json` — KHÔNG locale-routing nên middleware tenant nguyên vẹn (ADR-008). `createNextIntlPlugin("./i18n/request.ts")` wrap config trong `next.config.mjs`. Root layout bọc `<NextIntlClientProvider>` (no-prop, v4 tự kế thừa locale+messages từ request config) quanh `{children}`+`<Toaster>`; `<html lang>` lấy từ `getLocale()`. `messages/vi.json` 5 namespace (common/landing/apply/track/form) nội dung VI thật; `en.json` = `{}` slot rỗng (task 14 điền + thêm switcher). Smoke: `(public)/page.tsx` RSC dùng `getTranslations("landing.hero")` cho badge. Build warning `import(t)` từ next-intl extractor (message-extraction dev tool) vô hại — typecheck/lint/build pass.
- 2026-05-20: Task 12 — `@shared/form` refactor (#1): tách `fieldShape(schema)` (record `name→ZodTypeAny` base, mergeable) + `refineFields(fields,data,ctx,messages)` (required-when-visible + numeric min/max trong `.superRefine` của caller); `buildZodSchema` reimplement bằng 2 hàm này (chữ ký nguyên). Wizard build 1 schema phẳng: `z.object({...declarant, ...fieldShape(campaign)}).superRefine(refineFields(dynamicFields))` → 1 `useForm` + 1 resolver. Declarant zod tĩnh: `fullName` min1, `email` `.email()`, `phone` regex `^(0|\+84)\d{9,10}$`, `relationship` `z.enum`. Routes: `(public)/register/page.tsx` (RSC mỏng fetch tenantCode+schema → `<Suspense>` quanh `<RegisterWizard>` client vì dùng `useSearchParams`); step = `?step=applicant|form|verify-email|confirmation`; nav "Tiếp" `form.trigger(stepFields)` rồi `router.push(?step=)`, "Quay lại" `router.back()`. Step guard (#4): `useEffect` sau hydrate tính `furthest` từ data (applicant valid? form valid? code present?) → `router.replace` nếu vượt; validity check tay (không trigger error UI). Draft (#5): autosave debounce 500ms `form.watch`→localStorage `edugate:draft:register:<tenant>`, hydrate `form.reset` on mount + toast, clear khi submit. Verify-email: `sendEmailOtp` 1 lần on enter (sentRef) + nút resend, `devCode` qua toast; verify OK → `submit()` ở wizard (`createApplication` → `router.replace(?step=confirmation&code=)` + clear draft). Confirmation (#6) đọc `code` từ query (refresh-safe) + Link `/track/[code]`. `/track/[code]` (#2) CLIENT (`useParams` + `getApplicationByCode` trong `useEffect` vì store localStorage-only): loading skeleton → found `<StateBadge>`+`<StateTimeline>` (map `history` `note`→`reason`) → not-found empty. `/track` index = client form push. i18n: thêm `apply.applicant.relationships.*` + `relationshipPlaceholder` + `invalidEmail/Phone`, `apply.verifyEmail.{verify,sentToast,invalidOtp}`, `apply.confirmation.trackCta`, `form.{min,max}` ({min}/{max} interpolation). FormBuilder nhận `control` cast `as unknown as Control<FieldValues>` (inferred resolver type → FieldValues). `form.trigger(fields as never)` cho dynamic field names. typecheck/lint/build pass; SSR smoke /register (cva-edu) + /track + /track/[code] render OK, dev log clean. Interactive (fill→OTP→submit→store→back/forward guard→refresh confirmation) chưa headless-test — cần browser.
- 2026-05-20: Task 9 — Rationalize role: giữ `ApplicationRole` (transitions, +SYSTEM) tách khỏi auth `Role` (5 user role) thay vì hợp nhất — actor transition ≠ user role. Matrix flat (no inheritance) để 3 lớp FE/BE-guard/RLS diff thẳng cùng 1 file `abilities.ts`. Coarse check (subject là string) cố tình optimistic: bỏ scope + `when`, dùng cho menu/route gate; instance check mới đầy đủ. Module toggle gate theo resource được hỏi (`moduleOf`), áp cả SUPER_ADMIN; `platform` (tenant_config/tenant_user) là core không gate. `<Can>` đọc `props.this` qua property access (không destructure được reserved word). `AbilityContext` plain-serializable → truyền từ RSC layout xuống `<AbilityProvider>` client, `createAbility` chạy client-side.
