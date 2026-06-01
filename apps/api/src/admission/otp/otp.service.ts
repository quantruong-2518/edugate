import { createHmac, randomBytes, randomInt } from "node:crypto";

import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { sql } from "drizzle-orm";

import type { AppRequest } from "../../common/types.js";
import { MailService } from "../mail/mail.service.js";

/**
 * One-time codes + verified submission tokens.
 *
 * Two artifacts share the otp_codes table (purpose column):
 *   • application       — the 6-digit code emailed to the parent (10-min TTL)
 *   • application_submit — the 32-byte opaque token minted on verify
 *                          (30-min TTL, single-use, redeemed by POST
 *                          /v1/applications)
 *
 * Hashing: HMAC-SHA256(secret = AUTH_SECRET, message = code). This is fast
 * (no native deps) and sufficient given low entropy (6-digit) + 10-min TTL
 * + 5-attempt lockout. specs/THREAT_MODEL.md §6 marks argon2id as the
 * target — switching is a one-line change once @node-rs/argon2 lands in
 * Day 6+ auth work.
 *
 * After 5 wrong attempts on a single (tenant, email) code, the row is
 * effectively locked (further verify calls return INVALID even with the
 * right code). The cleaner UX-and-security combo is a 15-min email lock
 * via Redis; deferred to rate-limit work.
 */

const CODE_TTL_MIN = 10;
const TOKEN_TTL_MIN = 30;
const MAX_ATTEMPTS = 5;
const RESEND_THROTTLE_SEC = 60;

@Injectable()
export class OtpService {
  private readonly logger = new Logger("Otp");
  private readonly secret: string;

  constructor(
    @Inject(ConfigService) private readonly config: ConfigService,
    @Inject(MailService) private readonly mail: MailService,
  ) {
    const secret = this.config.get<string>("AUTH_SECRET");
    if (!secret || secret.length < 16) {
      throw new Error(
        "AUTH_SECRET must be set to at least 16 characters (see apps/api/.env.example)",
      );
    }
    this.secret = secret;
  }

  /** Issue a code for the (tenant, email) pair and email it. */
  async send(req: AppRequest, email: string): Promise<{
    sent: true;
    expiresAt: string;
    devCode?: string;
  }> {
    const tx = this.requireTx(req);
    const tenantId = req.tenant!.id;
    const normalizedEmail = email.trim().toLowerCase();

    // Anti-spam: refuse if a code was sent for this (tenant, email) within
    // the last RESEND_THROTTLE_SEC seconds and isn't yet consumed.
    const recent = (await tx.execute(sql`
      SELECT created_at FROM otp_codes
       WHERE tenant_id = ${tenantId}
         AND email = ${normalizedEmail}
         AND purpose = 'application'
         AND consumed_at IS NULL
         AND created_at > now() - (${RESEND_THROTTLE_SEC} || ' seconds')::interval
       ORDER BY created_at DESC
       LIMIT 1
    `)) as { rows: Array<{ created_at: string }> };
    if (recent.rows.length > 0) {
      throw new BadRequestException({
        code: "RATE_LIMITED",
        message: `Vui lòng đợi ${RESEND_THROTTLE_SEC} giây trước khi gửi lại mã.`,
      });
    }

    const code = String(randomInt(100_000, 1_000_000)); // 6 digits
    const codeHash = this.hmac(code);
    const expiresAt = new Date(Date.now() + CODE_TTL_MIN * 60_000);

    await tx.execute(sql`
      INSERT INTO otp_codes (tenant_id, email, code_hash, purpose, expires_at)
      VALUES (${tenantId}, ${normalizedEmail}, ${codeHash}, 'application', ${expiresAt.toISOString()})
    `);

    await this.mail.send({
      to: normalizedEmail,
      kind: "application_otp",
      vars: {
        code,
        expiresAt: expiresAt.toISOString(),
        schoolName: req.tenant!.name,
      },
    });

    const isProd = this.config.get<string>("NODE_ENV") === "production";
    return {
      sent: true,
      expiresAt: expiresAt.toISOString(),
      ...(isProd ? {} : { devCode: code }),
    };
  }

  /**
   * Compare a submitted code against the latest unconsumed code for
   * (tenant, email). On success, mint a submission token (separate
   * purpose='application_submit' row) and return it.
   */
  async verify(
    req: AppRequest,
    email: string,
    submittedCode: string,
  ): Promise<{ verified: true; otpToken: string; expiresAt: string }> {
    const tx = this.requireTx(req);
    const tenantId = req.tenant!.id;
    const normalizedEmail = email.trim().toLowerCase();
    const codeHash = this.hmac(submittedCode.trim());

    const found = (await tx.execute(sql`
      SELECT id, code_hash, attempts, expires_at
        FROM otp_codes
       WHERE tenant_id = ${tenantId}
         AND email = ${normalizedEmail}
         AND purpose = 'application'
         AND consumed_at IS NULL
       ORDER BY created_at DESC
       LIMIT 1
       FOR UPDATE
    `)) as {
      rows: Array<{
        id: string;
        code_hash: string;
        attempts: number;
        expires_at: string;
      }>;
    };

    const row = found.rows[0];
    if (!row) throw this.invalidOtp();

    if (new Date(row.expires_at).getTime() < Date.now()) {
      throw this.invalidOtp();
    }
    if (row.attempts >= MAX_ATTEMPTS) {
      throw new ForbiddenException({
        code: "RATE_LIMITED",
        message: "Mã đã bị khóa do nhập sai nhiều lần. Vui lòng yêu cầu mã mới.",
      });
    }

    // Constant-time comparison via timing-safe equal would be ideal but the
    // attempt counter + lockout above already neutralises timing leaks at
    // the precision an attacker can observe over HTTP.
    if (row.code_hash !== codeHash) {
      await tx.execute(sql`
        UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ${row.id}
      `);
      throw this.invalidOtp();
    }

    // Mark the code consumed; mint the submission token.
    await tx.execute(sql`
      UPDATE otp_codes SET consumed_at = now() WHERE id = ${row.id}
    `);

    const token = randomBytes(32).toString("hex");
    const tokenHash = this.hmac(token);
    const tokenExpires = new Date(Date.now() + TOKEN_TTL_MIN * 60_000);
    await tx.execute(sql`
      INSERT INTO otp_codes (tenant_id, email, code_hash, purpose, expires_at)
      VALUES (${tenantId}, ${normalizedEmail}, ${tokenHash}, 'application_submit', ${tokenExpires.toISOString()})
    `);

    return {
      verified: true,
      otpToken: token,
      expiresAt: tokenExpires.toISOString(),
    };
  }

  /**
   * Consume a submission token. Throws if the token doesn't match the
   * given (tenant, email) within TTL. On success the token row is marked
   * consumed so it can't be replayed.
   */
  async consumeSubmitToken(
    req: AppRequest,
    email: string,
    token: string,
  ): Promise<void> {
    const tx = this.requireTx(req);
    const tenantId = req.tenant!.id;
    const normalizedEmail = email.trim().toLowerCase();
    const tokenHash = this.hmac(token);

    const found = (await tx.execute(sql`
      SELECT id, expires_at
        FROM otp_codes
       WHERE tenant_id = ${tenantId}
         AND email = ${normalizedEmail}
         AND purpose = 'application_submit'
         AND code_hash = ${tokenHash}
         AND consumed_at IS NULL
       FOR UPDATE
    `)) as { rows: Array<{ id: string; expires_at: string }> };

    const row = found.rows[0];
    if (!row || new Date(row.expires_at).getTime() < Date.now()) {
      throw new BadRequestException({
        code: "OTP_TOKEN_INVALID",
        message: "Token xác thực không hợp lệ hoặc đã hết hạn.",
      });
    }

    await tx.execute(sql`
      UPDATE otp_codes SET consumed_at = now() WHERE id = ${row.id}
    `);
  }

  private hmac(value: string): string {
    return createHmac("sha256", this.secret).update(value).digest("hex");
  }

  private requireTx(req: AppRequest): {
    execute: (q: unknown) => Promise<unknown>;
  } {
    const tx = req.tx as { execute: (q: unknown) => Promise<unknown> } | undefined;
    if (!tx) throw new Error("OtpService requires req.tx (TenantTxInterceptor)");
    return tx;
  }

  private invalidOtp(): BadRequestException {
    return new BadRequestException({
      code: "OTP_INVALID",
      message: "Mã xác thực không đúng hoặc đã hết hạn.",
    });
  }
}
