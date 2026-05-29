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

## ADR-008: i18n qua next-intl, dựng runtime sớm (trước feature pages)

- **Context**: CLAUDE.md cấm hardcode chuỗi UI (luôn qua `t()`). Feature pages 10-12 cần chuỗi VI nhưng task 14 (i18n) xếp sau → nếu hardcode rồi retrofit sẽ tốn công và rủi ro sót.
- **Decision**: Dựng next-intl runtime ngay (P1) — locale cố định `vi`, **không** locale-routing (không prefix `/vi`, `/en`) để middleware tenant resolver (subdomain + `/t/:code`) giữ nguyên không xung đột. Messages VI thật, EN để slot rỗng. Routes + identifier tiếng Anh, chỉ message content tiếng Việt. Locale switcher + EN messages thật để lại task 14.
- **Consequences**: + Không hardcode, không retrofit chuỗi. + Middleware tenant nguyên vẹn. + Đổi sang multi-locale sau chỉ là thêm messages + switcher. − Task 14 bị tách đôi (runtime sớm / switcher + EN sau).

## ADR-009: PDF export qua print-CSS + dedicated route (KHÔNG @react-pdf, KHÔNG client PDF lib)

- **Context**: Task 18 cần xuất hồ sơ + biên lai PDF, "template trước, hook BE pha 2". Document phải mang brand từng tenant và trông giống web. Yêu cầu data residency VN (self-host).
- **Decision**: Template = React + Tailwind thường, render ở route riêng `(public)/track/[code]/print` (`?doc=profile|receipt`). Pha 1: download = `window.print()` (browser → Save as PDF). Pha 2: NestJS worker dùng Puppeteer navigate headless đúng route này → PDF lưu/đính email — template là single source of truth, không viết lại. Màu paper hardcode neutral (white bg + neutral ink) như precedent state-tone (task 8) vì document phải in được bất kể theme light/dark; brand accent vẫn qua token `text-primary`. Zero dep mới (kể cả QR — để pha 2 BE sinh).
- **Consequences**: + Reuse token + branding + `StateBadge`/`StateTimeline`, không hệ style thứ 2. + Seam BE sạch (chỉ là 1 URL). + Pha 1 không thêm bundle. − Pha 1 qua print dialog browser (chưa file thật/silent download). − Pha 2 cần chromium trên BE (chấp nhận với self-host). − Export từ admin (cần applications list) để pha 2.

## ADR-010: Better-Auth xác nhận làm auth provider (Pha 2)

- **Context**: Pha 2 backend cần auth provider. CLAUDE.md đã chốt Better-Auth nhưng có open question (AQ1 trong ARCHITECTURE.md): case-insensitive email per-tenant có gượng ép không? Cần chốt lại trước khi build user/session schema.
- **Decision**: Giữ Better-Auth. Email staff users **global-unique** (ADR-011 đi cùng) — Better-Auth dùng default email-unique adapter, không cần custom. Multi-tenant qua bảng `tenant_users(tenant_id, user_id, roles[])`. JWT carry `userId` + `activeTenantId` claim; switch tenant qua `POST /v1/me/switch-tenant` verify `tenant_users` membership + mint JWT mới. Refresh token rotation + reuse detection bật mặc định. Sessions HTTP-only Secure cookie SameSite=Lax.
- **Consequences**: + Ship nhanh, ít code custom. + Refresh rotation + breach detection có sẵn. + Adapter Drizzle hỗ trợ Postgres native. − Nếu sau pilot 1 trường phản ánh muốn 2 staff khác trường dùng chung email → revisit, switch sang custom JWT + per-tenant email (ADR mới). − Reset/activate/set-password 3 flow tự build trên Better-Auth token API (không out-of-the-box).

## ADR-011: Email staff global-unique trên platform (KHÔNG per-tenant unique)

- **Context**: User model multi-tenant 2 lựa chọn: (a) email unique global, multi-tenant qua `tenant_users`; (b) email unique per-tenant, cùng `a@school.vn` tồn tại như 2 user ở 2 tenant. AQ1 trong ARCHITECTURE.md + Q1 trong DATA_MODEL.md.
- **Decision**: Global unique. `users.email CITEXT UNIQUE WHERE deleted_at IS NULL`. Một người có thể staff nhiều trường qua nhiều dòng `tenant_users` cùng `user_id`. Login form không cần biết tenant trước — sau khi verify password, nếu user có > 1 tenant thì redirect `/choose-tenant`.
- **Consequences**: + Đơn giản, khớp Better-Auth default (ADR-010). + Một người làm 2 trường login 1 lần xem được cả 2 (giá trị thật cho consultant/cross-school staff). + Schema sạch — không cần composite unique `(tenant_id, email)`. − Mất khả năng "cùng email 2 user khác nhau" — chấp nhận vì kịch bản này YAGNI cho pilot. − Pha 2 phát hiện friction thật → migration `users` thêm `tenant_id` + chuyển constraint là việc lớn nhưng có path rõ ràng.

## ADR-012: Custom domain per tenant (domain riêng → platform, on-demand TLS)

- **Context**: ADR-005 chốt subdomain canonical + `/t/:code` fallback. Trường mua domain riêng (vd `a-tuyen-sinh.vn`) muốn dùng làm mặt tiền tuyển sinh thay vì `a.edugate.vn`. Apex domain **không suy ra được** mã tenant từ chuỗi host — mapping là data, không parse được.
- **Decision**: Thêm 1 tầng vào resolver — thứ tự: (1) subdomain → (2) **custom domain map** → (3) path `/t/:code`. Custom domain resolve như subdomain (set header `x-tenant-code`, **không rewrite path** — bộ màn dùng chung, chỉ host khác). Map `domain → code`: pha 1 fixture tĩnh (`apps/web/lib/tenants/custom-domains.ts`, tách khỏi `fixtures.ts` để edge middleware chỉ nạp map nhỏ); pha 2 bảng `tenant_domains(domain, tenant_id, verified)` + cache mạnh (KV/edge, **KHÔNG query DB mỗi request**), chỉ row `verified=true` mới resolve. Verify sở hữu domain qua TXT record / `/.well-known` trước khi bật `verified`. TLS qua **Caddy on-demand TLS** (tự xin Let's Encrypt khi domain trong allowlist verified). Khi tenant đã set custom domain → subdomain `a.edugate.vn` **301 →** custom domain (tránh duplicate content / SEO).
- **Consequences**: + Trường có mặt tiền thương hiệu riêng (white-label). + Cô lập cookie tốt hơn cả subdomain (origin riêng hẳn). + Seam pha 1→2 sạch: chỉ swap map fixture → cached DB lookup, `parseTenantFromCustomDomain` (pure, `@shared/tenant`) giữ nguyên chữ ký. − Cần `tenant_domains` table + domain verification flow + Caddy on-demand TLS config (pha 2 — P2.11). − Apex không CNAME được → cần A/ALIAS record hoặc www-CNAME + redirect. − **On-demand TLS phải có allowlist** (chỉ domain verified) chống kẻ trỏ domain bừa vào platform ép xin cert (DoS cert issuance).
