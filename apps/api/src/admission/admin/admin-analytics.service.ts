import { Injectable } from "@nestjs/common";
import { sql, type SQL } from "drizzle-orm";

import {
  ANALYTICS_SERIES_DAYS,
  emptyByState,
  FUNNEL_ORDER,
  type AnalyticsPoint,
  type ApplicationAnalytics,
  type ApplicationState,
  type FunnelStep,
} from "shared/admission";

import type { AppRequest } from "../../common/types.js";

/**
 * Dashboard analytics for the admin homepage.
 *
 * Three round-trips, all scoped by RLS via TenantTxInterceptor:
 *   - totals + state breakdown + today/week submission counters from
 *     `applications` (today/week always anchored to "now", not the range),
 *   - daily series — when the caller passes a range, bucket every day in
 *     [from, to]; otherwise fall back to the trailing ANALYTICS_SERIES_DAYS,
 *   - approval funnel from `application_history` (an application "passed
 *     through" a state if there's a history row for it in that state,
 *     regardless of where it sits now).
 *
 * The response echoes the resolved `range` so the dashboard can anchor its
 * "30 days / 90 days" presets to the latest day with data instead of the
 * client's clock, which can drift across timezones.
 */

const TZ = "Asia/Ho_Chi_Minh";

type StatsRow = {
  total: string | number;
  today_count: string | number;
  week_count: string | number;
  by_state: Record<string, string | number> | null;
  range_from: string | null;
  range_to: string | null;
};

type RangeInput = { from?: string; to?: string };

@Injectable()
export class AdminAnalyticsService {
  async overview(
    req: AppRequest,
    range: RangeInput = {},
  ): Promise<ApplicationAnalytics> {
    const tx = req.tx as
      | { execute: (q: unknown) => Promise<{ rows: unknown[] }> }
      | undefined;
    if (!tx) {
      throw new Error("Missing tenant tx (TenantTxInterceptor)");
    }

    // Build a reusable predicate that constrains `created_at` to the caller's
    // window in the tenant's wall clock. Each side is optional; when both are
    // unset the predicate degenerates to TRUE so callers can stay range-free.
    const rangePredicate = (column: string): SQL =>
      buildRangePredicate(column, range);

    const statsRes = (await tx.execute(sql`
      SELECT
        COUNT(*)::bigint AS total,
        COUNT(*) FILTER (
          WHERE created_at >= date_trunc('day', now() AT TIME ZONE ${TZ})
        )::bigint AS today_count,
        COUNT(*) FILTER (
          WHERE created_at >= now() - INTERVAL '7 days'
        )::bigint AS week_count,
        COALESCE(
          (
            SELECT jsonb_object_agg(state, cnt)
              FROM (
                SELECT state, COUNT(*)::bigint AS cnt
                  FROM applications
                 WHERE deleted_at IS NULL
                   AND ${rangePredicate("created_at")}
                 GROUP BY state
              ) s
          ),
          '{}'::jsonb
        ) AS by_state,
        to_char(MIN(created_at) AT TIME ZONE ${TZ}, 'YYYY-MM-DD') AS range_from,
        to_char(MAX(created_at) AT TIME ZONE ${TZ}, 'YYYY-MM-DD') AS range_to
        FROM applications
       WHERE deleted_at IS NULL
         AND ${rangePredicate("created_at")}
    `)) as { rows: StatsRow[] };
    const stats = statsRes.rows[0] ?? {
      total: 0,
      today_count: 0,
      week_count: 0,
      by_state: {},
      range_from: null,
      range_to: null,
    };

    const seriesRes = (await tx.execute(buildSeriesQuery(range))) as {
      rows: Array<{ date: string; count: string | number }>;
    };

    const funnelRes = (await tx.execute(sql`
      SELECT state, COUNT(DISTINCT application_id)::bigint AS cnt
        FROM application_history
       WHERE state IN (${sql.join(
         FUNNEL_ORDER.map((s) => sql`${s}`),
         sql`, `,
       )})
         AND ${buildRangePredicate("at", range)}
       GROUP BY state
    `)) as { rows: Array<{ state: string; cnt: string | number }> };
    const funnelMap = new Map<string, number>(
      funnelRes.rows.map((r) => [r.state, Number(r.cnt)]),
    );

    const byState = emptyByState();
    for (const [stateRaw, cntRaw] of Object.entries(stats.by_state ?? {})) {
      if (stateRaw in byState) {
        byState[stateRaw as ApplicationState] = Number(cntRaw);
      }
    }

    const series: AnalyticsPoint[] = seriesRes.rows.map((r) => ({
      date: r.date,
      count: Number(r.count),
    }));

    const funnel: FunnelStep[] = FUNNEL_ORDER.map((state) => ({
      state,
      count: funnelMap.get(state) ?? 0,
    }));

    const resolvedRange = resolveRange(range, stats, series);

    return {
      total: Number(stats.total),
      byState,
      todaySubmissions: Number(stats.today_count),
      weekSubmissions: Number(stats.week_count),
      series,
      funnel,
      ...(resolvedRange ? { range: resolvedRange } : {}),
    };
  }
}

/**
 * Build a `created_at` (or `at`) predicate in the tenant timezone. The bounds
 * are local-date inclusive: `from` opens at midnight TZ, `to` closes at
 * midnight TZ the day after. Returns `TRUE` when neither bound is set.
 */
function buildRangePredicate(column: string, range: RangeInput): SQL {
  const col = sql.raw(column);
  if (range.from && range.to) {
    return sql`(${col} AT TIME ZONE ${TZ})::date BETWEEN ${range.from}::date AND ${range.to}::date`;
  }
  if (range.from) {
    return sql`(${col} AT TIME ZONE ${TZ})::date >= ${range.from}::date`;
  }
  if (range.to) {
    return sql`(${col} AT TIME ZONE ${TZ})::date <= ${range.to}::date`;
  }
  return sql`TRUE`;
}

/**
 * Daily submissions, bucketed against `generate_series` so empty days surface
 * as zeros. With a range we render every day in [from, to]; without one we
 * keep the legacy ANALYTICS_SERIES_DAYS trailing window.
 */
function buildSeriesQuery(range: RangeInput): SQL {
  if (range.from || range.to) {
    const fromDay = range.from
      ? sql`${range.from}::date`
      : sql`COALESCE(
          (SELECT MIN((created_at AT TIME ZONE ${TZ})::date) FROM applications WHERE deleted_at IS NULL),
          ${range.to}::date
        )`;
    const toDay = range.to
      ? sql`${range.to}::date`
      : sql`(now() AT TIME ZONE ${TZ})::date`;

    return sql`
      WITH bucket AS (
        SELECT gs::date AS day
          FROM generate_series(${fromDay}, ${toDay}, INTERVAL '1 day') AS gs
      ),
      counts AS (
        SELECT (created_at AT TIME ZONE ${TZ})::date AS day, COUNT(*)::bigint AS cnt
          FROM applications
         WHERE deleted_at IS NULL
           AND ${buildRangePredicate("created_at", range)}
         GROUP BY 1
      )
      SELECT to_char(b.day, 'YYYY-MM-DD') AS date,
             COALESCE(c.cnt, 0)::bigint AS count
        FROM bucket b
        LEFT JOIN counts c ON c.day = b.day
       ORDER BY b.day
    `;
  }
  return sql`
    WITH bucket AS (
      SELECT gs::date AS day
        FROM generate_series(
          (now() AT TIME ZONE ${TZ})::timestamp - INTERVAL '${sql.raw(String(ANALYTICS_SERIES_DAYS - 1))} days',
          (now() AT TIME ZONE ${TZ})::timestamp,
          INTERVAL '1 day'
        ) AS gs
    ),
    counts AS (
      SELECT (created_at AT TIME ZONE ${TZ})::date AS day, COUNT(*)::bigint AS cnt
        FROM applications
       WHERE deleted_at IS NULL
         AND created_at >= now() - INTERVAL '${sql.raw(String(ANALYTICS_SERIES_DAYS))} days'
       GROUP BY 1
    )
    SELECT to_char(b.day, 'YYYY-MM-DD') AS date,
           COALESCE(c.cnt, 0)::bigint AS count
      FROM bucket b
      LEFT JOIN counts c ON c.day = b.day
     ORDER BY b.day
  `;
}

/**
 * Compute the window the BE actually used. Caller-supplied bounds win; for the
 * unbounded sides we report the min/max we observed (so the dashboard can
 * anchor its preset shortcuts to real data, not the client's clock). Returns
 * `null` when the tenant has no rows AND the caller passed no bounds — we
 * have nothing meaningful to echo.
 */
function resolveRange(
  range: RangeInput,
  stats: StatsRow,
  series: AnalyticsPoint[],
): { from: string; to: string } | null {
  const from = range.from ?? stats.range_from ?? series[0]?.date ?? null;
  const to =
    range.to ?? stats.range_to ?? series[series.length - 1]?.date ?? null;
  if (!from || !to) return null;
  return { from, to };
}
