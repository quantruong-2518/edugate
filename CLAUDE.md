# Project: Multi-tenant Education SaaS

Multi-tenant SaaS bán cho các trường (mỗi trường = 1 tenant, isolated by `tenant_id` + Postgres RLS). Mô hình tham khảo: `tuyensinhlop6.cva-edu.com` (cogi-framework). Pha 1 chỉ ship module **Admission (tuyển sinh)**; các module HRMS/Fee/LMS/Survey/CRM/POS/Content thêm dần theo nhu cầu khách.

## Continuity rules (đọc trước khi làm bất cứ gì)

1. **Source of truth cho việc đang làm là `docs/PLAN.md`**. Mỗi task có `[ ]` (chưa), `[~]` (đang), `[x]` (xong). Khi xong 1 task: tick `[x]`, ghi 1 dòng note nếu có quyết định mới phát sinh.
2. Conversation mới mở: đọc CLAUDE.md → đọc `docs/PLAN.md` → tìm task `[~]` đang dang dở; nếu không có, chọn task `[ ]` đầu tiên mà dependencies đã `[x]`.
3. Quyết định kiến trúc lớn → ghi vào `docs/DECISIONS.md` dạng ADR ngắn (Context / Decision / Consequences).
4. Mỗi task done = 1 commit. Commit message: `feat(scope): subject` hoặc `chore(scope): subject`.
5. KHÔNG sửa CLAUDE.md để track progress — đó là việc của PLAN.md.

## Stack (đã chốt — đổi phải qua DECISIONS.md)

- **Monorepo**: Turborepo + pnpm workspaces. Node 20.
- **Frontend**: Next.js 15 App Router + TypeScript strict + Tailwind v4 (CSS-first `@theme`) + shadcn/ui (đặt ở `packages/ui`) + TanStack Query + React Hook Form + Zod + next-intl.
- **Backend** (pha 2): NestJS + Drizzle ORM + PostgreSQL + Row-Level Security.
- **Auth**: Better-Auth (hoặc custom JWT nếu cần case-insensitive email per tenant). Nhiều tenant per user qua bảng `tenant_users`.
- **Infra**: Redis (BullMQ queue), Cloudflare R2 / MinIO storage, Resend (email).
- **Deploy**: Self-host VPS VN qua Coolify + Docker Compose + Caddy. **Yêu cầu data residency Vietnam.**
- **Không dùng**: Prisma (RLS gượng ép), TypeORM (migration flaky), Supabase Auth (không có concept tenant first-class).

## Kiến trúc multi-tenant — nguyên tắc bất di bất dịch

1. **Mọi bảng business có cột `tenant_id` NOT NULL + index**.
2. **Postgres RLS là lưới an toàn cuối cùng**. App quên `WHERE tenant_id = ?` vẫn không lộ data.
3. **NestJS interceptor `SET LOCAL app.tenant_id` đầu mỗi request transaction**.
4. **FE permission gate là UX**, không phải security. BE guard + RLS là security thật.
5. **Theming per tenant qua CSS variables** (`@theme` + `<style>` inject ở RSC), KHÔNG qua build-time config.
6. **Form/landing/email template configurable qua JSON schema** trong DB, không cần redeploy khi trường đổi.
7. User có thể thuộc nhiều tenant — JWT embed `tenant_id` đang active; `/choose-tenant` để switch.

## Monorepo layout

```
.
├── apps/
│   ├── web/         Next.js 15 (FE + BFF)
│   └── api/         NestJS (pha 2)
├── packages/
│   ├── ui/          shadcn/ui base components + AppShell + FormBuilder
│   ├── shared/      Types, Zod schemas, state machine, permission matrix, ability
│   └── db/          Drizzle schema + migrations (pha 2)
├── docs/
│   ├── PLAN.md            Task checklist — SOURCE OF TRUTH cho việc đang làm
│   ├── DECISIONS.md       ADR ngắn cho quyết định lớn
│   ├── STATE_MACHINE.md   Hồ sơ tuyển sinh states + transitions
│   └── PERMISSIONS.md     Role × Action × Resource matrix
├── tools/                 scripts
├── turbo.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## Conventions

- TypeScript strict, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`.
- Ngôn ngữ: code/comment tiếng Anh, copywriting UI tiếng Việt (mặc định locale `vi`).
- File naming: `kebab-case.tsx` cho component, `PascalCase` cho export type/component.
- Import alias: `@/...` trong `apps/web`, `@ui/...`, `@shared/...` cho cross-package.
- KHÔNG hardcode chuỗi UI — luôn qua `next-intl` `t('key')`.
- KHÔNG hardcode màu — luôn dùng token `bg-primary`, `text-foreground`...
- Component đặt ở `apps/web/components/` nếu chỉ web dùng; lên `packages/ui/` nếu tái sử dụng.
- Form luôn dùng React Hook Form + Zod resolver, không tự handle state.

## Commands (sau khi `pnpm install`)

```bash
pnpm dev              # chạy mọi app dev mode (Turbo)
pnpm build            # build tất cả
pnpm typecheck        # type check toàn repo
pnpm lint             # lint toàn repo
pnpm --filter web dev # chỉ chạy web
```

## Tham khảo trang nguồn

- `tuyensinhlop6.cva-edu.com` — cogi-framework, đa tenant, đa module (admission, hrms, fee, lms, survey, crm, pos, content, platform). Path pattern: `/t/:tenantCode/...` hoặc subdomain. Đây là **inspiration**, không phải target sao chép 1-1.
