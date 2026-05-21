# Permission Matrix

> Source of truth: `packages/shared/auth/abilities.ts`. FE `<Can>` gate, BE `@RequirePermission()` guard, Postgres RLS đều đọc/đối chiếu cùng matrix này.

## Model

```
Permission = `${Action}:${Resource}` | `${Action}:${Resource}:${Scope}`

Action   = create | read | update | delete | approve | reject | export | confirm
Resource = application | campaign | review | form_template | notification_template
         | employee | department | position
         | fee_item | fee_sheet | payment
         | learner | class
         | service_item | service_order
         | tenant_config | tenant_user | audit_log
         | article | journal | slider
         | survey | survey_response
         | request
Scope    = own       (chỉ resource user sở hữu)
         | tenant    (mọi resource trong tenant của user — default)
         | *         (cross-tenant, chỉ SUPER_ADMIN)
```

## Roles (pha 1)

- `APPLICANT` — phụ huynh / người khai
- `REVIEWER` — cán bộ duyệt hồ sơ
- `ADMISSION_ADMIN` — quản trị tuyển sinh
- `TENANT_ADMIN` — quản trị trường
- `SUPER_ADMIN` — platform admin (cross-tenant)

Pha 2+: `HR_MANAGER`, `FINANCE`, `TEACHER`, `LEARNER`, `EDITOR`, `SALES`.

## Matrix (pha 1)

| | application | campaign | review | form_template | tenant_config | tenant_user |
|---|---|---|---|---|---|---|
| **APPLICANT** | create:own, read:own, update:own (state ∈ {DRAFT, NEEDS_INFO}), confirm:own | read:tenant | — | — | — | — |
| **REVIEWER** | read:tenant, approve:tenant, reject:tenant, update:tenant (state=UNDER_REVIEW) | read:tenant | create:tenant, read:tenant, update:tenant | read:tenant | — | — |
| **ADMISSION_ADMIN** | CRUD:tenant, approve, reject, confirm, export | CRUD:tenant | CRUD:tenant | CRUD:tenant | read:tenant | read:tenant |
| **TENANT_ADMIN** | CRUD:tenant, export | CRUD:tenant | CRUD:tenant | CRUD:tenant | RU:tenant | CRUD:tenant |
| **SUPER_ADMIN** | * | * | * | * | * | * |

`audit_log` (module `platform`, core — không gate theo gói): `read:tenant` cho **TENANT_ADMIN**; `*` cho **SUPER_ADMIN**. Các role khác không xem được nhật ký. `export:audit_log` (xuất CSV) để pha 2.

## FE usage patterns

```tsx
// Hook
const { can } = useAbility();
if (can('approve', application)) { /* ... */ }

// Component gate (ẩn action nếu không có quyền)
<Can I="approve" this={application}>
  <Button onClick={approve}>Duyệt</Button>
</Can>

// Route gate (redirect 403 nếu không có quyền)
<RequirePermission action="read" resource="campaign">
  <CampaignList />
</RequirePermission>

// Menu builder
const menuItems = ALL_MENU_ITEMS.filter(item =>
  can(item.action, item.resource)
);
```

## Defense in depth

1. **FE `<Can>`** — UX, ẩn nút.
2. **BE `@RequirePermission()` guard** — security, trả 403.
3. **Postgres RLS policy** — lưới cuối, không trả row.

3 lớp này phải đồng bộ vì đều đọc abilities map. Khi bổ sung permission mới: update abilities → regen FE matrix → add BE guard → add/sửa RLS policy. Không skip lớp nào.

## Per-tenant module toggle

Tenant không mua module HRMS → bảng `tenant_modules` không có `hrms` → mọi permission `*:employee/*` của tenant đó bị strip khi check. Ability function:

```ts
can(action, resource, ctx) {
  if (!tenant.modules.includes(moduleOf(resource))) return false;
  // ... role check
}
```

## Edge cases cần test

- User có role REVIEWER ở tenant A nhưng KHÔNG có role ở tenant B → switch sang B mất quyền.
- APPLICANT cố sửa hồ sơ state APPROVED → `update:own` chỉ pass nếu state ∈ {DRAFT, NEEDS_INFO} → BE từ chối.
- SUPER_ADMIN xem cross-tenant phải đi qua `/platform/*` route, log audit.
- Tenant tắt module admission → APPLICANT vẫn login được nhưng không có route nào hợp lệ → redirect landing chung.
