import { Injectable, Logger } from "@nestjs/common";

/**
 * Outbound email. Phase 2.5 wires Resend; today every send is a console
 * log so the parent OTP / receipt flow can be smoke-tested without an SMTP
 * provider. The interface is deliberately narrow — `kind` is the template
 * id (matches notification_templates.kind), `vars` are the substitution
 * variables. Phase 2.5 fetches per-tenant overrides from
 * notification_templates and falls back to platform defaults.
 */
export type MailKind =
  | "application_otp"
  | "application_received"
  | "application_state_change";

export type MailMessage = {
  to: string;
  kind: MailKind;
  /** Free-form bag of substitution variables. Logged verbatim in dev. */
  vars: Record<string, unknown>;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger("Mail");

  async send(msg: MailMessage): Promise<{ messageId: string }> {
    const messageId = `dev-${crypto.randomUUID()}`;
    this.logger.log(
      `→ ${msg.to} | ${msg.kind} | ${JSON.stringify(msg.vars)} | id=${messageId}`,
    );
    return { messageId };
  }
}
