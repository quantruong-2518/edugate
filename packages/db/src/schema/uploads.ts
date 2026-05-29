import { sql } from "drizzle-orm";
import {
  bigint,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { applications } from "./admission.js";
import { tenants, users } from "./tenants.js";

export const uploads = pgTable(
  "uploads",
  {
    id: uuid("id").primaryKey().default(sql`gen_uuid_v7()`),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    ownerUserId: uuid("owner_user_id").references(() => users.id),
    ownerAppId: uuid("owner_app_id").references(() => applications.id),
    bucket: text("bucket").notNull(),
    objectKey: text("object_key").notNull(),
    mime: text("mime").notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    sha256: text("sha256").notNull(),
    status: text("status").notNull().default("uploaded"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("uploads_app_idx").on(t.ownerAppId),
    index("uploads_tenant_status_idx").on(t.tenantId, t.status),
  ],
);

export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").primaryKey().default(sql`gen_uuid_v7()`),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    kind: text("kind").notNull(),
    status: text("status").notNull().default("queued"),
    payload: jsonb("payload").notNull().default(sql`'{}'::jsonb`),
    result: jsonb("result"),
    error: text("error"),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (t) => [index("jobs_tenant_status_idx").on(t.tenantId, t.status)],
);

export type UploadRow = typeof uploads.$inferSelect;
export type JobRow = typeof jobs.$inferSelect;
