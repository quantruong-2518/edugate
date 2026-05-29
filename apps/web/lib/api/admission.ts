import axios from "axios";

import {
  type Applicant,
  type Application,
  type ApplicationCode,
  type ApplicationState,
} from "@shared/admission";

import {
  generateApplications,
  REFERENCE_DATE,
} from "./mock-applications";
import { http } from "./http";

/**
 * Admission API seam. The 4 public flows below talk to the NestJS API via
 * `http` (axios) — base URL from `NEXT_PUBLIC_API_URL`, `x-tenant-code`
 * header set by the request interceptor. The seam preserves signatures so
 * the TanStack Query hooks in `queries.ts` and every call site stayed
 * unchanged across the swap (the one exception is `otpToken`, which the
 * wizard now threads from verify → submit per API_SPEC §3.3 + §3.1).
 *
 * Management endpoints (`listApplications`, `getApplicationAnalytics`,
 * notifications) are still mock-backed until the corresponding NestJS
 * routes land in Day 6+.
 */

export type CreateApplicationInput = {
  tenantCode: string;
  applicant: Applicant;
  formData: Record<string, unknown>;
  campaignId?: string;
  /** Single-use token from POST /v1/applications/otp/verify. */
  otpToken: string;
};

export type SendEmailOtpInput = {
  email: string;
};

export type SendEmailOtpResult = {
  sent: true;
  expiresAt: string;
  /** Dev-only: the issued code so the UI can self-serve a demo without SMTP. */
  devCode?: string;
};

export type VerifyEmailOtpInput = {
  email: string;
  code: string;
};

export type VerifyEmailOtpResult = {
  verified: boolean;
  /** Single-use token to hand to POST /v1/applications. Empty when verify failed. */
  otpToken: string;
  expiresAt: string;
};

type CreateApplicationResponse = {
  code: string;
  state: ApplicationState;
  createdAt: string;
};

type GetApplicationResponse = {
  code: string;
  state: ApplicationState;
  applicant: Applicant;
  formData: Record<string, unknown>;
  history: Array<{
    state: ApplicationState;
    at: string;
    byRole: string | null;
    note: string | null;
  }>;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
};

/**
 * Submit a new application. The API returns a thin acknowledgement; we
 * project it into the FE `Application` shape using the fields the caller
 * already had so consumers (confirmation page, TanStack Query cache seed)
 * don't need a second round-trip.
 */
export async function createApplication(
  input: CreateApplicationInput,
): Promise<Application> {
  const { data } = await http.post<CreateApplicationResponse>("/v1/applications", {
    campaignId: input.campaignId,
    applicant: input.applicant,
    formData: input.formData,
    otpToken: input.otpToken,
  });
  return {
    code: data.code,
    tenantCode: input.tenantCode,
    campaignId: input.campaignId,
    state: data.state,
    applicant: input.applicant,
    formData: input.formData,
    history: [{ state: data.state, at: data.createdAt }],
    createdAt: data.createdAt,
    updatedAt: data.createdAt,
  };
}

export async function getApplicationByCode(
  code: ApplicationCode,
): Promise<Application | null> {
  try {
    const { data } = await http.get<GetApplicationResponse>(
      `/v1/applications/by-code/${encodeURIComponent(code.trim().toUpperCase())}`,
    );
    // Cross-tenant codes return 404 via RLS; non-404 errors fall through to
    // the catch and bubble up so the caller's error UI fires.
    const tenantCode = readTenantCodeFromUrl();
    return {
      code: data.code,
      tenantCode,
      state: data.state,
      applicant: data.applicant,
      formData: data.formData,
      history: data.history.map((h) => ({
        state: h.state,
        at: h.at,
        ...(h.note !== null ? { note: h.note } : {}),
      })),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      return null;
    }
    throw err;
  }
}

export async function sendEmailOtp(
  input: SendEmailOtpInput,
): Promise<SendEmailOtpResult> {
  const { data } = await http.post<SendEmailOtpResult>(
    "/v1/applications/otp/send",
    { email: input.email },
  );
  return data;
}

export async function verifyEmailOtp(
  input: VerifyEmailOtpInput,
): Promise<VerifyEmailOtpResult> {
  try {
    const { data } = await http.post<VerifyEmailOtpResult>(
      "/v1/applications/otp/verify",
      { email: input.email, code: input.code },
    );
    return data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 400) {
      // Wrong code or expired — surface a "not verified" result rather than
      // throwing so the form UI can show a normal validation message.
      return { verified: false, otpToken: "", expiresAt: "" };
    }
    throw err;
  }
}

function readTenantCodeFromUrl(): string {
  if (typeof window === "undefined") return "";
  // The seam runs client-side after the wizard renders, so the URL is real.
  const host = window.location.host;
  const subdomain = host.split(".")[0];
  if (subdomain && subdomain !== "localhost" && subdomain !== "127") {
    return subdomain;
  }
  const m = window.location.pathname.match(/^\/t\/([^/]+)/);
  return m?.[1] ?? "";
}

/** Simulated network latency for the mock-backed management endpoints below. */
const MOCK_LATENCY_MS = 250;
function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) =>
    setTimeout(() => resolve(value), MOCK_LATENCY_MS),
  );
}

// ---------------------------------------------------------------------------
// Management seam: list / analytics / notifications.
//
// These power the admin dashboard (task: admission management). Pha 1 reads
// from the deterministic seeded generator; pha 2 swaps each body for a real
// `GET /applications`, `GET /applications/analytics`, `GET /notifications`
// keeping these signatures. The per-tenant dataset is memoized so repeated
// calls within a session don't re-generate.
// ---------------------------------------------------------------------------

const datasetCache = new Map<string, Application[]>();

function datasetFor(tenantCode: string): Application[] {
  const key = tenantCode || "default";
  let rows = datasetCache.get(key);
  if (!rows) {
    rows = generateApplications(key);
    datasetCache.set(key, rows);
  }
  return rows;
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

/** Numeric score used for the "score" column / range filter (the gpa field). */
export function applicationScore(application: Application): number | null {
  const gpa = application.formData["gpa"];
  return typeof gpa === "number" ? gpa : null;
}

/**
 * Student name, resolved in priority order so every tenant's flow surfaces a
 * non-"—" name where one exists:
 *   1. `applicant.studentFullName` — tenants that collect the name up-front
 *      on the wizard's applicant step (e.g. NGT).
 *   2. `form_data.student.name` — the studentLookup field's resolved record.
 *   3. `form_data.studentName` — legacy flat text field (CVA seed).
 * Matches the GIN index in migration 0012 so admin search and the visible
 * column agree on what counts as "the student name".
 */
export function studentNameOf(application: Application): string {
  const fromApplicant = application.applicant.studentFullName;
  if (typeof fromApplicant === "string" && fromApplicant.trim()) {
    return fromApplicant;
  }
  const lookup = application.formData["student"];
  if (lookup && typeof lookup === "object") {
    const name = (lookup as { name?: unknown }).name;
    if (typeof name === "string" && name.trim()) return name;
  }
  const flat = application.formData["studentName"];
  if (typeof flat === "string" && flat.trim()) return flat;
  return "—";
}

export type ApplicationSort =
  | "createdAt:desc"
  | "createdAt:asc"
  | "score:desc"
  | "score:asc";

export type ListApplicationsInput = {
  tenantCode: string;
  search?: string;
  states?: readonly ApplicationState[];
  /** ISO date (yyyy-mm-dd) inclusive lower bound on createdAt. */
  dateFrom?: string;
  /** ISO date (yyyy-mm-dd) inclusive upper bound on createdAt. */
  dateTo?: string;
  scoreMin?: number;
  scoreMax?: number;
  sort?: ApplicationSort;
  page?: number;
  pageSize?: number;
};

export type ListApplicationsResult = {
  items: Application[];
  total: number;
  page: number;
  pageSize: number;
};

export async function listApplications(
  input: ListApplicationsInput,
): Promise<ListApplicationsResult> {
  const {
    tenantCode,
    search,
    states,
    dateFrom,
    dateTo,
    scoreMin,
    scoreMax,
    sort = "createdAt:desc",
    page = 1,
    pageSize = 10,
  } = input;

  // BE filtering + sort + pagination via GIN search index + tenant-scoped
  // tx (RLS). `tenantCode` is sent as an HTTP header by the axios
  // interceptor, not as a query param, so it is omitted here.
  const { data } = await http.get<{
    items: Application[];
    total: number;
    page: number;
    pageSize: number;
  }>("/v1/admin/applications", {
    headers: { "x-tenant-code": tenantCode },
    params: {
      ...(search?.trim() ? { search: search.trim() } : {}),
      ...(states && states.length > 0 ? { states: states.join(",") } : {}),
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo ? { dateTo } : {}),
      ...(scoreMin !== undefined ? { scoreMin } : {}),
      ...(scoreMax !== undefined ? { scoreMax } : {}),
      sort,
      page,
      pageSize,
    },
  });

  return data;
}

function sortApplications(
  rows: Application[],
  sort: ApplicationSort,
): Application[] {
  const sorted = [...rows];
  switch (sort) {
    case "createdAt:asc":
      sorted.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
      break;
    case "score:desc":
      sorted.sort(
        (a, b) => (applicationScore(b) ?? -1) - (applicationScore(a) ?? -1),
      );
      break;
    case "score:asc":
      sorted.sort(
        (a, b) => (applicationScore(a) ?? Infinity) - (applicationScore(b) ?? Infinity),
      );
      break;
    case "createdAt:desc":
    default:
      sorted.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      break;
  }
  return sorted;
}

export type AnalyticsPoint = {
  /** ISO date (yyyy-mm-dd). */
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
  /** Approval funnel (submitted → reviewed → approved → confirmed → enrolled). */
  funnel: FunnelStep[];
};

const SERIES_DAYS = 14;

const FUNNEL_ORDER: readonly ApplicationState[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "CONFIRMED",
  "ENROLLED",
];

function emptyByState(): Record<ApplicationState, number> {
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

function dateKey(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export async function getApplicationAnalytics(
  tenantCode: string,
): Promise<ApplicationAnalytics> {
  const rows = datasetFor(tenantCode);
  const byState = emptyByState();

  const now = REFERENCE_DATE;
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(startOfToday.getTime() - 6 * 86_400_000);

  let todaySubmissions = 0;
  let weekSubmissions = 0;

  // Seed the trailing-window buckets so days with no submissions render as 0.
  const buckets = new Map<string, number>();
  for (let i = SERIES_DAYS - 1; i >= 0; i -= 1) {
    buckets.set(dateKey(startOfToday.getTime() - i * 86_400_000), 0);
  }

  for (const app of rows) {
    byState[app.state] += 1;
    const createdMs = new Date(app.createdAt).getTime();
    if (createdMs >= startOfToday.getTime()) todaySubmissions += 1;
    if (createdMs >= startOfWeek.getTime()) weekSubmissions += 1;
    const key = dateKey(createdMs);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  const series: AnalyticsPoint[] = Array.from(buckets.entries()).map(
    ([date, count]) => ({ date, count }),
  );

  // Funnel: each step counts applications that reached at least that state
  // (i.e. passed through it on their way to the current state).
  const reachedAtLeast = (target: ApplicationState): number =>
    rows.filter((app) => app.history.some((h) => h.state === target)).length;

  const funnel: FunnelStep[] = FUNNEL_ORDER.map((state) => ({
    state,
    count: reachedAtLeast(state),
  }));

  return delay({
    total: rows.length,
    byState,
    todaySubmissions,
    weekSubmissions,
    series,
    funnel,
  });
}

export type NotificationKind =
  | "new_application"
  | "needs_review"
  | "deadline"
  | "status_change";

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  title: string;
  description: string;
  /** ISO 8601. */
  at: string;
  read: boolean;
  /** Optional application code the notification links to. */
  applicationCode?: string;
};

/**
 * In-memory notification store, derived deterministically from the dataset so
 * counts line up with what the staff would see. Mutable for mark-as-read within
 * a session (pha 2: real rows + PATCH /notifications/:id/read).
 */
const notificationCache = new Map<string, AppNotification[]>();

function buildNotifications(tenantCode: string): AppNotification[] {
  const rows = datasetFor(tenantCode);
  const recentSubmitted = rows
    .filter((a) => a.state === "SUBMITTED")
    .slice(0, 3);
  const needsReview = rows
    .filter((a) => a.state === "UNDER_REVIEW" || a.state === "NEEDS_INFO")
    .slice(0, 2);

  const items: AppNotification[] = [];

  recentSubmitted.forEach((app, i) => {
    items.push({
      id: `n-new-${app.code}`,
      kind: "new_application",
      title: "Hồ sơ mới được nộp",
      description: `${studentNameOf(app)} · ${app.code}`,
      at: app.createdAt,
      read: i > 0,
      applicationCode: app.code,
    });
  });

  needsReview.forEach((app) => {
    items.push({
      id: `n-review-${app.code}`,
      kind: "needs_review",
      title: "Hồ sơ cần xem xét",
      description: `${studentNameOf(app)} · ${app.code}`,
      at: app.updatedAt,
      read: false,
      applicationCode: app.code,
    });
  });

  items.push({
    id: "n-deadline-2026",
    kind: "deadline",
    title: "Sắp đến hạn đợt tuyển sinh",
    description: "Đợt tuyển sinh 2026 còn 3 ngày trước khi đóng nhận hồ sơ.",
    at: new Date(REFERENCE_DATE.getTime() - 2 * 3600_000).toISOString(),
    read: false,
  });

  return items.sort((a, b) => (a.at < b.at ? 1 : -1));
}

function notificationsFor(tenantCode: string): AppNotification[] {
  const key = tenantCode || "default";
  let items = notificationCache.get(key);
  if (!items) {
    items = buildNotifications(key);
    notificationCache.set(key, items);
  }
  return items;
}

export async function listNotifications(
  tenantCode: string,
): Promise<AppNotification[]> {
  // Return clones so callers can't mutate the cache directly.
  return delay(notificationsFor(tenantCode).map((n) => ({ ...n })));
}

export async function markNotificationRead(
  tenantCode: string,
  id: string,
): Promise<AppNotification[]> {
  const items = notificationsFor(tenantCode);
  const target = items.find((n) => n.id === id);
  if (target) target.read = true;
  return delay(items.map((n) => ({ ...n })));
}

export async function markAllNotificationsRead(
  tenantCode: string,
): Promise<AppNotification[]> {
  const items = notificationsFor(tenantCode);
  items.forEach((n) => {
    n.read = true;
  });
  return delay(items.map((n) => ({ ...n })));
}
