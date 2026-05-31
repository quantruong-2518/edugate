---
name: resume
description: Bootstrap a fresh conversation in the EduGate repo — read docs/HANDOFF.md (re-verifying its anchors against live git), then CLAUDE.md + docs/PLAN.md, and report exactly where to pick up. Use at the start of a session or when the user asks "đang làm gì", "tiếp tục", "resume", "tiếp việc dở", "ta đang ở đâu". Pairs with /handoff. Read-only; does NOT write code.
---

# resume

Định hướng đầu conversation theo **Continuity rule #2** (CLAUDE.md). Mục tiêu: 1 lượt biết chính xác *đang ở task nào*, *dở chỗ nào*, *ràng buộc gì* — KHÔNG code, KHÔNG sửa file. Cặp đôi của `/handoff`.

## Quy trình

### 1. Đọc handoff TRƯỚC (nếu có) — nhưng VERIFY, đừng tin mù

`docs/HANDOFF.md` là state đang-dở của conversation trước. Nó là **gợi ý, không phải sự thật** — phải kiểm trước khi dùng:

1. Đọc `docs/HANDOFF.md`. Lấy `HEAD` SHA nó ghi ở "Ground truth".
2. Chạy `git rev-parse --short HEAD` + `git status --short`. **So với handoff:**
   - **SHA khớp + dirty files khớp** → handoff còn tươi, tin được (vẫn ưu tiên ✅ hơn 🤔).
   - **SHA đã tiến / dirty khác** → repo đã đổi sau khi handoff ghi. **Cảnh báo user**, coi handoff là tham khảo, lấy sự thật từ git + PLAN.
   - **Không có HANDOFF.md** → bỏ qua bước này, đi tiếp.
3. Chạy "Verify-first checklist" trong handoff nếu có (vd `pnpm typecheck`) để xác nhận trạng thái thực.

### 2. Xác định task từ PLAN — ĐỌC PHẪU THUẬT, không nuốt cả file

`PLAN.md` dài (hàng trăm dòng, hàng chục task xong). **KHÔNG `Read` cả file** — phí context vào 26 task `[x]` không liên quan. Làm theo đúng thứ tự rẻ→đắt:

1. `grep -nE "^\- \[[ ~]\]" docs/PLAN.md` → ra danh sách dòng status còn `[~]`/`[ ]` (rẻ, vài dòng).
2. Chọn task: **`[~]` trước**; không có → task **`[ ]` đầu tiên** mà mọi dependency đã `[x]` (deps suy từ thứ tự + ghi chú như "làm trước 10-12", "cần `@shared/form`").
3. **Chỉ `Read` đúng section của task đó** (dùng offset/limit quanh dòng grep ra), không đọc task khác.
4. ADR ràng buộc: `grep "## ADR-" docs/DECISIONS.md` lấy danh sách tiêu đề → chỉ đọc ADR nào *liên quan domain task*, không nuốt cả 13 ADR.

`CLAUDE.md` đã auto-load qua system prompt — không cần Read lại.

### 3. Report (định dạng cố định)

```
📍 Task: <số + tên từ PLAN> · trạng thái [~]/[ ] · Pha <…>
Handoff: <tươi ✅ | drift ⚠️ repo đã tiến | không có>

Tóm tắt cần làm: <1-2 câu>
Đang dở: <từ handoff đã verify + git status>
Đã thử & loại: <từ handoff — tránh làm lại>
Ràng buộc: <ADR liên quan>
File trọng tâm: <path:line>

▶ Bước kế: <literal — copy từ handoff nếu còn đúng>
   → /plan-task nếu cần review lại trước khi code.
```

## Nguyên tắc

- **Read-only.** Không Edit/Write, không build (trừ lệnh verify trong checklist). Chỉ đọc + report.
- **Đọc phẫu thuật.** grep ra con trỏ rồi mới đọc đúng lát — không bao giờ `Read` trọn `PLAN.md`/`DECISIONS.md`. Mục tiêu: nạp đúng thứ cần cho task hiện tại, giữ context sạch để conversation không nhiễu/bịa.
- **Git là trọng tài.** Khi handoff ↔ git mâu thuẫn, tin git + PLAN, không tin văn xuôi handoff.
- Working tree có thay đổi không khớp task/handoff nào → **nêu ra**, có thể là việc cần dọn.
- Mọi `[ ]` còn vướng deps → nói rõ deps nào chặn.
- **Dừng sau report.** Để user quyết gọi `/plan-task` hay code tiếp.
