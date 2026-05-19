# Architectural Decisions

> Mỗi entry ngắn: Context / Decision / Consequences. Đánh số tăng dần, không xóa.

## ADR-001: Monorepo Turborepo + pnpm

- **Context**: Cần chia FE/BE/shared types cho multi-tenant SaaS sẽ phình ra nhiều module.
- **Decision**: Turborepo + pnpm workspaces. Apps: `web` (Next.js), `api` (NestJS pha 2). Packages: `ui`, `shared`, `db`.
- **Consequences**: + Share types FE↔BE, build cache thông minh. − Setup phức tạp hơn single repo.

## ADR-002: Next.js 15 App Router + Tailwind v4 + shadcn/ui

- **Context**: Cần FE đa tenant configurable, SSR cho landing SEO, mobile-first.
- **Decision**: Next.js App Router (RSC native cho theme injection no-FOUC). Tailwind v4 CSS-first `@theme`. shadcn/ui copy-paste vào `packages/ui` (tái sử dụng nội bộ, vẫn own code).
- **Consequences**: + Theme tenant qua CSS variables không cần rebuild. − Tailwind v4 còn mới, một số plugin chưa support.

## ADR-003: NestJS + Drizzle (KHÔNG Prisma, KHÔNG TypeORM)

- **Context**: Multi-tenant + Postgres RLS. RLS yêu cầu `SET LOCAL app.tenant_id` bám đúng connection per request.
- **Decision**: NestJS làm BE (module-based map 1-1 với feature). Drizzle ORM SQL-first, dễ wrap transaction để set tenant context. Custom NestJS module ~50 dòng bind Drizzle.
- **Consequences**: + RLS sạch nhất, type-safe, cold start nhẹ. − Cộng đồng Drizzle nhỏ hơn Prisma, không có official `@nestjs/drizzle`. − TypeORM migration flaky, Prisma RLS gượng ép → loại.

## ADR-004: PostgreSQL self-host VN (KHÔNG Supabase prod)

- **Context**: Khách hàng VN (trường học, công lập) yêu cầu data residency VN (NĐ 13/2023/NĐ-CP). Supabase gần nhất là Singapore.
- **Decision**: Postgres self-host trên VPS VN (Hetzner SG hoặc BizFly VN) qua Coolify + Docker Compose + Caddy. Supabase Cloud chỉ dùng cho POC sandbox nếu cần.
- **Consequences**: + Đạt data residency, chi phí thấp hơn ở quy mô. − Phải tự setup backup (pgbackrest), monitoring, HA.

## ADR-005: Tenant resolution qua subdomain + path fallback

- **Context**: Cogi-framework dùng cả `truong.app.com` lẫn `app.com/t/:code/...`.
- **Decision**: Subdomain là canonical (branding đẹp). Path `/t/:code/...` làm fallback cho dev/staging chưa có wildcard SSL. Next.js middleware resolve cả 2, set header `x-tenant-code` cho RSC.
- **Consequences**: + Branding pro cho khách. − Cần wildcard SSL `*.app.com` (Let's Encrypt DNS challenge).

## ADR-006: Theming per tenant qua CSS variables (KHÔNG build-time config)

- **Context**: Mỗi trường brand khác nhau (logo, màu, font, slogan). N tenant không build N lần.
- **Decision**: Lưu tenant tokens dạng oklch trong DB. Inject `<style>:root { --tenant-primary: ... }</style>` trong RSC RootLayout. Tailwind `@theme` map `--color-primary` → `var(--tenant-primary, fallback)`.
- **Consequences**: + 1 build phục vụ vô hạn tenant. + Đổi theme không redeploy. − Không thể override component, chỉ tokens.

## ADR-007: Multi-conversation continuity qua `CLAUDE.md` + `docs/PLAN.md`

- **Context**: User muốn làm việc qua nhiều phiên Claude Code mà không mất context/step.
- **Decision**: CLAUDE.md (auto-load) chứa stack + convention + link. `docs/PLAN.md` là checklist `[ ]/[~]/[x]` source of truth. Mỗi task done = 1 commit + tick PLAN.md.
- **Consequences**: + Conversation mới chỉ cần "đọc PLAN.md, tiếp". + Reviewable qua git history. − Cần kỷ luật tick PLAN.md mỗi lần xong.
