import { sql } from "drizzle-orm";
import { jsonb, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";

import { tenants, users } from "./tenants.js";

export const tenantConfigs = pgTable("tenant_configs", {
  tenantId: uuid("tenant_id")
    .primaryKey()
    .references(() => tenants.id),
  landing: jsonb("landing")
    .notNull()
    .default(sql`'{"sections":[]}'::jsonb`),
  flags: jsonb("flags").notNull().default(sql`'{}'::jsonb`),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedBy: uuid("updated_by").references(() => users.id),
});

export type TenantConfigRow = typeof tenantConfigs.$inferSelect;
