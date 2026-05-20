---
name: commit
description: Create clean, single-responsibility git commits following Conventional Commits + this repo's rules. Use when the user asks to commit, "tạo commit", "commit code", split work into commits, or after finishing a PLAN.md task. Groups unrelated changes into separate commits and writes messages whose context is clear on read.
---

# commit

Tạo commit **chuẩn Conventional Commits**, mỗi commit **single responsibility**, message đọc là hiểu ngay context của phần việc.

## Nguyên tắc bất di bất dịch

1. **1 commit = 1 trách nhiệm.** Không bao giờ gộp nhiều mục đích (vd: thêm feature + sửa typo + bump deps) vào 1 commit. Nếu working tree có nhiều nhóm thay đổi không liên quan → tách thành nhiều commit, stage chọn lọc bằng `git add <path>`.
2. **Subject = tiếng Anh, imperative, ≤ 72 ký tự, không dấu chấm cuối.** Body có thể tiếng Việt để giải thích context cho team (code English, communication Vietnamese — theo CLAUDE.md).
3. **Message phải tự đủ context.** Người đọc git log 6 tháng sau, không mở diff, vẫn hiểu *cái gì đổi* và *tại sao*. Body trả lời **WHY**, không liệt kê WHAT (diff đã nói WHAT).
4. **Không commit secret** (`.env`, credentials, key). Stage file theo tên, không `git add -A` / `git add .`.
5. **Không `--amend`, không `--no-verify`, không skip hook** trừ khi user yêu cầu rõ. Hook fail → sửa gốc → stage lại → tạo commit MỚI.
6. **Chỉ commit khi user yêu cầu.** Skill này được gọi tức là đã có yêu cầu.

## Format

```
<type>(<scope>): <subject>

<body — WHY + context, wrap 72 cột>

<footer — refs + trailer>
```

### type (bắt buộc)

| type | dùng khi |
|---|---|
| `feat` | thêm capability/feature mới cho người dùng |
| `fix` | sửa bug |
| `refactor` | đổi code, không đổi behavior |
| `chore` | scaffold, config, deps, việc lặt vặt không phải feature |
| `docs` | chỉ tài liệu (`docs/`, README, comment lớn) |
| `test` | thêm/sửa test |
| `style` | format, lint, whitespace — không đổi logic |
| `perf` | cải thiện hiệu năng |
| `build` / `ci` | build system, pipeline |

### scope (theo monorepo layout)

`web`, `ui`, `shared`, `db`, `api`, `repo` (root config). Có thể dùng scope domain nhỏ hơn khi rõ hơn: `admission`, `auth`, `tenant`, `theme`, `i18n`, `deps`. Suy ra scope từ path đổi nhiều nhất. Nếu commit chạm nhiều package ngang nhau → đó là dấu hiệu cần **tách commit**, không phải dùng scope chung.

### subject

- imperative: `add`, `fix`, `wire`, `extract` — KHÔNG `added`/`adds`/`adding`.
- lowercase đầu, không dấu chấm cuối.
- mô tả kết quả, không mô tả thao tác file: `feat(shared): add role-based ability matrix` ✅, không `feat: edit abilities.ts` ❌.

### body (gần như luôn cần, trừ commit thực sự trivial)

- Giải thích **tại sao** đổi, ràng buộc/đánh đổi, quyết định non-obvious. Tham chiếu task PLAN.md nếu có (`PLAN task 9`).
- KHÔNG kể lể từng dòng diff. KHÔNG ghi "đã sửa theo yêu cầu".
- Bullet `-` cho nhiều ý.

### footer

- Refs: `Refs: PLAN task 9`, `Closes #123` nếu có issue.
- Breaking change: dòng `BREAKING CHANGE: <mô tả>`.
- Luôn kèm trailer (cách 1 dòng trống):
  ```
  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  ```

## Quy trình

1. Chạy song song: `git status` (KHÔNG `-uall`), `git diff` (staged + unstaged), `git log --oneline -10` (học style repo).
2. **Phân nhóm** thay đổi theo trách nhiệm. Một file có thể thuộc nhiều nhóm — nếu vậy cân nhắc `git add -p`. Map mỗi nhóm → 1 commit.
3. Nếu có **>1 nhóm**: trình bày kế hoạch commit (thứ tự + message dự kiến) cho user TRƯỚC khi commit. Commit theo thứ tự phụ thuộc (shared/ui trước, web sau).
4. Với mỗi commit: stage đúng path của nhóm đó (`git add <paths>`), tạo commit với message qua HEREDOC, rồi `git status` xác nhận.
5. Hook fail → đọc lỗi, sửa, stage lại, commit MỚI (không amend).
6. KHÔNG `git push` trừ khi user yêu cầu.

Tạo commit message luôn dùng HEREDOC để giữ format:

```bash
git commit -m "$(cat <<'EOF'
feat(shared): add role-based ability matrix

Encode role × action × resource × scope theo docs/PERMISSIONS.md làm
single source of truth cho FE gate, BE guard và RLS (pha 2). Matrix flat,
không inheritance — role cao khai lại rule role thấp để 3 lớp diff thẳng.

Refs: PLAN task 9

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

## Ví dụ tốt vs xấu

✅ `feat(web): wire AbilityProvider into admin layout`
✅ `fix(tenant): strip inbound x-tenant-code to block header spoof`
✅ `refactor(ui): extract state tone palette into state-tone.ts`
✅ `chore(repo): scaffold turborepo + pnpm workspaces`

❌ `update code` — vô nghĩa, không scope/type.
❌ `feat: add ability layer and fix typo and bump next` — gộp 3 trách nhiệm, phải tách.
❌ `feat(shared): added abilities.ts` — past tense + mô tả file thay vì kết quả.
❌ `wip` / `fix stuff` / `asdf` — không bao giờ.
