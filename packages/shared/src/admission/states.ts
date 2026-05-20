/**
 * Application states for the admission module.
 *
 * Source of truth for both FE (badges, timeline, action gating) and BE
 * (transition guards, RLS policies). State labels are Vietnamese — task 14
 * will move them behind next-intl keys.
 */

export const APPLICATION_STATE_CODES = [
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

export type ApplicationState = (typeof APPLICATION_STATE_CODES)[number];

/**
 * Tone token consumed by `<StateBadge>` / `<StateTimeline>` to pick the
 * tailwind palette. Keep the list narrow on purpose — new states should
 * reuse a tone rather than invent one.
 */
export type ApplicationStateTone =
  | "gray"
  | "blue"
  | "amber"
  | "orange"
  | "green"
  | "red"
  | "emerald"
  | "violet"
  | "slate";

export type ApplicationStateMeta = {
  code: ApplicationState;
  label: string;
  description: string;
  tone: ApplicationStateTone;
  terminal: boolean;
};

export const APPLICATION_STATES: Readonly<
  Record<ApplicationState, ApplicationStateMeta>
> = {
  DRAFT: {
    code: "DRAFT",
    label: "Nháp",
    description: "Phụ huynh đang điền, chưa nộp.",
    tone: "gray",
    terminal: false,
  },
  SUBMITTED: {
    code: "SUBMITTED",
    label: "Đã nộp",
    description: "Đã nộp, chờ phân công duyệt.",
    tone: "blue",
    terminal: false,
  },
  UNDER_REVIEW: {
    code: "UNDER_REVIEW",
    label: "Đang duyệt",
    description: "Cán bộ đang xem xét hồ sơ.",
    tone: "amber",
    terminal: false,
  },
  NEEDS_INFO: {
    code: "NEEDS_INFO",
    label: "Cần bổ sung",
    description: "Yêu cầu phụ huynh bổ sung tài liệu.",
    tone: "orange",
    terminal: false,
  },
  APPROVED: {
    code: "APPROVED",
    label: "Đã duyệt",
    description: "Trường chấp nhận, chờ PH xác nhận nhập học.",
    tone: "green",
    terminal: false,
  },
  REJECTED: {
    code: "REJECTED",
    label: "Từ chối",
    description: "Không đạt yêu cầu.",
    tone: "red",
    terminal: true,
  },
  CONFIRMED: {
    code: "CONFIRMED",
    label: "Đã xác nhận",
    description: "PH xác nhận nhập học, chờ thủ tục.",
    tone: "emerald",
    terminal: false,
  },
  ENROLLED: {
    code: "ENROLLED",
    label: "Đã nhập học",
    description: "Đã hoàn tất nhập học.",
    tone: "violet",
    terminal: true,
  },
  CANCELLED: {
    code: "CANCELLED",
    label: "Đã hủy",
    description: "Phụ huynh đã hủy hồ sơ.",
    tone: "slate",
    terminal: true,
  },
  EXPIRED: {
    code: "EXPIRED",
    label: "Hết hạn",
    description: "Quá deadline của đợt tuyển sinh.",
    tone: "slate",
    terminal: true,
  },
};

export function isTerminalState(state: ApplicationState): boolean {
  return APPLICATION_STATES[state].terminal;
}
