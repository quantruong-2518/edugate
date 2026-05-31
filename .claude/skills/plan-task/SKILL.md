---
name: plan-task
description: Critically review the next PLAN.md task BEFORE any code is written — surface gaps, risks, ADR conflicts and decisions, then present an implementation plan and wait for approval. Use when the user wants to plan a task, "lên kế hoạch", "review task trước khi làm", "plan task", or right after /resume identifies a task. Enters plan mode; does NOT edit files until approved.
---

# plan-task

Mã hoá **task rhythm** của user: *review plan của task kế tiếp một cách phản biện, chỉ build sau khi user duyệt*. Skill này KHÔNG code — nó nghĩ, phản biện, trình plan, chờ OK.

## Quy trình

1. Xác định task (từ `/resume`, hoặc `grep -nE "^\- \[[ ~]\]" docs/PLAN.md` tìm `[~]`/`[ ]` kế tiếp).
2. **Đọc phẫu thuật** (không nuốt cả file — PLAN/DECISIONS rất dài):
   - Chỉ `Read` **section của task đó** trong PLAN (offset/limit quanh dòng grep ra).
   - `grep "## ADR-" docs/DECISIONS.md` → chỉ đọc ADR *liên quan domain task*.
   - Đọc **code/file task sẽ đụng** (đọc thật, đừng đoán) — đây là phần đáng nạp context, không phải lịch sử task cũ.
3. **Review phản biện** — không chép lại mô tả PLAN, mà soi:

   | Câu hỏi | Vì sao |
   |---|---|
   | Mô tả PLAN còn **thiếu/lỗi thời** gì? | PLAN viết trước, code đã đi xa hơn (vd ADR-013 xoá `(auth)`) |
   | Va chạm **ADR** nào? convention CLAUDE.md nào? | no hardcode string/màu, RHF+Zod, kebab-case, import alias |
   | **Edge case / trạng thái** chưa nhắc? | empty/loading/error, i18n vi+en, mobile-first vs admin desktop |
   | Đụng **mấy package**? | nếu shared/ui/web ngang nhau → cảnh báo sẽ phải tách commit |
   | Có phát sinh **quyết định lớn** → cần ADR? | nếu có, flag để chạy `/adr` |

4. Soạn **kế hoạch thực thi**: các bước theo thứ tự phụ thuộc (shared/ui trước, web sau), file đụng tới, điểm verify cuối.
5. Nêu rõ **các quyết định cần user chốt** (nếu có) — đừng tự quyết những thứ đổi hướng kiến trúc.

## Cơ chế duyệt

Dùng **plan mode native**: làm toàn bộ review trong plan mode (read-only), rồi trình plan qua `ExitPlanMode` để user duyệt. Đây là gate cứng — không Edit/Write/build cho tới khi được approve.

- Nếu có quyết định cần chốt mà không tự suy ra được từ code/PLAN → hỏi user **trong** lúc plan (AskUserQuestion), gói gọn, đừng menu lê thê.
- User wants **decisions, not menus**: với chỗ rẽ nhánh, đưa pick của mình kèm lý do, để user phản biện thay vì bắt họ tự nghĩ từ đầu.

## Sau khi duyệt

Plan được approve → bắt đầu implement theo plan. Khi code xong → gợi ý user gõ `/finish-task` để verify + tick PLAN + commit.
