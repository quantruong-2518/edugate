# Application State Machine — Hồ sơ tuyển sinh

> Source of truth cho states + transitions của `Application`. Cả FE và BE đọc cùng definition từ `packages/shared/admission/states.ts`.

## States

| Code | Label VI | Color | Mô tả |
|---|---|---|---|
| `DRAFT` | Nháp | gray | Phụ huynh đang điền, chưa nộp |
| `SUBMITTED` | Đã nộp | blue | Đã nộp, chờ phân công duyệt |
| `UNDER_REVIEW` | Đang duyệt | amber | Cán bộ đang xem xét |
| `NEEDS_INFO` | Cần bổ sung | orange | Yêu cầu phụ huynh bổ sung tài liệu |
| `APPROVED` | Đã duyệt | green | Trường chấp nhận, chờ PH xác nhận nhập học |
| `REJECTED` | Từ chối | red | Không đạt yêu cầu (terminal) |
| `CONFIRMED` | Đã xác nhận | emerald | PH xác nhận nhập học, chờ thủ tục |
| `ENROLLED` | Đã nhập học | violet | Đã hoàn tất nhập học (terminal) |
| `CANCELLED` | Đã hủy | slate | PH tự hủy (terminal) |
| `EXPIRED` | Hết hạn | slate | Quá deadline campaign (terminal, hệ thống set) |

## Transitions

```
                  ┌──── CANCELLED (PH hủy bất cứ lúc nào trước APPROVED)
                  │
DRAFT ──→ SUBMITTED ──→ UNDER_REVIEW ──→ NEEDS_INFO ──→ SUBMITTED
                  │           │
                  │           ├──→ APPROVED ──→ CONFIRMED ──→ ENROLLED
                  │           └──→ REJECTED
                  │
                  └──── EXPIRED (system, khi quá campaign deadline)
```

| From | To | Role được phép | Cần reason? |
|---|---|---|---|
| `DRAFT` | `SUBMITTED` | APPLICANT | no |
| `DRAFT` | `CANCELLED` | APPLICANT | no |
| `SUBMITTED` | `CANCELLED` | APPLICANT | optional |
| `SUBMITTED` | `UNDER_REVIEW` | REVIEWER, ADMISSION_ADMIN | no |
| `UNDER_REVIEW` | `APPROVED` | REVIEWER, ADMISSION_ADMIN | no |
| `UNDER_REVIEW` | `REJECTED` | REVIEWER, ADMISSION_ADMIN | **yes** |
| `UNDER_REVIEW` | `NEEDS_INFO` | REVIEWER, ADMISSION_ADMIN | **yes** |
| `NEEDS_INFO` | `SUBMITTED` | APPLICANT | no |
| `APPROVED` | `CONFIRMED` | APPLICANT | no |
| `CONFIRMED` | `ENROLLED` | ADMISSION_ADMIN | no |
| (any) | `EXPIRED` | SYSTEM (cron) | no |

## Component contract

- **`<StateBadge state />`** — hiện ở list, detail, my-applications. Icon + label + color.
- **`<StateTimeline history />`** — array `{ state, at, by, reason }`. Render dọc, highlight state hiện tại.
- **`<StateActions app role />`** — render nút action chỉ với transition hợp lệ + role có quyền. Nếu cần `reason` → mở dialog input.
- **`<StateFilter />`** — multi-select filter cho list view.

## Test cases tối thiểu

- PH chỉ thấy nút "Submit" khi state = DRAFT.
- PH thấy "Bổ sung" khi state = NEEDS_INFO.
- Reviewer KHÔNG submit được hồ sơ thay PH (UI ẩn + BE 403 + RLS).
- Cancelled/Rejected/Enrolled không show action nào.
- Transition không hợp lệ trả về error rõ ràng (BE → toast FE).
