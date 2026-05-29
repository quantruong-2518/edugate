import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { inet } from "./_shared.js";
import { tenants, users } from "./tenants.js";

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().default(sql`gen_uuid_v7()`),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
    actorUserId: uuid("actor_user_id").references(() => users.id),
    actorRole: text("actor_role").notNull(),
    action: text("action").notNull(),
    resource: text("resource").notNull(),
    targetId: uuid("target_id"),
    targetLabel: text("target_label"),
    payload: jsonb("payload").notNull().default(sql`'{}'::jsonb`),
    requestId: text("request_id").notNull(),
    ip: inet("ip"),
    userAgent: text("user_agent"),
  },
  (t) => [
    index("audit_log_tenant_at_idx").on(t.tenantId, t.at.desc()),
    index("audit_log_tenant_action_at_idx").on(t.tenantId, t.action, t.at.desc()),
    index("audit_log_tenant_actor_at_idx").on(t.tenantId, t.actorUserId, t.at.desc()),
  ],
);

export type AuditLogRow = typeof auditLog.$inferSelect;
export type AuditLogInsert = typeof auditLog.$inferInsert;
