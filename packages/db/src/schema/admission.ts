import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { tenants, users } from "./tenants.js";

export const formTemplates = pgTable(
  "form_templates",
  {
    id: uuid("id").primaryKey().default(sql`gen_uuid_v7()`),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    code: text("code").notNull(),
    version: integer("version").notNull().default(1),
    status: text("status").notNull().default("draft"),
    schema: jsonb("schema").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique().on(t.tenantId, t.code, t.version),
    index("form_templates_published_idx")
      .on(t.tenantId, t.code, t.version.desc())
      .where(sql`${t.status} = 'published'`),
  ],
);

export const admissionCampaigns = pgTable(
  "admission_campaigns",
  {
    id: uuid("id").primaryKey().default(sql`gen_uuid_v7()`),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    code: text("code").notNull(),
    name: text("name").notNull(),
    opensAt: timestamp("opens_at", { withTimezone: true }).notNull(),
    closesAt: timestamp("closes_at", { withTimezone: true }).notNull(),
    formTemplateId: uuid("form_template_id")
      .notNull()
      .references(() => formTemplates.id),
    status: text("status").notNull().default("scheduled"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    unique().on(t.tenantId, t.code),
    index("campaigns_tenant_window_idx")
      .on(t.tenantId, t.opensAt, t.closesAt)
      .where(sql`${t.deletedAt} IS NULL`),
  ],
);

export const applications = pgTable(
  "applications",
  {
    id: uuid("id").primaryKey().default(sql`gen_uuid_v7()`),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => admissionCampaigns.id),
    code: text("code").notNull(),
    state: text("state").notNull(),
    applicant: jsonb("applicant").notNull(),
    formData: jsonb("form_data").notNull(),
    formTemplateId: uuid("form_template_id")
      .notNull()
      .references(() => formTemplates.id),
    formTemplateVersion: integer("form_template_version").notNull(),
    internalNotes: text("internal_notes"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    decidedByUserId: uuid("decided_by_user_id").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    unique().on(t.tenantId, t.code),
    index("applications_tenant_state_created_idx")
      .on(t.tenantId, t.state, t.createdAt.desc())
      .where(sql`${t.deletedAt} IS NULL`),
    index("applications_tenant_code_idx")
      .on(t.tenantId, t.code)
      .where(sql`${t.deletedAt} IS NULL`),
  ],
);

export const applicationHistory = pgTable(
  "application_history",
  {
    id: uuid("id").primaryKey().default(sql`gen_uuid_v7()`),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "restrict" }),
    state: text("state").notNull(),
    byUserId: uuid("by_user_id").references(() => users.id),
    byRole: text("by_role").notNull(),
    note: text("note"),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("application_history_app_at_idx").on(t.applicationId, t.at),
    index("application_history_tenant_at_idx").on(t.tenantId, t.at.desc()),
  ],
);

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().default(sql`gen_uuid_v7()`),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id),
    reviewerId: uuid("reviewer_id")
      .notNull()
      .references(() => users.id),
    verdict: text("verdict").notNull(),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique().on(t.applicationId, t.reviewerId, t.createdAt),
    index("reviews_app_idx").on(t.applicationId),
  ],
);

export const notificationTemplates = pgTable(
  "notification_templates",
  {
    id: uuid("id").primaryKey().default(sql`gen_uuid_v7()`),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    kind: text("kind").notNull(),
    channel: text("channel").notNull(),
    subject: text("subject").notNull(),
    body: text("body").notNull(),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
);

export type ApplicationRow = typeof applications.$inferSelect;
export type ApplicationInsert = typeof applications.$inferInsert;
export type ApplicationHistoryRow = typeof applicationHistory.$inferSelect;
export type ApplicationHistoryInsert = typeof applicationHistory.$inferInsert;
export type FormTemplateRow = typeof formTemplates.$inferSelect;
export type AdmissionCampaignRow = typeof admissionCampaigns.$inferSelect;
