import { sql } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { citext } from "./_shared.js";
import { tenants, users } from "./tenants.js";

export const otpCodes = pgTable(
  "otp_codes",
  {
    id: uuid("id").primaryKey().default(sql`gen_uuid_v7()`),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    email: citext("email").notNull(),
    codeHash: text("code_hash").notNull(),
    purpose: text("purpose").notNull().default("application"),
    attempts: integer("attempts").notNull().default(0),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("otp_codes_tenant_email_active_idx")
      .on(t.tenantId, t.email, t.expiresAt)
      .where(sql`${t.consumedAt} IS NULL`),
  ],
);

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").primaryKey().default(sql`gen_uuid_v7()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    tokenHash: text("token_hash").notNull(),
    purpose: text("purpose").notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("prt_user_active_idx")
      .on(t.userId, t.expiresAt)
      .where(sql`${t.usedAt} IS NULL`),
  ],
);

export type OtpCodeRow = typeof otpCodes.$inferSelect;
export type OtpCodeInsert = typeof otpCodes.$inferInsert;
