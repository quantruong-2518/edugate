# EduGate

Multi-tenant SaaS cho trường học, admission-first (pha 1 = tuyển sinh), mở rộng dần HRMS/Fee/LMS. Mô hình tham khảo: `tuyensinhlop6.cva-edu.com`.

> Tài liệu kiến trúc, convention và quy tắc làm việc — xem **[CLAUDE.md](./CLAUDE.md)**.
> Tiến độ task — xem **[docs/PLAN.md](./docs/PLAN.md)**.
> Quyết định kiến trúc (ADR) — xem **[docs/DECISIONS.md](./docs/DECISIONS.md)**.

## Quick start

```bash
nvm use
corepack enable
pnpm install
pnpm dev
```

## Stack

- **Monorepo**: Turborepo + pnpm
- **Frontend**: Next.js 15 + Tailwind v4 + shadcn/ui + TanStack Query
- **Backend** (pha 2): NestJS + Drizzle + Postgres (RLS) + Redis + BullMQ
- **Auth**: Better-Auth
- **Storage**: Cloudflare R2 / MinIO
- **Deploy**: Self-host VN (Coolify + Docker)
