/**
 * Application state transitions.
 *
 * Same source of truth used by:
 *   - `<StateActions>` (FE) to decide which buttons to render.
 *   - The NestJS admission service (BE, pha 2) to validate state changes.
 *   - The cron worker (BE, pha 2) to apply EXPIRED transitions.
 *
 * Adding a transition: append to TRANSITIONS — never mutate. Roles must
 * intersect the permission matrix (task 9); SYSTEM is reserved for cron.
 */

import type { ApplicationState } from "./states.js";

export const APPLICATION_ROLES = [
  "APPLICANT",
  "REVIEWER",
  "ADMISSION_ADMIN",
  "SYSTEM",
] as const;

export type ApplicationRole = (typeof APPLICATION_ROLES)[number];

export type Transition = {
  from: ApplicationState;
  to: ApplicationState;
  /** Roles allowed to perform this transition. */
  roles: readonly ApplicationRole[];
  /** Verb shown in `<StateActions>` (Vietnamese). */
  action: string;
  /** When true, FE must collect a reason before invoking the transition. */
  requireReason: boolean;
};

/**
 * EXPIRED is reachable only by SYSTEM (cron). We enumerate it explicitly
 * for every non-terminal pre-confirmation state so the BE worker can
 * iterate `TRANSITIONS` without special-casing.
 */
const EXPIRABLE_FROM: readonly ApplicationState[] = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "NEEDS_INFO",
  "APPROVED",
];

export const TRANSITIONS: readonly Transition[] = [
  {
    from: "DRAFT",
    to: "SUBMITTED",
    roles: ["APPLICANT"],
    action: "Nộp hồ sơ",
    requireReason: false,
  },
  {
    from: "DRAFT",
    to: "CANCELLED",
    roles: ["APPLICANT"],
    action: "Hủy hồ sơ",
    requireReason: false,
  },
  {
    from: "SUBMITTED",
    to: "CANCELLED",
    roles: ["APPLICANT"],
    action: "Hủy hồ sơ",
    requireReason: false,
  },
  {
    from: "SUBMITTED",
    to: "UNDER_REVIEW",
    roles: ["REVIEWER", "ADMISSION_ADMIN"],
    action: "Bắt đầu duyệt",
    requireReason: false,
  },
  {
    from: "UNDER_REVIEW",
    to: "APPROVED",
    roles: ["REVIEWER", "ADMISSION_ADMIN"],
    action: "Duyệt",
    requireReason: false,
  },
  {
    from: "UNDER_REVIEW",
    to: "REJECTED",
    roles: ["REVIEWER", "ADMISSION_ADMIN"],
    action: "Từ chối",
    requireReason: true,
  },
  {
    from: "UNDER_REVIEW",
    to: "NEEDS_INFO",
    roles: ["REVIEWER", "ADMISSION_ADMIN"],
    action: "Yêu cầu bổ sung",
    requireReason: true,
  },
  {
    from: "NEEDS_INFO",
    to: "SUBMITTED",
    roles: ["APPLICANT"],
    action: "Nộp bổ sung",
    requireReason: false,
  },
  {
    from: "APPROVED",
    to: "CONFIRMED",
    roles: ["APPLICANT"],
    action: "Xác nhận nhập học",
    requireReason: false,
  },
  {
    from: "CONFIRMED",
    to: "ENROLLED",
    roles: ["ADMISSION_ADMIN"],
    action: "Hoàn tất nhập học",
    requireReason: false,
  },
  ...EXPIRABLE_FROM.map<Transition>((from) => ({
    from,
    to: "EXPIRED",
    roles: ["SYSTEM"],
    action: "Đánh dấu hết hạn",
    requireReason: false,
  })),
];

/**
 * Transitions the given role may invoke from `state`. SYSTEM is filtered
 * out for any caller role other than SYSTEM (cron job) — `<StateActions>`
 * passes a user role and should never see expiration as a button.
 */
export function getAllowedTransitions(
  state: ApplicationState,
  role: ApplicationRole,
): readonly Transition[] {
  return TRANSITIONS.filter(
    (t) => t.from === state && t.roles.includes(role),
  );
}

export function canTransition(
  from: ApplicationState,
  to: ApplicationState,
  role: ApplicationRole,
): boolean {
  return TRANSITIONS.some(
    (t) => t.from === from && t.to === to && t.roles.includes(role),
  );
}
