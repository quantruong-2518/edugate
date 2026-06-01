import type { AuditLogEntry, AuditLogFilters } from "@shared/audit";

import { http } from "./http";

/**
 * GET /v1/admin/audit-log. Tenant scope flows via the `x-tenant-code` header
 * (RLS does the actual isolation). The BE returns `{ items, nextCursor }` for
 * keyset pagination; pha 1 admin viewer only needs the first page so we unwrap
 * to a flat array.
 */
export async function getAuditLog(
  tenantCode: string,
  filters: AuditLogFilters,
): Promise<AuditLogEntry[]> {
  const params: Record<string, string> = {};
  if (filters.action) params.action = filters.action;
  const trimmed = filters.q?.trim();
  if (trimmed) params.q = trimmed;

  const { data } = await http.get<{
    items: AuditLogEntry[];
    nextCursor: string | null;
  }>("/v1/admin/audit-log", {
    headers: { "x-tenant-code": tenantCode },
    params,
  });
  return data.items;
}
