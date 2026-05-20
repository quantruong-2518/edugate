import type { ApplicationStateTone } from "@shared/admission";

/**
 * Tailwind palette map for state tones. Hardcoded raw colors (not tenant
 * tokens) on purpose — these are status semantics, shared across tenants.
 * Each entry covers light + dark.
 */
export const TONE_BADGE_CLASS: Readonly<Record<ApplicationStateTone, string>> = {
  gray: "bg-gray-100 text-gray-700 ring-gray-200 dark:bg-gray-800/60 dark:text-gray-200 dark:ring-gray-700",
  blue: "bg-blue-100 text-blue-700 ring-blue-200 dark:bg-blue-950/60 dark:text-blue-200 dark:ring-blue-800",
  amber:
    "bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-950/60 dark:text-amber-200 dark:ring-amber-800",
  orange:
    "bg-orange-100 text-orange-800 ring-orange-200 dark:bg-orange-950/60 dark:text-orange-200 dark:ring-orange-800",
  green:
    "bg-green-100 text-green-700 ring-green-200 dark:bg-green-950/60 dark:text-green-200 dark:ring-green-800",
  red: "bg-red-100 text-red-700 ring-red-200 dark:bg-red-950/60 dark:text-red-200 dark:ring-red-800",
  emerald:
    "bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200 dark:ring-emerald-800",
  violet:
    "bg-violet-100 text-violet-700 ring-violet-200 dark:bg-violet-950/60 dark:text-violet-200 dark:ring-violet-800",
  slate:
    "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800/60 dark:text-slate-200 dark:ring-slate-700",
};

export const TONE_DOT_CLASS: Readonly<Record<ApplicationStateTone, string>> = {
  gray: "bg-gray-400 dark:bg-gray-500",
  blue: "bg-blue-500",
  amber: "bg-amber-500",
  orange: "bg-orange-500",
  green: "bg-green-500",
  red: "bg-red-500",
  emerald: "bg-emerald-500",
  violet: "bg-violet-500",
  slate: "bg-slate-400 dark:bg-slate-500",
};
