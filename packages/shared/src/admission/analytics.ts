import type { ApplicationState } from "./states.js";

/**
 * Application analytics — the payload of GET /v1/admin/applications/analytics.
 * Mirrors what the admin dashboard needs to render its 4 stat cards, the
 * 14-day submissions trend chart, and the approval funnel.
 *
 * Lives in @shared so the FE seam (apps/web/lib/api/admission.ts) and the
 * NestJS service (apps/api/.../admin-analytics.service.ts) consume the same
 * shape — no translation layer at the boundary.
 */

export type AnalyticsPoint = {
  /** ISO date (yyyy-mm-dd) in the tenant's wall clock. */
  date: string;
  count: number;
};

export type FunnelStep = {
  state: ApplicationState;
  count: number;
};

export type ApplicationAnalytics = {
  total: number;
  byState: Record<ApplicationState, number>;
  todaySubmissions: number;
  weekSubmissions: number;
  /** Daily submission counts for the trailing window (oldest first). */
  series: AnalyticsPoint[];
  /** Approval funnel: SUBMITTED → UNDER_REVIEW → APPROVED → CONFIRMED → ENROLLED. */
  funnel: FunnelStep[];
  /**
   * Resolved date window the BE computed for this response (echoes the
   * caller's `from`/`to` filter, or the all-time bounds when unset). Optional
   * — early BE versions before range support omit it.
   */
  range?: { from: string; to: string };
};

/** Funnel state order used by both BE aggregation and FE chart rendering. */
export const FUNNEL_ORDER: readonly ApplicationState[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "CONFIRMED",
  "ENROLLED",
];

/** Trailing-window size for the daily submissions series. */
export const ANALYTICS_SERIES_DAYS = 14;

/** Build a zero-filled byState record so FE consumers never see undefined. */
export function emptyByState(): Record<ApplicationState, number> {
  return {
    DRAFT: 0,
    SUBMITTED: 0,
    UNDER_REVIEW: 0,
    NEEDS_INFO: 0,
    APPROVED: 0,
    REJECTED: 0,
    CONFIRMED: 0,
    ENROLLED: 0,
    CANCELLED: 0,
    EXPIRED: 0,
  };
}
