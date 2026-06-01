import { Injectable } from "@nestjs/common";
import { sql } from "drizzle-orm";

import type { AppRequest } from "../types.js";
import type { AuditLogQuery } from "./audit-log.dto.js";

/**
 * Read side of audit_log for the admin viewer. RLS already scopes rows to
 * the active tenant (migration 0008 audit_log_select). Search filter uses
 * accent-insensitive ILIKE against actor.display_name + target_label +
 * resource — matches the FE's mock seam behaviour. If volumes grow, add a
 * GIN tsvector index on (target_label || ' ' || resource); ILIKE on a few
 * thousand rows per tenant is fine for now.
 */

type Row = {
  id: string;
  tenant_id: string;
  at: string;
  action: string;
  resource: string;
  target_id: string | null;
  target_label: string | null;
  actor_user_id: string | null;
  actor_role: string;
  actor_name: string | null;
};

export type AuditLogResponseEntry = {
  id: string;
  tenantId: string;
  at: string;
  actor: { id: string; name: string; role: string };
  action: string;
  resource: string;
  targetLabel?: string;
};

@Injectable()
export class AuditLogService {
  async list(
    req: AppRequest,
    q: AuditLogQuery,
  ): Promise<{ items: AuditLogResponseEntry[]; nextCursor: string | null }> {
    const tx = req.tx as
      | { execute: (qs: unknown) => Promise<{ rows: unknown[] }> }
      | undefined;
    if (!tx) {
      throw new Error("Missing tenant tx (TenantTxInterceptor)");
    }

    // Fetch one extra row to know whether a next page exists.
    const limitPlusOne = q.limit + 1;
    const pattern = q.q ? `%${q.q.toLowerCase()}%` : null;

    const res = (await tx.execute(sql`
      SELECT
        al.id, al.tenant_id, al.at, al.action, al.resource,
        al.target_id, al.target_label, al.actor_user_id, al.actor_role,
        u.display_name AS actor_name
        FROM audit_log al
        LEFT JOIN users u ON u.id = al.actor_user_id
       WHERE 1 = 1
         ${q.before ? sql`AND al.at < ${q.before}::timestamptz` : sql``}
         ${q.action ? sql`AND al.action = ${q.action}` : sql``}
         ${
           pattern
             ? sql`AND (
                 lower(immutable_unaccent(coalesce(u.display_name, ''))) ILIKE immutable_unaccent(${pattern})
                 OR lower(immutable_unaccent(coalesce(al.target_label, ''))) ILIKE immutable_unaccent(${pattern})
                 OR al.resource ILIKE ${pattern}
               )`
             : sql``
         }
       ORDER BY al.at DESC, al.id DESC
       LIMIT ${limitPlusOne}
    `)) as { rows: Row[] };

    const overflow = res.rows.length > q.limit;
    const rows = overflow ? res.rows.slice(0, q.limit) : res.rows;
    const last = rows[rows.length - 1];
    const nextCursor = overflow && last ? toIso(last.at) : null;

    return {
      items: rows.map(rowToEntry),
      nextCursor,
    };
  }
}

function rowToEntry(row: Row): AuditLogResponseEntry {
  const entry: AuditLogResponseEntry = {
    id: row.id,
    tenantId: row.tenant_id,
    at: toIso(row.at),
    actor: {
      id: row.actor_user_id ?? "SYSTEM",
      name: row.actor_name ?? "Hệ thống",
      role: row.actor_role,
    },
    action: row.action,
    resource: row.resource,
  };
  if (row.target_label) entry.targetLabel = row.target_label;
  return entry;
}

function toIso(value: string | Date): string {
  return typeof value === "string" ? value : value.toISOString();
}
