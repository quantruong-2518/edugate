import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { citext } from "./_shared.js";

export const tenants = pgTable(
  "tenants",
  {
    id: uuid("id").primaryKey().default(sql`gen_uuid_v7()`),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    shortName: text("short_name").notNull(),
    logoUrl: text("logo_url"),
    theme: jsonb("theme").notNull().default(sql`'{}'::jsonb`),
    modules: text("modules")
      .array()
      .notNull()
      .default(sql`ARRAY['admission','platform']::TEXT[]`),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    index("tenants_code_active_idx")
      .on(t.code)
      .where(sql`${t.deletedAt} IS NULL`),
  ],
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().default(sql`gen_uuid_v7()`),
    email: citext("email").notNull(),
    passwordHash: text("password_hash"),
    status: text("status").notNull().default("pending"),
    displayName: text("display_name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("users_email_active_idx")
      .on(t.email)
      .where(sql`${t.deletedAt} IS NULL`),
  ],
);

export const tenantUsers = pgTable(
  "tenant_users",
  {
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    roles: text("roles").array().notNull(),
    status: text("status").notNull().default("active"),
    invitedAt: timestamp("invited_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    activatedAt: timestamp("activated_at", { withTimezone: true }),
  },
  (t) => [
    primaryKey({ columns: [t.tenantId, t.userId] }),
    index("tenant_users_user_idx").on(t.userId),
  ],
);

export type TenantRow = typeof tenants.$inferSelect;
export type UserRow = typeof users.$inferSelect;
export type TenantUserRow = typeof tenantUsers.$inferSelect;
