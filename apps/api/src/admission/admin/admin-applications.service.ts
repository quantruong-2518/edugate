import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { sql } from "drizzle-orm";

import {
  APPLICATION_STATES,
  canTransition,
  TRANSITIONS,
  type ApplicationState,
  type Transition,
} from "shared/admission";

import type { AppRequest } from "../../common/types.js";
import type { ListApplicationsQuery } from "./admin-applications.dto.js";
import { parseStates } from "./admin-applications.dto.js";
import type { TransitionApplicationInput } from "./transition.dto.js";

/**
 * Admin reads + state transitions for /admin/applications. Tenant scope is
 * enforced by TenantTxInterceptor (SET app.tenant_id + RLS on applications +
 * application_history + audit_log) so this service builds queries without
 * explicit `tenant_id = ?` filters — RLS makes them tenant-safe regardless.
 */

type Row = {
  id: string;
  code: string;
  state: string;
  applicant: Record<string, unknown>;
  form_data: Record<string, unknown>;
  history: Array<{ state: string; at: string; note: string | null }>;
  created_at: string;
  updated_at: string;
};

type Tx = { execute: (q: unknown) => Promise<{ rows: unknown[] }> };

@Injectable()
export class AdminApplicationsService {
  async list(
    req: AppRequest,
    q: ListApplicationsQuery,
  ): Promise<{
    items: ReturnType<typeof rowToApplication>[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const tx = this.requireTx(req);

    const states = parseStates(q.states);
    const haveStates = states.length > 0;
    const searchTerm = q.search?.trim();
    const haveSearch = !!searchTerm;
    const haveDateFrom = !!q.dateFrom;
    const haveDateTo = !!q.dateTo;
    const haveScoreMin = q.scoreMin !== undefined;
    const haveScoreMax = q.scoreMax !== undefined;

    const scoreExpr = sql`((form_data->>'gpa')::numeric)`;
    const tenantCode = req.tenant?.code ?? "";

    const orderBy =
      q.sort === "createdAt:asc"
        ? sql`a.created_at ASC`
        : q.sort === "score:desc"
          ? sql`${scoreExpr} DESC NULLS LAST, a.created_at DESC`
          : q.sort === "score:asc"
            ? sql`${scoreExpr} ASC NULLS LAST, a.created_at DESC`
            : sql`a.created_at DESC`;

    const offset = (q.page - 1) * q.pageSize;

    const rowsRes = (await tx.execute(sql`
      WITH filtered AS (
        SELECT a.*
        FROM applications a
        WHERE a.deleted_at IS NULL
          ${
            haveStates
              ? sql`AND a.state IN (${sql.join(
                  states.map((s) => sql`${s}`),
                  sql`, `,
                )})`
              : sql``
          }
          ${haveDateFrom ? sql`AND a.created_at >= ${q.dateFrom}::date` : sql``}
          ${haveDateTo ? sql`AND a.created_at < (${q.dateTo}::date + INTERVAL '1 day')` : sql``}
          ${haveScoreMin ? sql`AND ${scoreExpr} >= ${q.scoreMin}` : sql``}
          ${haveScoreMax ? sql`AND ${scoreExpr} <= ${q.scoreMax}` : sql``}
          ${
            haveSearch
              ? sql`AND to_tsvector('simple',
                    immutable_unaccent(
                      coalesce(a.applicant->>'fullName', '')        || ' ' ||
                      coalesce(a.applicant->>'studentFullName', '') || ' ' ||
                      coalesce(a.form_data->>'studentName', '')     || ' ' ||
                      coalesce(a.form_data->'student'->>'name', '') || ' ' ||
                      coalesce(a.code, '')
                    )
                  ) @@ plainto_tsquery('simple', immutable_unaccent(${searchTerm}))`
              : sql``
          }
      )
      SELECT
        a.id, a.code, a.state, a.applicant, a.form_data,
        a.created_at, a.updated_at,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object('state', h.state, 'at', h.at, 'note', h.note)
              ORDER BY h.at
            )
            FROM application_history h
            WHERE h.application_id = a.id
          ),
          '[]'::json
        ) AS history,
        COUNT(*) OVER () AS _total
      FROM filtered a
      ORDER BY ${orderBy}
      LIMIT ${q.pageSize} OFFSET ${offset}
    `)) as { rows: Array<Row & { _total: string | number }> };

    const total =
      rowsRes.rows.length > 0 ? Number(rowsRes.rows[0]!._total) : 0;

    return {
      items: rowsRes.rows.map((r) => rowToApplication(r, tenantCode)),
      total,
      page: q.page,
      pageSize: q.pageSize,
    };
  }

  async transition(
    req: AppRequest,
    code: string,
    body: TransitionApplicationInput,
  ): Promise<ReturnType<typeof rowToApplication>> {
    const tx = this.requireTx(req);
    const tenantId = req.tenant?.id;
    if (!tenantId) {
      throw new Error("Missing tenant context (TenantTxInterceptor)");
    }
    const tenantCode = req.tenant?.code ?? "";
    const normalizedCode = code.trim().toUpperCase();

    // 1) Lock the application row so two reviewers can't transition the same
    //    record concurrently and write conflicting history.
    const currentRes = (await tx.execute(sql`
      SELECT id, state
        FROM applications
       WHERE code = ${normalizedCode}
         AND deleted_at IS NULL
       FOR UPDATE
       LIMIT 1
    `)) as { rows: Array<{ id: string; state: string }> };
    const current = currentRes.rows[0];
    if (!current) {
      throw new NotFoundException({
        code: "APPLICATION_NOT_FOUND",
        message: "Không tìm thấy hồ sơ với mã đã nhập.",
      });
    }

    const from = current.state as ApplicationState;
    const to = body.to as ApplicationState;

    // 2) State machine check. Actor role is ADMISSION_ADMIN until P2.6 wires
    //    Better-Auth — this is the only role the admin UI's <StateActions>
    //    surfaces buttons for, so refusing on role here would never trigger.
    if (!canTransition(from, to, "ADMISSION_ADMIN")) {
      throw new UnprocessableEntityException({
        code: "INVALID_TRANSITION",
        message: `Không thể chuyển hồ sơ từ "${APPLICATION_STATES[from].label}" sang "${APPLICATION_STATES[to].label}".`,
      });
    }

    const rule = TRANSITIONS.find(
      (t: Transition) =>
        t.from === from && t.to === to && t.roles.includes("ADMISSION_ADMIN"),
    );
    const reason = body.reason?.trim() || null;
    if (rule?.requireReason && !reason) {
      throw new BadRequestException({
        code: "REASON_REQUIRED",
        message: "Cần nhập lý do cho thao tác này.",
      });
    }

    // 3) Update + history + audit, all inside the same tx (rollback on any
    //    failure → no partial state, no orphan audit row).
    await tx.execute(sql`
      UPDATE applications
         SET state = ${to}, updated_at = now()
       WHERE id = ${current.id}
    `);

    await tx.execute(sql`
      INSERT INTO application_history
        (tenant_id, application_id, state, by_role, note)
      VALUES
        (${tenantId}, ${current.id}, ${to}, 'ADMISSION_ADMIN', ${reason})
    `);

    // Action label maps to the FE audit viewer's badges: 'approve'/'reject'
    // get dedicated colors; everything else falls under 'state_change'.
    const action: "approve" | "reject" | "state_change" =
      to === "APPROVED" ? "approve" : to === "REJECTED" ? "reject" : "state_change";

    const requestId =
      (req.id as string | undefined) ?? crypto.randomUUID();
    const actor = req.user;
    const ip = req.ip ?? null;
    const userAgent =
      (req.headers["user-agent"] as string | undefined) ?? null;
    const targetLabel = `${normalizedCode} → ${APPLICATION_STATES[to].label}`;
    const payload = { from, to, reason };

    await tx.execute(sql`
      INSERT INTO audit_log
        (tenant_id, actor_user_id, actor_role, action, resource,
         target_id, target_label, payload, request_id, ip, user_agent)
      VALUES
        (${tenantId}, ${actor?.id ?? null}, ${actor?.activeRole ?? "SYSTEM"},
         ${action}, 'application',
         ${current.id}, ${targetLabel},
         ${JSON.stringify(payload)}::jsonb,
         ${requestId}, ${ip}::inet, ${userAgent})
    `);

    // 4) Reload the application in the same shape `list` returns so the FE
    //    can drop the result straight into its query cache.
    const reloadedRes = (await tx.execute(sql`
      SELECT
        a.id, a.code, a.state, a.applicant, a.form_data,
        a.created_at, a.updated_at,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object('state', h.state, 'at', h.at, 'note', h.note)
              ORDER BY h.at
            )
            FROM application_history h
            WHERE h.application_id = a.id
          ),
          '[]'::json
        ) AS history
      FROM applications a
      WHERE a.id = ${current.id}
      LIMIT 1
    `)) as { rows: Row[] };
    const reloaded = reloadedRes.rows[0];
    if (!reloaded) throw new Error("application disappeared after transition");
    return rowToApplication(reloaded, tenantCode);
  }

  private requireTx(req: AppRequest): Tx {
    const tx = req.tx as Tx | undefined;
    if (!tx) {
      throw new Error("Missing tenant tx (TenantTxInterceptor)");
    }
    return tx;
  }
}

/** Map DB row to the wire shape the FE expects (`Application`). */
export function rowToApplication(row: Row, tenantCode: string) {
  return {
    code: row.code,
    tenantCode,
    state: row.state,
    applicant: row.applicant,
    formData: row.form_data,
    history: (row.history ?? []).map((h) => ({
      state: h.state,
      at: typeof h.at === "string" ? h.at : new Date(h.at).toISOString(),
      note: h.note ?? undefined,
    })),
    createdAt:
      typeof row.created_at === "string"
        ? row.created_at
        : new Date(row.created_at).toISOString(),
    updatedAt:
      typeof row.updated_at === "string"
        ? row.updated_at
        : new Date(row.updated_at).toISOString(),
  };
}
