---
name: handoff
description: Write a ground-truth session handoff to docs/HANDOFF.md so a FRESH conversation can resume mid-task without hallucinating. Use when ending/pausing a conversation with work in flight, when context is getting full, or when the user asks "handoff", "lưu state", "ghi lại để tiếp", "chuẩn bị resume", "đóng conversation". Pairs with /resume (which reads it back). Built from live git/PLAN state, never from memory.
---

# handoff

Ghi **trạng thái đang-dở** của session vào `docs/HANDOFF.md` để một conversation **mới tinh** (zero context) tiếp tục được mà **không bịa**. Đây là cặp đôi của `/resume`.

## Vì sao tồn tại (đọc kỹ — quyết định mọi thứ bên dưới)

Compaction + conversation mới giữ lại `CLAUDE.md` nhưng **vứt mất**: quyết định giữa chừng, lý do, việc đã thử-và-loại, vị trí chính xác đang đứng. `PLAN.md`/`DECISIONS.md` chỉ bắt cái đã chốt, KHÔNG bắt cái đang dở. Handoff lấp đúng khoảng đó.

**Phân vai — handoff KHÔNG được lặp 3 file kia, chỉ trỏ tới:**

| File | Chứa gì | Bền? |
|---|---|---|
| `CLAUDE.md` | Luật, convention, stack | Vĩnh viễn |
| `docs/PLAN.md` | Task + status `[ ]/[~]/[x]` | Committed |
| `docs/DECISIONS.md` | ADR đã chốt | Committed |
| **`docs/HANDOFF.md`** | **State đang-dở: đang ở đâu, vừa đổi gì, thử gì hỏng, bước kế literal** | **Ephemeral, overwrite** |

Nếu một dòng handoff đã có trong PLAN/DECISIONS → **bỏ**, chỉ ghi `→ PLAN task 12` để trỏ.

## Anti-hallucination — luật cứng

1. **Build từ LIVE STATE, không từ trí nhớ.** Bắt buộc chạy trước khi viết: `git rev-parse --short HEAD`, `git status --short`, `git diff --stat`, `git log --oneline -5`, đọc trạng thái hiện tại trong `docs/PLAN.md`. Handoff là *snapshot sự thật*, không phải "tôi nhớ đã làm…".
2. **Neo mọi claim.** Mỗi mục "đã đổi" PHẢI khớp một file trong `git status`. Nếu định ghi "đã sửa X" mà X không có trong `git status`/`git diff` → **không ghi** (chưa thật sự đổi, hoặc đã commit rồi → thuộc PLAN). Mỗi "done" trỏ `path:line` hoặc commit SHA.
3. **Tách độ tin.** `✅` = đã verify (chạy/đọc tận nơi). `🤔` = giả định, chưa kiểm. Conversation mới được phép nghi ngờ `🤔`.
4. **Verify-first checklist** ở đầu doc: lệnh + output kỳ vọng, để người đọc *kiểm tra* trước khi *tin*.
5. **Regenerate, KHÔNG append.** Luôn overwrite toàn bộ `docs/HANDOFF.md`. Không nối lịch sử (git lo lịch sử nếu cần).
6. **No placeholder, no secret.** Không để `[TODO: điền]`, không dán `.env`/token/credential. Nếu một mục không biết → ghi vào "Open questions" dưới dạng câu hỏi, đừng bịa giá trị.

## Template (ghi đúng cấu trúc này vào docs/HANDOFF.md)

```markdown
# HANDOFF — <mục tiêu 1 câu>

> Ephemeral session state. Source of truth: CLAUDE.md + docs/PLAN.md + docs/DECISIONS.md.
> Regenerated <YYYY-MM-DD> · overwrite mỗi lần · neo vào git, đừng tin văn xuôi suông.

## Ground truth
- Branch: `<branch>` · HEAD: `<short-sha> <subject>`
- Dirty: `<N>` file (chi tiết ở "Đã đổi gì")
- Task: PLAN <số + tên> — trạng thái `[~]`

## Verify-first (chạy trước khi làm gì)
\`\`\`bash
git rev-parse --short HEAD   # kỳ vọng <sha> — khác = repo đã tiến, ĐỌC LẠI từ git/PLAN
git status --short           # kỳ vọng <tóm tắt list>
pnpm typecheck               # trạng thái hiện tại: <pass | fail ở ...>
\`\`\`

## Đang làm gì (1 câu)
<mục tiêu cụ thể đang theo đuổi>

## Trạng thái
- ✅ Done (verified): <…>
- 🚧 In-flight: <… + path:line>
- ⬜ Chưa đụng: <…>

## Đã đổi gì (mỗi dòng = 1 file trong git status)
- `path/to/file.tsx` — <làm gì>, <còn dở gì>

## Quyết định session này
- <quyết định> vì <lý do>. <→ nên ghi ADR? | đã ghi ADR-0xx>

## Đã thử & loại (đừng làm lại)
- Thử <X> → hỏng vì <Y>.

## ▶ BƯỚC KẾ (literal — làm cái này trước)
1. <hành động cụ thể, không mơ hồ>

## Open questions / blockers
- 🤔 <điều chưa chắc — ghi dạng câu hỏi, không bịa>

## Gotchas
- <bẫy non-obvious không sống qua compaction>
```

## Quy trình

1. Chạy chùm lệnh git + đọc PLAN.md (luật #1).
2. Map từng file dirty → mục "Đã đổi gì" (luật #2). File nào không giải thích được → đó là tín hiệu chính bạn cũng chưa rõ → đưa vào Open questions.
3. Viết "Bước kế" **literal** — câu lệnh/hành động đầu tiên conversation mới nên làm, không phải mô tả mơ hồ.
4. Overwrite `docs/HANDOFF.md` (luật #5). Lần đầu chạy: thêm `docs/HANDOFF.md` vào `.gitignore` nếu chưa có (state local, không commit cùng task).
5. Tự kiểm: doc có placeholder/secret không? mọi "đã đổi" có khớp `git status` không? có lặp PLAN/DECISIONS không? → sửa rồi mới báo xong.
6. Báo user: đã ghi handoff, mở conversation mới gõ `/resume` để tiếp.

## Khi nào KHÔNG cần handoff

Task vừa **xong hẳn** → dùng `/finish-task` (tick PLAN + commit) là đủ; PLAN.md đã là state. Handoff chỉ cho lúc **dừng giữa chừng** việc còn dở.
