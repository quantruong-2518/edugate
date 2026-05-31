---
name: adr
description: Append a short ADR to docs/DECISIONS.md in the Context/Decision/Consequences format with the next sequential number, never deleting old ones. Use when a significant architecture/stack/constraint decision is made, or the user asks "ghi ADR", "tạo ADR", "record decision", "quyết định kiến trúc", "chốt quyết định".
---

# adr

Ghi một **Architectural Decision Record** ngắn vào `docs/DECISIONS.md` đúng format repo (Continuity rule #3). ADR = quyết định lớn không suy ra được từ code: đổi stack, ràng buộc kiến trúc, supersede quyết định cũ.

## Khi nào ghi ADR (vs note PLAN thường)

| Ghi ADR | Chỉ cần note PLAN |
|---|---|
| Đổi/chốt stack, lib, infra | Chi tiết impl một task |
| Ràng buộc bất di bất dịch (multi-tenant, RLS, data residency) | Workaround cục bộ |
| Supersede/đảo một ADR cũ (vd ADR-013 bỏ login) | Đổi tên biến/file |
| Đánh đổi mà 6 tháng sau sẽ có người hỏi "sao lại thế?" | |

Không chắc → hỏi user 1 câu, đừng tự ý phình DECISIONS.md.

## Quy trình

1. Đọc `docs/DECISIONS.md`, tìm **số ADR lớn nhất** (`grep "## ADR-0"`) → số mới = max + 1, **zero-pad 3 chữ số** (hiện tại max là ADR-013 → kế tiếp ADR-014).
2. **Append vào cuối**, không sửa/xoá ADR cũ (chúng là lịch sử bất biến). Nếu ADR mới đảo ADR cũ → KHÔNG xoá cái cũ, mà:
   - ADR mới ghi dòng `**Status**: Supersede ADR-0xx` + lý do.
   - (Tùy chọn) thêm 1 dòng `> Superseded by ADR-0yy` vào ADR cũ — đánh dấu, không xoá nội dung.
3. Giữ **ngắn**: 3 mục, mỗi mục vài dòng. Consequences ghi cả `+` (lợi) lẫn `−` (hại/đánh đổi) — repo này luôn ghi cả hai.

## Format (bám đúng style hiện có)

```markdown
## ADR-0NN: <tiêu đề quyết định, ngắn gọn>

- **Context**: <vấn đề/áp lực dẫn tới quyết định — 1-2 câu>.
- **Decision**: <chốt làm gì, cụ thể>.
- **Consequences**: + <lợi>. − <hại/đánh đổi/việc phát sinh>.
```

Nếu supersede, thêm dòng `- **Status**: Supersede ADR-0xx (trong phạm vi …)` ngay dưới tiêu đề (xem ADR-013 làm mẫu).

## Ngôn ngữ

Theo repo: nội dung tiếng Việt được (communication VN), nhưng **tên kỹ thuật/định danh tiếng Anh** (`tenant_id`, `SET LOCAL`, tên lib). Khớp giọng các ADR sẵn có — terse, có chính kiến, nêu cả cái bị loại + lý do (vd "KHÔNG Prisma vì…").

## Sau khi ghi

- Báo: đã thêm ADR-0NN, tóm tắt 1 dòng.
- Nếu quyết định này ảnh hưởng task đang làm → nhắc cập nhật note ở `docs/PLAN.md` cho khớp.
- ADR thường commit kèm task liên quan (`docs(...)` hoặc trong commit feat) — để `/finish-task` hoặc `/commit` xử lý.
