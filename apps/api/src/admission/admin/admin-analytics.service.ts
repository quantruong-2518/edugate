import { Injectable } from "@nestjs/common";
import { sql } from "drizzle-orm";

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
 * Dashboard analytics for the admin homepage. One round-trip:
 *   - totals + state breakdown + today/week submission counters from
 *     `applications`,
 *   - 14-day daily series (left-joined against generate_series so empty days
 *     render as zero, not gaps),
 *   - approval funnel counts derived from `application_history` (an
 *     application "passed through" a state if there's a history row for it
 *     in that state, regardless of where it sits now).
 *
 * All scoped by RLS via TenantTxInterceptor — no manual tenant_id filter.
 */

const TZ = "Asia/Ho_Chi_Minh";

type StatsRow = {
  total: string | number;
  today_count: string | number;
  week_count: string | number;
  by_state: Record<string, string | number> | null;
};

@Injectable()
export class AdminAnalyticsService {
  async overview(req: AppRequest): Promise<ApplicationAnalytics> {
    const tx = req.tx as
      | { execute: (q: unknown) => Promise<{ rows: unknown[] }> }
      | undefined;
    if (!tx) {
      throw new Error("Missing tenant tx (TenantTxInterceptor)");
    }

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
                 GROUP BY state
              ) s
          ),
          '{}'::jsonb
        ) AS by_state
        FROM applications
       WHERE deleted_at IS NULL
    `)) as { rows: StatsRow[] };
    const stats = statsRes.rows[0] ?? {
      total: 0,
      today_count: 0,
      week_count: 0,
      by_state: {},
    };

    const seriesRes = (await tx.execute(sql`
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
    `)) as { rows: Array<{ date: string; count: string | number }> };

    const funnelRes = (await tx.execute(sql`
      SELECT state, COUNT(DISTINCT application_id)::bigint AS cnt
        FROM application_history
       WHERE state IN (${sql.join(
         FUNNEL_ORDER.map((s) => sql`${s}`),
         sql`, `,
       )})
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

    return {
      total: Number(stats.total),
      byState,
      todaySubmissions: Number(stats.today_count),
      weekSubmissions: Number(stats.week_count),
      series,
      funnel,
    };
  }
}
