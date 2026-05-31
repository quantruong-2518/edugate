---
name: build-ui
description: Build or modify UI in the EduGate web app consistently — reuse existing primitives, place files correctly (web vs ui, RSC vs client), pass the i18n/token/a11y checklist, and apply anti-slop taste rules on public/landing/marketing surfaces. Use when adding/editing a component, page, screen, or "làm giao diện", "thêm component", "thêm page", "dựng UI", "tạo màn hình", "code giao diện". Encodes the reuse map + decision tree + taste rules, not the base rules (those are in CLAUDE.md, already loaded).
---

# build-ui

Dựng giao diện **nhất quán** với repo. Skill này KHÔNG lặp lại luật trong `CLAUDE.md` (đã auto-load) — nó cho 3 thứ CLAUDE.md không có: **bản đồ tái sử dụng**, **cây đặt-ở-đâu**, **checklist chỗ-hay-quên**.

## Bước 0 — REUSE TRƯỚC, đừng build lại

Trước khi viết component mới, kiểm có sẵn chưa. Import per-subpath (`@ui/components/<x>`):

| Cần gì | Dùng cái có sẵn |
|---|---|
| Trạng thái trống | `@ui/components/empty-state` → `<EmptyState>` |
| Lỗi + retry | `@ui/components/error-state` → `<ErrorState>` |
| Loading | `@ui/components/skeleton` → `<Skeleton>` |
| Trạng thái hồ sơ | `@ui/components/admission` → `StateBadge` / `StateTimeline` / `StateActions` |
| Form động (JSON schema) | `@ui/components/form-builder` → `<FormBuilder schema control />` |
| Form tĩnh | `@ui/components/form` (RHF wrapper) + primitives `input/select/checkbox/radio-group/textarea` |
| Wizard nhiều bước | `@ui/components/stepper` → `<Stepper>` |
| Shell / nav | `@ui/components/app-shell` (sidebar/top-bar/bottom-nav/nav-link) |
| Tab / accordion / dialog / sheet / table / badge / card | primitive cùng tên trong `@ui/components/` |
| Gate quyền (admin) | `@/components/auth` → `<Can>` / `<RequirePermission>` |
| Đổi locale | `@/components/i18n/locale-switcher` |
| Toast | `sonner` → `toast()` (Toaster đã mount ở root layout) |

Surface đã dựng sẵn để tham khảo pattern: `@/components/{admin,auth,landing,marketing,print,public}`. Cần gì giống → đọc cái đó trước, đừng phát minh lại.

## Bước 1 — Đặt ở đâu + RSC hay client

**File ở đâu:**
- Chỉ 1 route dùng → `app/(group)/.../_components/` (colocate, vd `(admin)/admin/applications/_components/`).
- 1 surface của web dùng chung → `apps/web/components/<surface>/`.
- Tái dùng cross-surface / có thể lên product khác → `packages/ui/src/components/` (thêm vào `index.ts` barrel).

**RSC mặc định.** Chỉ thêm `"use client"` khi thật cần: dùng hook (`useState/useEffect/useForm/useQuery/useTranslations`), event handler, browser API, hoặc consume context. Giữ client boundary **mỏng** — tách phần tương tác ra client, phần tĩnh để RSC fetch.

**i18n theo môi trường:** RSC → `getTranslations(ns)`; client → `useTranslations(ns)`.

## Bước 2 — Dựng theo pattern

- Form: **RHF + `zodResolver`**, không tự quản state. Dynamic field → `FormBuilder` (xem `apps/web` task 10/12 đã làm).
- Data: gọi **hook** trong `lib/api/queries.ts` (vd `useApplication`), KHÔNG fetch thẳng trong component. Cần endpoint mới → đó là việc data seam (thuộc `lib/api/`), không phải build-ui.
- Màu/spacing: token Tailwind (`bg-primary`, `text-foreground`, `border-border`...). Màu semantic (state/audit) đã hardcode palette trong `state-tone.ts` — tái dùng, đừng tự chế.

## Bước 2.5 — Taste (CHỈ public / landing / marketing — admin MIỄN)

Admin = neutral, function > flair (ADR-013) → **bỏ qua section này**. Public/landing/marketing là mặt tiền bán hàng → áp luật chống-generic (rút từ Taste Skill, đã map vào hệ token repo — *nguyên tắc, không cài lib*):

**Khoá nhất quán (dùng token sẵn có, đừng chế):**
- 1 accent / trang → `--primary` (token tenant). Không thêm màu nhấn lạ.
- 1 hệ bo góc / trang → `--radius`. Không trộn nhiều radius.
- 1 theme / trang (light *hoặc* dark), không đổi giữa trang.

**Hero (above-fold):** headline ≤ 2 dòng desktop · subtext ≤ 20 từ / 4 dòng · CTA chính thấy được không cần scroll · nav 1 hàng, cao ≤ 80px.

**Ban list chống-slop:**
- ❌ 3 card đều nhau cho feature row (mặc định) → layout có nhịp (span lệch).
- ❌ Gradient mesh/blob kiểu "AI-purple" — brand EduGate là indigo, vẫn tránh blob tím loè.
- ❌ Status dot trang trí — chỉ cho state ngữ nghĩa thật (đã có `state-tone`), tối đa 1/section.
- ❌ Fake UI (terminal/dashboard giả) · ❌ pill đè ảnh (caption đặt dưới) · ❌ eyebrow đánh số "01 · …" · ❌ scroll cue / strip chữ trang trí ở hero · ❌ version label (BETA, INVITE-ONLY) trừ brief launch.
- ❌ `border-t`+`border-b` mọi row trong list → dùng `card`/`tabs`/`accordion` (repo có sẵn).

**Motion:** KHÔNG `window.addEventListener('scroll')`. Dùng `IntersectionObserver` / CSS scroll-driven — repo đã có `Reveal`/`RevealStaticContext`, tái dùng đừng viết lại.

**Dark mode:** off-black/off-white (token oklch đã vậy), không pure `#000`/`#fff`; giữ WCAG AA + hierarchy ở cả 2 theme.

> Khi taste ↔ ràng buộc cứng repo xung đột (token, reuse, neutral admin, i18n) → **ràng buộc cứng thắng**. Taste cho hướng, không phá hệ.

## Bước 3 — Checklist TRƯỚC KHI XONG (cái hay quên)

- [ ] Mọi chuỗi qua `t()` — **0 hardcode**. Key mới thêm vào **CẢ** `messages/vi.json` **VÀ** `messages/en.json` (mirror đúng cấu trúc namespace).
- [ ] Màu = token. **Không** hex, không `text-neutral-*`/`bg-gray-*` rời.
- [ ] Font: `font-sans` (Inter); `font-display` chỉ cho tên nổi bật; **không** `font-mono`.
- [ ] Public = **mobile-first**. Admin = **neutral palette + desktop-first** (không brand color, dùng `.admin-neutral`).
- [ ] a11y: `aria-current` cho nav active, `<label>`/`aria-label` cho input, `alt` cho ảnh.
- [ ] Empty/error/loading → tái dùng `EmptyState`/`ErrorState`/`Skeleton`, không tự vẽ.
- [ ] Admin action → gate `<Can>`/`<RequirePermission>` (FE gate = UX, không phải security — nhưng vẫn phải có).
- [ ] Import alias đúng: `@/...` (web), `@ui/components/...`, `@shared/...`. Per-subpath, không import từ barrel gốc nặng.
- [ ] File `kebab-case.tsx`; export type/component `PascalCase`.
- [ ] **(public/landing/marketing)** Taste pass: 1 accent + 1 radius + hero discipline; không dính ban list chống-slop (Bước 2.5). Admin miễn.

## Kết

Code xong → gợi ý `/finish-task` (verify gate + tick PLAN + commit). Đừng tự commit ở đây.
