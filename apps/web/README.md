# web

Next.js 15 App Router app cho frontend đa tenant.

## Dev

```bash
pnpm --filter web dev
```

Mặc định chạy tại http://localhost:3000.

## Layout

```
app/
├── layout.tsx          # Root layout (html/body, globals.css)
├── not-found.tsx       # 404
├── (public)/           # Landing, marketing
├── (auth)/             # login, forgot, reset, set-password, activate
└── (admin)/            # /admin và sub-routes
```

Theming, AppShell, FormBuilder, state machine, permission v.v. được thêm theo `docs/PLAN.md`.
