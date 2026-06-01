import type { MailKind } from "./mail.service.js";

/**
 * Email templates (VI). Phase 2.5 moves these into `notification_templates`
 * for per-tenant overrides; today every tenant gets the same body and the
 * tenant name lands via `vars.schoolName` so the copy still reads correctly.
 *
 * Each template returns { subject, html, text }. Plain-text is required by
 * Resend's deliverability heuristics and by accessibility (screen readers
 * fall back to text when HTML rendering fails).
 */

export type RenderedMail = {
  subject: string;
  html: string;
  text: string;
};

const BRAND = "tuyensinhnhanh.vn";

export function renderMail(
  kind: MailKind,
  vars: Record<string, unknown>,
): RenderedMail {
  switch (kind) {
    case "application_otp":
      return renderOtp(vars);
    case "application_received":
      return renderReceived(vars);
    case "application_state_change":
      return renderStateChange(vars);
  }
}

function renderOtp(vars: Record<string, unknown>): RenderedMail {
  const code = String(vars["code"] ?? "");
  const expiresAt = vars["expiresAt"] as string | undefined;
  const expiresMinutes = expiresAt ? minutesFromNow(expiresAt) : 10;
  const schoolName = String(vars["schoolName"] ?? BRAND);
  const subject = `[${schoolName}] Mã xác thực email: ${code}`;
  const text = [
    `Mã xác thực email của bạn là: ${code}`,
    `Mã có hiệu lực trong ${expiresMinutes} phút.`,
    "",
    `Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email.`,
    `— ${schoolName}`,
  ].join("\n");
  const html = baseLayout({
    title: "Mã xác thực email",
    body: `
      <p style="margin:0 0 16px;font-size:15px;color:#374151">
        Đây là mã xác thực bạn cần để nộp hồ sơ tuyển sinh trực tuyến tại
        <strong>${escapeHtml(schoolName)}</strong>.
      </p>
      <div style="margin:24px 0;text-align:center">
        <div style="display:inline-block;padding:14px 28px;border-radius:12px;
                    background:#f3f4f6;font-family:'SFMono-Regular',Menlo,Consolas,monospace;
                    font-size:32px;font-weight:700;letter-spacing:8px;color:#111827">
          ${escapeHtml(code)}
        </div>
      </div>
      <p style="margin:0 0 8px;font-size:14px;color:#6b7280">
        Mã có hiệu lực trong <strong>${expiresMinutes} phút</strong>.
      </p>
      <p style="margin:0;font-size:13px;color:#9ca3af">
        Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email.
      </p>
    `,
  });
  return { subject, html, text };
}

function renderReceived(vars: Record<string, unknown>): RenderedMail {
  const code = String(vars["code"] ?? "");
  const schoolName = String(vars["schoolName"] ?? BRAND);
  const applicantName = String(vars["applicantName"] ?? "Quý phụ huynh");
  const subject = `[${schoolName}] Đã nhận hồ sơ tuyển sinh — Mã ${code}`;
  const text = [
    `Kính gửi ${applicantName},`,
    "",
    `Nhà trường đã nhận được hồ sơ tuyển sinh của bạn.`,
    `Mã hồ sơ: ${code}`,
    "",
    `Vui lòng giữ lại mã để tra cứu trạng thái.`,
    `— ${schoolName}`,
  ].join("\n");
  const html = baseLayout({
    title: "Đã nhận hồ sơ tuyển sinh",
    body: `
      <p style="margin:0 0 16px;font-size:15px;color:#374151">
        Kính gửi <strong>${escapeHtml(applicantName)}</strong>,
      </p>
      <p style="margin:0 0 16px;font-size:15px;color:#374151">
        Nhà trường <strong>${escapeHtml(schoolName)}</strong> đã nhận được hồ sơ tuyển sinh của bạn.
      </p>
      <div style="margin:24px 0;padding:16px 20px;border-radius:12px;background:#f3f4f6">
        <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#6b7280">Mã hồ sơ</div>
        <div style="font-family:'SFMono-Regular',Menlo,Consolas,monospace;font-size:22px;font-weight:700;color:#111827;margin-top:4px">
          ${escapeHtml(code)}
        </div>
      </div>
      <p style="margin:0;font-size:14px;color:#6b7280">
        Vui lòng giữ lại mã để tra cứu trạng thái hồ sơ.
      </p>
    `,
  });
  return { subject, html, text };
}

function renderStateChange(vars: Record<string, unknown>): RenderedMail {
  const code = String(vars["code"] ?? "");
  const schoolName = String(vars["schoolName"] ?? BRAND);
  const newState = String(vars["state"] ?? "");
  const subject = `[${schoolName}] Cập nhật trạng thái hồ sơ ${code}`;
  const text = [
    `Hồ sơ ${code} đã chuyển sang trạng thái: ${newState}.`,
    `— ${schoolName}`,
  ].join("\n");
  const html = baseLayout({
    title: "Cập nhật trạng thái hồ sơ",
    body: `
      <p style="margin:0 0 16px;font-size:15px;color:#374151">
        Hồ sơ <strong>${escapeHtml(code)}</strong> tại ${escapeHtml(schoolName)} đã được cập nhật.
      </p>
      <div style="margin:24px 0;padding:16px 20px;border-radius:12px;background:#f3f4f6">
        <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#6b7280">Trạng thái mới</div>
        <div style="font-size:18px;font-weight:600;color:#111827;margin-top:4px">
          ${escapeHtml(newState)}
        </div>
      </div>
    `,
  });
  return { subject, html, text };
}

function baseLayout(opts: { title: string; body: string }): string {
  return `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(opts.title)}</title>
  </head>
  <body style="margin:0;padding:32px 16px;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Inter,Arial,sans-serif">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 1px 2px rgba(0,0,0,0.04)">
      <h1 style="margin:0 0 24px;font-size:20px;font-weight:600;color:#111827;letter-spacing:-0.01em">
        ${escapeHtml(opts.title)}
      </h1>
      ${opts.body}
      <hr style="margin:28px 0 16px;border:none;border-top:1px solid #e5e7eb" />
      <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center">
        Email này được gửi tự động từ ${BRAND}. Vui lòng không trả lời.
      </p>
    </div>
  </body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function minutesFromNow(iso: string): number {
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return 10;
  return Math.max(1, Math.round((ts - Date.now()) / 60000));
}
