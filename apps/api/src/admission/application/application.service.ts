import { randomInt } from "node:crypto";

import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { sql } from "drizzle-orm";

import type { AppRequest } from "../../common/types.js";
import { MailService } from "../mail/mail.service.js";
import { OtpService } from "../otp/otp.service.js";
import type { SubmitApplicationInput } from "./application.dto.js";

/**
 * Admission application service — the body of POST /v1/applications and
 * GET /v1/applications/by-code/:code.
 *
 * All DB access goes through `req.tx` (set by TenantTxInterceptor). That
 * means every query in this file runs inside the tenant tx with
 * SET LOCAL ROLE app_role + app.tenant_id pinned; RLS prevents reads or
 * writes leaking across tenants even if a query author forgets to filter.
 */

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

type CampaignRow = {
  id: string;
  code: string;
  opens_at: string;
  closes_at: string;
  status: string;
  form_template_id: string;
  form_template_version: number;
};

type CreatedRow = {
  code: string;
  state: string;
  created_at: string;
};

type ApplicationRow = {
  code: string;
  state: string;
  applicant: {
    fullName: string;
    email: string;
    phone: string;
    relationship: string;
    studentFullName?: string;
  };
  form_data: Record<string, unknown>;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
};

type HistoryRow = {
  state: string;
  at: string;
  note: string | null;
  by_role: string | null;
};

@Injectable()
export class ApplicationService {
  private readonly logger = new Logger("Application");

  constructor(
    @Inject(OtpService) private readonly otp: OtpService,
    @Inject(MailService) private readonly mail: MailService,
  ) {}

  /** Resolve the campaign to submit against (explicit id or default open). */
  private async resolveCampaign(
    req: AppRequest,
    explicitCampaignId?: string,
  ): Promise<CampaignRow> {
    const tx = this.requireTx(req);
    const tenantId = req.tenant!.id;

    if (explicitCampaignId) {
      const { rows } = (await tx.execute(sql`
        SELECT c.id, c.code, c.opens_at, c.closes_at, c.status,
               c.form_template_id,
               ft.version AS form_template_version
          FROM admission_campaigns c
          JOIN form_templates ft ON ft.id = c.form_template_id
         WHERE c.id = ${explicitCampaignId}
           AND c.tenant_id = ${tenantId}
           AND c.deleted_at IS NULL
         LIMIT 1
      `)) as { rows: CampaignRow[] };
      const row = rows[0];
      if (!row) throw new NotFoundException({
        code: "CAMPAIGN_NOT_FOUND",
        message: "Đợt tuyển sinh không tồn tại.",
      });
      this.assertOpen(row);
      return row;
    }

    // Default: the single open campaign for this tenant (DATA_MODEL §3.2
    // EXCLUDE constraint guarantees at most one overlaps a given instant).
    const { rows } = (await tx.execute(sql`
      SELECT c.id, c.code, c.opens_at, c.closes_at, c.status,
             c.form_template_id,
             ft.version AS form_template_version
        FROM admission_campaigns c
        JOIN form_templates ft ON ft.id = c.form_template_id
       WHERE c.tenant_id = ${tenantId}
         AND c.deleted_at IS NULL
         AND c.opens_at <= now()
         AND c.closes_at > now()
       ORDER BY c.opens_at DESC
       LIMIT 1
    `)) as { rows: CampaignRow[] };
    const row = rows[0];
    if (!row) {
      throw new UnprocessableEntityException({
        code: "NO_OPEN_CAMPAIGN",
        message: "Hiện chưa có đợt tuyển sinh nào đang mở.",
      });
    }
    this.assertOpen(row);
    return row;
  }

  private assertOpen(c: CampaignRow): void {
    const now = Date.now();
    if (
      new Date(c.opens_at).getTime() > now ||
      new Date(c.closes_at).getTime() <= now ||
      (c.status !== "open" && c.status !== "scheduled")
    ) {
      throw new UnprocessableEntityException({
        code: "CAMPAIGN_CLOSED",
        message: "Đợt tuyển sinh đã đóng nhận hồ sơ.",
      });
    }
  }

  async submit(req: AppRequest, input: SubmitApplicationInput): Promise<CreatedRow> {
    const tx = this.requireTx(req);
    const tenantId = req.tenant!.id;
    const tenantCode = req.tenant!.code;

    // 1) Validate the OTP submit token (single-use, tied to applicant email).
    await this.otp.consumeSubmitToken(req, input.applicant.email, input.otpToken);

    // 2) Look up the target campaign + form template.
    const campaign = await this.resolveCampaign(req, input.campaignId);

    // 3) Generate a human-friendly application code unique per tenant.
    const code = generateApplicationCode(tenantCode);

    // 4) Insert the application + its first history row inside the same tx
    //    so partial state is impossible (rollback on either failure).
    const insertedRows = (await tx.execute(sql`
      INSERT INTO applications
        (tenant_id, campaign_id, code, state, applicant, form_data,
         form_template_id, form_template_version, submitted_at)
      VALUES
        (${tenantId}, ${campaign.id}, ${code}, 'SUBMITTED',
         ${JSON.stringify(input.applicant)}::jsonb,
         ${JSON.stringify(input.formData)}::jsonb,
         ${campaign.form_template_id}, ${campaign.form_template_version}, now())
      RETURNING id, code, state, created_at
    `)) as {
      rows: Array<{ id: string; code: string; state: string; created_at: string }>;
    };
    const inserted = insertedRows.rows[0];
    if (!inserted) {
      throw new Error("Insert returned no rows; check RLS policies.");
    }

    await tx.execute(sql`
      INSERT INTO application_history
        (tenant_id, application_id, state, by_role)
      VALUES
        (${tenantId}, ${inserted.id}, 'SUBMITTED', 'APPLICANT')
    `);

    // 5) Receipt email — failures must not block the response, so we log
    //    on error rather than throw. Production rolls this into BullMQ.
    try {
      await this.mail.send({
        to: input.applicant.email,
        kind: "application_received",
        vars: {
          code: inserted.code,
          schoolName: tenantCode,
          applicantName: input.applicant.fullName,
        },
      });
    } catch (err) {
      this.logger.warn(
        `receipt email failed for ${inserted.code}: ${(err as Error).message}`,
      );
    }

    return {
      code: inserted.code,
      state: inserted.state,
      created_at: inserted.created_at,
    };
  }

  async getByCode(req: AppRequest, code: string): Promise<{
    code: string;
    state: string;
    applicant: ApplicationRow["applicant"];
    formData: Record<string, unknown>;
    history: Array<{ state: string; at: string; byRole: string | null; note: string | null }>;
    createdAt: string;
    updatedAt: string;
    submittedAt: string | null;
  }> {
    const tx = this.requireTx(req);

    // RLS scopes this to the active tenant; cross-tenant codes return zero
    // rows → indistinguishable from "not found" per THREAT_MODEL §4.3.
    const appRows = (await tx.execute(sql`
      SELECT code, state, applicant, form_data, submitted_at,
             created_at, updated_at
        FROM applications
       WHERE code = ${code.trim().toUpperCase()}
         AND deleted_at IS NULL
       LIMIT 1
    `)) as { rows: ApplicationRow[] };
    const row = appRows.rows[0];
    if (!row) {
      throw new NotFoundException({
        code: "APPLICATION_NOT_FOUND",
        message: "Không tìm thấy hồ sơ với mã đã nhập.",
      });
    }

    const historyRows = (await tx.execute(sql`
      SELECT state, at, note, by_role
        FROM application_history
       WHERE application_id = (
         SELECT id FROM applications WHERE code = ${code.trim().toUpperCase()}
       )
       ORDER BY at ASC
    `)) as { rows: HistoryRow[] };

    return {
      code: row.code,
      state: row.state,
      applicant: row.applicant,
      formData: row.form_data,
      history: historyRows.rows.map((h) => ({
        state: h.state,
        at: h.at,
        byRole: h.by_role,
        note: h.note,
      })),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      submittedAt: row.submitted_at,
    };
  }

  private requireTx(req: AppRequest): {
    execute: (q: unknown) => Promise<unknown>;
  } {
    const tx = req.tx as { execute: (q: unknown) => Promise<unknown> } | undefined;
    if (!tx) throw new Error("ApplicationService requires req.tx");
    return tx;
  }
}

function generateApplicationCode(tenantCode: string): string {
  const prefix =
    tenantCode.replace(/[^a-z0-9]/gi, "").slice(0, 3).toUpperCase() || "EDU";
  const year = String(new Date().getFullYear()).slice(2);
  let suffix = "";
  for (let i = 0; i < 6; i += 1) {
    suffix += CODE_ALPHABET[randomInt(0, CODE_ALPHABET.length)];
  }
  return `${prefix}-${year}-${suffix}`;
}
