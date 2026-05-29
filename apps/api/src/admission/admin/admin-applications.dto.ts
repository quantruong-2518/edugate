import { z } from "zod";

/**
 * Query schema for `GET /v1/admin/applications`. Mirrors the FE's
 * `ListApplicationsInput` so the call site doesn't need to translate.
 * Every filter is optional; the service layer composes them into a single
 * parameterised SQL statement.
 */

const STATES = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "NEEDS_INFO",
  "APPROVED",
  "REJECTED",
  "CONFIRMED",
  "ENROLLED",
  "CANCELLED",
  "EXPIRED",
] as const;

export const listApplicationsQuerySchema = z.object({
  search: z.string().optional(),
  /** Comma-joined list of states (URL-friendly). */
  states: z.string().optional(),
  dateFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "dateFrom phải dạng YYYY-MM-DD.")
    .optional(),
  dateTo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "dateTo phải dạng YYYY-MM-DD.")
    .optional(),
  scoreMin: z.coerce.number().optional(),
  scoreMax: z.coerce.number().optional(),
  sort: z
    .enum(["createdAt:desc", "createdAt:asc", "score:desc", "score:asc"])
    .default("createdAt:desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export type ListApplicationsQuery = z.infer<typeof listApplicationsQuerySchema>;

export function parseStates(raw: string | undefined): readonly string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => (STATES as readonly string[]).includes(s));
}
