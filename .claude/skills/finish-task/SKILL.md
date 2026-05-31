---
name: finish-task
description: Close a COMPLETED PLAN.md task — run the verification gate (typecheck/lint/build), tick the task [x] with a note, then hand off to the commit skill. Use when a task is done, "xong task", "đóng task", "hoàn thành", "finish task", "task done", "chốt task". For mid-task pauses use /handoff instead.
---

# finish-task

Đóng một task **đã làm xong** đúng nghi thức repo: verify gate → tick `[x]` PLAN.md → commit. Mã hoá Continuity rule #1 + #4 (mỗi task done = 1 commit).

> Chỉ dùng khi task **xong hẳn**. Còn dở → `/handoff`.

## Quy trình

### 1. Verify gate (BẮT BUỘC — pass hết mới đi tiếp)

Mọi task trong PLAN đều kết bằng gate này. Chạy ở root:

```bash
pnpm typecheck && pnpm lint && pnpm build
```

- **Fail** → DỪNG. Sửa gốc → chạy lại. Không tick, không commit khi còn đỏ.
- Đây là gate **tĩnh**. "SSR/dev smoke test" mà nhiều task nhắc cần server + browser (nặng) → **chỉ nhắc user tự chạy**, skill không tự làm. Nêu rõ trong report là smoke test chưa chạy.

### 2. Tick PLAN.md

- Đổi `[~]`/`[ ]` của task → `[x]`.
- Nếu task phát sinh **quyết định mới / lệch so với mô tả gốc** → thêm 1 dòng note ngắn dưới task (Continuity rule #1). Note = WHY/điều bất ngờ, không kể lể diff.
- Nếu quyết định đủ lớn (đổi kiến trúc/stack/ràng buộc) → gợi ý chạy `/adr` (đừng tự ghi ADR ở đây).

### 3. Reset working state — clear HANDOFF

Task xong → `docs/HANDOFF.md` mô tả state đang-dở giờ **vô nghĩa và gây nhiễu** (conversation sau resume sẽ tưởng còn việc dở). Xoá sạch:
- Nếu `docs/HANDOFF.md` tồn tại và ứng với task vừa đóng → **xoá file** (hoặc ghi đè 1 dòng `> Sạch — task <số> đã đóng <ngày>. Chạy /resume để lấy task kế tiếp từ PLAN.`).
- Đây là phần "reset 3 file nền sau mỗi task": HANDOFF reset, PLAN tick `[x]`, DECISIONS giữ nguyên (sổ bất biến). Task mới bắt đầu với HANDOFF trống → context sạch.

### 4. Hand off sang commit

Gọi skill **`commit`** (không tự viết lại logic commit). Commit sẽ phân nhóm + trình message chờ user OK.
- Task này thường = **1 commit** `feat(scope): …`/`chore(scope): …`. Nhớ stage cả thay đổi PLAN.md vào commit đó (việc tick PLAN thuộc cùng trách nhiệm với task).
- Nếu working tree lẫn thay đổi không thuộc task → commit skill lo việc tách; nói rõ cho nó nhóm nào thuộc task này.

### 5. Báo cáo

```
✅ Task <số + tên> đóng.
Verify: typecheck ✓ lint ✓ build ✓   (smoke test: chưa chạy — cần browser)
PLAN.md: [x] + note <nếu có>
HANDOFF: clear ✓
Commit: <đã gọi /commit — chờ duyệt message>
ADR: <không cần | gợi ý /adr cho quyết định …>
```

## Nguyên tắc

- **Không tick/commit khi gate đỏ.** Source of truth phải luôn phản ánh code chạy được.
- **Không `--amend`/`--no-verify`** (đã là luật của skill `commit`).
- Một task chạm nhiều package ngang nhau → tín hiệu cần **tách commit**; để `commit` xử lý, nhưng cân nhắc liệu "task" này có nên là nhiều task PLAN không.
