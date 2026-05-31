import {
  generateApplicationCode,
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
 * Admission API seam.
 *
 * Pha-1 mock: the public apply flow runs without a back-end. OTP is a fixed
 * dev code (`MOCK_OTP_CODE`) and submitted applications are stored in
 * localStorage so the confirmation + `/track/:code` pages work offline.
 * Signatures match the pha-2 API, so the TanStack Query hooks in `queries.ts`
 * and every call site are unchanged — pha 2 sets `NEXT_PUBLIC_API_URL` and
 * swaps each body back to an `http` call (threading `otpToken` from verify →
 * submit per API_SPEC §3.3 + §3.1).
 *
 * Only the public apply flow (OTP + submit + track-by-code) is mocked here.
 * The admin/management endpoints below are a mix of real `http` calls (e.g.
 * `listApplications`) and the deterministic seeded generator — left untouched.
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

/** Fixed OTP for the pha-1 mock — no SMTP / back-end needed. */
const MOCK_OTP_CODE = "123456";

/** localStorage key for mock-submitted applications (apply → track, offline). */
const APPLICATION_STORE_KEY = "ghidanh:applications";

function readApplicationStore(): Record<string, Application> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(APPLICATION_STORE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, Application>) : {};
  } catch {
    return {};
  }
}

function writeApplicationStore(store: Record<string, Application>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(APPLICATION_STORE_KEY, JSON.stringify(store));
  } catch {
    // Ignore quota / private-mode failures.
  }
}

/** ISO timestamp `minutes` from now (OTP expiry). */
function isoIn(minutes: number): string {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

/**
 * Submit a new application. Mock: generate a code, mark it SUBMITTED, and
 * persist to localStorage so the confirmation page + `/track/:code` resolve
 * offline. `otpToken` is accepted as-is (the mock verify issues it); pha 2 has
 * the API validate it and own canonical code generation.
 */
export async function createApplication(
  input: CreateApplicationInput,
): Promise<Application> {
  const code = generateApplicationCode(input.tenantCode).toUpperCase();
  const at = new Date().toISOString();
  const application: Application = {
    code,
    tenantCode: input.tenantCode,
    ...(input.campaignId ? { campaignId: input.campaignId } : {}),
    state: "SUBMITTED",
    applicant: input.applicant,
    formData: input.formData,
    history: [{ state: "SUBMITTED", at }],
    createdAt: at,
    updatedAt: at,
  };
  const store = readApplicationStore();
  store[code] = application;
  writeApplicationStore(store);
  return delay(application);
}

export async function getApplicationByCode(
  code: ApplicationCode,
): Promise<Application | null> {
  // Mock: read from the localStorage store this session's submit wrote to.
  const store = readApplicationStore();
  return delay(store[code.trim().toUpperCase()] ?? null);
}

export async function sendEmailOtp(
  _input: SendEmailOtpInput,
): Promise<SendEmailOtpResult> {
  // Mock: no SMTP. The code is always MOCK_OTP_CODE; `devCode` lets the UI
  // toast it so a tester can self-serve without a back-end.
  return delay({ sent: true, expiresAt: isoIn(10), devCode: MOCK_OTP_CODE });
}

export async function verifyEmailOtp(
  input: VerifyEmailOtpInput,
): Promise<VerifyEmailOtpResult> {
  // Mock: only MOCK_OTP_CODE verifies. A wrong code returns "not verified"
  // (not a throw) so the form shows a normal validation message.
  if (input.code.trim() !== MOCK_OTP_CODE) {
    return delay({ verified: false, otpToken: "", expiresAt: "" });
  }
  return delay({
    verified: true,
    otpToken: `mock-otp-${Date.now()}`,
    expiresAt: isoIn(10),
  });
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
  | "score:asc"
  | "name:asc";

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
    case "name:asc":
      sorted.sort((a, b) =>
        studentNameOf(a).localeCompare(studentNameOf(b), "vi"),
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
  /** Daily submission counts spanning the resolved range (oldest first). */
  series: AnalyticsPoint[];
  /** Effective range actually charted (resolved when caller passes none). */
  range: { from: string; to: string };
  /** Approval funnel (submitted → reviewed → approved → confirmed → enrolled). */
  funnel: FunnelStep[];
};

/**
 * Date window for analytics. Both bounds optional ISO `yyyy-mm-dd`; when a bound
 * is omitted it resolves to all-time (earliest submission → REFERENCE_DATE).
 */
export type AnalyticsRange = {
  from?: string;
  to?: string;
};

const DAY_MS = 86_400_000;

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

/** Midnight UTC of an ISO `yyyy-mm-dd` day. */
function startOfDayMs(key: string): number {
  return Date.parse(`${key}T00:00:00.000Z`);
}

/** Last millisecond (UTC) of an ISO `yyyy-mm-dd` day. */
function endOfDayMs(key: string): number {
  return Date.parse(`${key}T23:59:59.999Z`);
}

export async function getApplicationAnalytics(
  tenantCode: string,
  range: AnalyticsRange = {},
): Promise<ApplicationAnalytics> {
  const all = datasetFor(tenantCode);

  // Resolve the effective window. Omitted bounds expand to all-time: the
  // earliest submission on record (lower) and REFERENCE "today" (upper).
  const createdMsList = all.map((app) => new Date(app.createdAt).getTime());
  const earliestMs = createdMsList.length
    ? Math.min(...createdMsList)
    : REFERENCE_DATE.getTime();
  const fromMs = range.from ? startOfDayMs(range.from) : startOfDayMs(dateKey(earliestMs));
  const toMs = range.to ? endOfDayMs(range.to) : endOfDayMs(dateKey(REFERENCE_DATE.getTime()));

  const fromKey = dateKey(fromMs);
  const toKey = dateKey(toMs);

  const rows = all.filter((app) => {
    const ms = new Date(app.createdAt).getTime();
    return ms >= fromMs && ms <= toMs;
  });

  const byState = emptyByState();

  // "Today" / "this week" stay anchored to REFERENCE regardless of range.
  const startOfToday = new Date(REFERENCE_DATE);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfWeek = startOfToday.getTime() - 6 * DAY_MS;
  let todaySubmissions = 0;
  let weekSubmissions = 0;
  for (const app of all) {
    const ms = new Date(app.createdAt).getTime();
    if (ms >= startOfToday.getTime()) todaySubmissions += 1;
    if (ms >= startOfWeek) weekSubmissions += 1;
  }

  // Seed one bucket per day in the window so empty days render as 0.
  const buckets = new Map<string, number>();
  for (let ms = startOfDayMs(fromKey); ms <= toMs; ms += DAY_MS) {
    buckets.set(dateKey(ms), 0);
  }
  for (const app of rows) {
    byState[app.state] += 1;
    const key = dateKey(new Date(app.createdAt).getTime());
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  const series: AnalyticsPoint[] = Array.from(buckets.entries()).map(
    ([date, count]) => ({ date, count }),
  );

  // Funnel: each step counts applications (within range) that reached at least
  // that state on their way to the current state.
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
    range: { from: fromKey, to: toKey },
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
