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
- [ ] **2. Scaffold `apps/web` (Next.js 15 + App Router + Tailwind v4 + TS strict)**
  - Route groups: `(public)`, `(auth)`, `(admin)`.
  - ESLint + Prettier shared config.
- [ ] **3. Setup `packages/ui` với shadcn/ui base components**
  - 15 component: button, input, label, form, card, dialog, sheet, dropdown-menu, select, checkbox, radio-group, table, badge, separator, skeleton, sonner.
  - `cn()` helper, `components.json`, package exports.

### Theming (multi-tenant)
- [ ] **4. Tenant CSS tokens + `globals.css` với `@theme`**
  - oklch tokens cho primary/secondary/accent/bg/fg/muted/border/ring/radius/font.
  - Dark mode tokens.
- [ ] **5. Tenant resolver middleware**
  - `middleware.ts`: detect subdomain → tenant code; fallback `/t/:code/...`; set header `x-tenant-code`.
- [ ] **6. Tenant config fetcher + CSS injection trong RootLayout**
  - `getTenantBranding(code)` cached. Inject `<style>:root{...}</style>` từ RSC. Test 2 tenant mock.

### Shell & cross-cutting
- [ ] **7. AppShell mobile-first**
  - < 768px bottom nav + sheet drawer. ≥ 768px sidebar collapsible. Top bar: logo, tenant switcher, locale, user menu.
- [ ] **8. State machine + components**
  - `APPLICATION_STATES`, `TRANSITIONS` trong `packages/shared`.
  - `<StateBadge>`, `<StateTimeline>`, `<StateActions>`. Xem `docs/STATE_MACHINE.md`.
- [ ] **9. Permission matrix + ability layer**
  - Matrix role × action × resource × scope (`own`/`tenant`/`*`) trong `packages/shared`.
  - `useAbility()` hook, `<Can>` gate, `<RequirePermission>` route gate. Xem `docs/PERMISSIONS.md`.
- [ ] **10. FormBuilder JSON schema → React Hook Form + Zod**
  - Support text/number/date/select/file/scoring/section. Conditional show/hide cơ bản.
- [ ] **14. i18n next-intl** (VI default, EN slot, locale switcher)
- [ ] **15. TanStack Query + axios client + OpenAPI codegen placeholder**
- [ ] **16. Empty / loading / error state patterns** (`<EmptyState>`, skeleton, `<ErrorBoundary>`, 404, 403)

### Feature pages
- [ ] **11. Landing page edu + section system configurable**
  - Hero, stats, 5-step process, info tabs, about, testimonials, FAQ, footer.
  - Section drag-orderable, mỗi section có schema content riêng.
- [ ] **12. Admission apply flow 5 bước**
  - `nguoi-khai → ho-so → xac-minh-email → ma-ho-so → theo-doi`.
  - Multi-step, draft auto-save localStorage. Trang theo dõi dùng `<StateTimeline>`.
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
