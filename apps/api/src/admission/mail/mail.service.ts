import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";

import { renderMail } from "./templates.js";

/**
 * Outbound email. When `RESEND_API_KEY` is set, sends via Resend's REST API;
 * otherwise logs to the console so the OTP flow stays smoke-testable
 * offline (CI, dev without internet, sandbox). The interface is narrow on
 * purpose — `kind` is the template id, `vars` are the substitution bag.
 * Per-tenant overrides land in `notification_templates` (pha 2.5+).
 */
export type MailKind =
  | "application_otp"
  | "application_received"
  | "application_state_change";

export type MailMessage = {
  to: string;
  kind: MailKind;
  /** Free-form bag of substitution variables. */
  vars: Record<string, unknown>;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger("Mail");
  private readonly client?: Resend;
  private readonly from: string;

  constructor(
    @Inject(ConfigService) private readonly config: ConfigService,
  ) {
    const apiKey = this.config.get<string>("RESEND_API_KEY");
    this.from =
      this.config.get<string>("EMAIL_FROM") ?? "onboarding@resend.dev";
    if (apiKey && apiKey.trim()) {
      this.client = new Resend(apiKey);
      this.logger.log(`Resend wired (from=${this.from})`);
    } else {
      this.logger.warn(
        "RESEND_API_KEY missing — emails will be logged to console only.",
      );
    }
  }

  async send(msg: MailMessage): Promise<{ messageId: string }> {
    // Render the kind/vars to subject + HTML + text. Throws when the kind
    // is unknown so we never silently drop a send.
    const rendered = renderMail(msg.kind, msg.vars);

    if (!this.client) {
      const messageId = `dev-${crypto.randomUUID()}`;
      this.logger.log(
        `→ ${msg.to} | ${msg.kind} | ${JSON.stringify(msg.vars)} | id=${messageId}`,
      );
      return { messageId };
    }

    const { data, error } = await this.client.emails.send({
      from: this.from,
      to: msg.to,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      // The application_otp + application_received tags help filter the
      // Resend dashboard / webhooks by intent.
      tags: [{ name: "kind", value: msg.kind }],
    });
    if (error) {
      // Surface as Error so the caller (OTP / submit flow) can decide whether
      // to swallow (receipt mail) or surface (OTP send).
      throw new Error(
        `Resend send failed (${msg.kind} → ${msg.to}): ${error.name}: ${error.message}`,
      );
    }
    if (!data?.id) {
      throw new Error(
        `Resend returned no id for ${msg.kind} → ${msg.to} (response empty).`,
      );
    }
    this.logger.log(`→ ${msg.to} | ${msg.kind} | id=${data.id}`);
    return { messageId: data.id };
  }
}
