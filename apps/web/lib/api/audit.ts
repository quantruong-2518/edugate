import type { AuditLogEntry, AuditLogFilters } from "@shared/audit";

/**
 * Audit log API seam. Pha 1 returns in-memory fixtures (read-only — there is no
 * client-side mutation, unlike the localStorage-backed admission store). Pha 2
 * swaps the body for `GET /audit-log` with the same `(tenantCode, filters)`
 * signature; the BE writes entries via a mutation interceptor and scopes rows
 * by tenant via RLS. This stays the single swap point.
 */

const MOCK_LATENCY_MS = 250;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_LATENCY_MS));
}

/** Demo events for `cva-edu`, newest first. Pha 2: real rows from the DB. */
const MOCK_AUDIT: readonly AuditLogEntry[] = [
  {
    id: "a-30",
    tenantId: "cva-edu",
    at: "2026-05-21T08:42:00+07:00",
    actor: { id: "u-admin", name: "Nguyễn Quản Trị", role: "TENANT_ADMIN" },
    action: "settings_update",
    resource: "tenant_config",
    targetLabel: "Giao diện & trang tuyển sinh",
  },
  {
    id: "a-29",
    tenantId: "cva-edu",
    at: "2026-05-21T08:15:00+07:00",
    actor: { id: "u-reviewer-1", name: "Trần Thị Duyệt", role: "REVIEWER" },
    action: "approve",
    resource: "application",
    targetLabel: "CVA-26-7K3QF2",
  },
  {
    id: "a-28",
    tenantId: "cva-edu",
    at: "2026-05-21T07:58:00+07:00",
    actor: { id: "u-reviewer-1", name: "Trần Thị Duyệt", role: "REVIEWER" },
    action: "reject",
    resource: "application",
    targetLabel: "CVA-26-9XB4M1",
  },
  {
    id: "a-27",
    tenantId: "cva-edu",
    at: "2026-05-20T17:30:00+07:00",
    actor: { id: "u-admin", name: "Nguyễn Quản Trị", role: "TENANT_ADMIN" },
    action: "export",
    resource: "application",
    targetLabel: "Hồ sơ đợt tuyển sinh 2026",
  },
  {
    id: "a-26",
    tenantId: "cva-edu",
    at: "2026-05-20T16:05:00+07:00",
    actor: { id: "u-reviewer-2", name: "Lê Văn Xét", role: "REVIEWER" },
    action: "state_change",
    resource: "application",
    targetLabel: "CVA-26-3RT8K5 → Cần bổ sung",
  },
  {
    id: "a-25",
    tenantId: "cva-edu",
    at: "2026-05-20T15:40:00+07:00",
    actor: { id: "u-admin", name: "Nguyễn Quản Trị", role: "TENANT_ADMIN" },
    action: "create",
    resource: "campaign",
    targetLabel: "Đợt tuyển sinh lớp 6 — 2026",
  },
  {
    id: "a-24",
    tenantId: "cva-edu",
    at: "2026-05-20T14:12:00+07:00",
    actor: { id: "u-admin", name: "Nguyễn Quản Trị", role: "TENANT_ADMIN" },
    action: "update",
    resource: "form_template",
    targetLabel: "Biểu mẫu hồ sơ lớp 6",
  },
  {
    id: "a-23",
    tenantId: "cva-edu",
    at: "2026-05-20T09:03:00+07:00",
    actor: { id: "u-reviewer-1", name: "Trần Thị Duyệt", role: "REVIEWER" },
    action: "login",
    resource: "auth",
  },
  {
    id: "a-22",
    tenantId: "cva-edu",
    at: "2026-05-19T18:22:00+07:00",
    actor: { id: "u-admin", name: "Nguyễn Quản Trị", role: "TENANT_ADMIN" },
    action: "create",
    resource: "tenant_user",
    targetLabel: "Lê Văn Xét (Cán bộ duyệt)",
  },
  {
    id: "a-21",
    tenantId: "cva-edu",
    at: "2026-05-19T11:47:00+07:00",
    actor: { id: "u-reviewer-2", name: "Lê Văn Xét", role: "REVIEWER" },
    action: "approve",
    resource: "application",
    targetLabel: "CVA-26-2HN6P0",
  },
  {
    id: "a-20",
    tenantId: "cva-edu",
    at: "2026-05-19T10:30:00+07:00",
    actor: { id: "u-admin", name: "Nguyễn Quản Trị", role: "TENANT_ADMIN" },
    action: "delete",
    resource: "campaign",
    targetLabel: "Đợt thử nghiệm (nháp)",
  },
  {
    id: "a-19",
    tenantId: "cva-edu",
    at: "2026-05-18T16:10:00+07:00",
    actor: { id: "u-admin", name: "Nguyễn Quản Trị", role: "TENANT_ADMIN" },
    action: "login",
    resource: "auth",
  },
];

function normalize(value: string): string {
  // Strip Vietnamese diacritics so search is accent-insensitive.
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export async function getAuditLog(
  tenantCode: string,
  filters: AuditLogFilters = {},
): Promise<AuditLogEntry[]> {
  const q = filters.q?.trim() ? normalize(filters.q.trim()) : null;

  const entries = MOCK_AUDIT.filter((entry) => {
    if (entry.tenantId !== tenantCode) return false;
    if (filters.action && entry.action !== filters.action) return false;
    if (q) {
      const haystack = normalize(
        `${entry.actor.name} ${entry.targetLabel ?? ""} ${entry.resource}`,
      );
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  return delay(entries);
}
