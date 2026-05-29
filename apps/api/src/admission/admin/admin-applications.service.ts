import { Injectable } from "@nestjs/common";
import { sql } from "drizzle-orm";

import type { AppRequest } from "../../common/types.js";
import type { ListApplicationsQuery } from "./admin-applications.dto.js";
import { parseStates } from "./admin-applications.dto.js";

/**
 * Admin reads for the /admin/applications grid. Tenant scope is enforced by
 * TenantTxInterceptor (SET app.tenant_id + RLS on applications) so this
 * service can build queries without explicit `tenant_id = ?` filters; the
 * RLS policy makes them tenant-safe regardless.
 *
 * Returns the same shape as the FE's `ListApplicationsResult` so swapping
 * the mock for this seam is a one-line change in `lib/api/admission.ts`.
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
    const tx = req.tx;
    if (!tx) throw new Error("Missing tenant tx (TenantTxInterceptor)");

    const states = parseStates(q.states);
    const haveStates = states.length > 0;
    const searchTerm = q.search?.trim();
    const haveSearch = !!searchTerm;
    const haveDateFrom = !!q.dateFrom;
    const haveDateTo = !!q.dateTo;
    const haveScoreMin = q.scoreMin !== undefined;
    const haveScoreMax = q.scoreMax !== undefined;

    // Score column is reused by the sort branch — compute once via the same
    // expression as the `applications_tenant_gpa_idx` index so the planner can
    // use it. Falls back to ((form_data->>'gpa')::numeric) when present.
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

    // Single statement: rows + total in one round trip via a window
    // function. Saves one COUNT(*) query for every page navigation.
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
}

/** Map DB row to the wire shape the FE expects (`Application`). */
function rowToApplication(row: Row, tenantCode: string) {
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
