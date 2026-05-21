import type { LandingConfig } from "@shared/landing";

/**
 * Mock persistence for the per-tenant appearance editor (task 17): branding
 * tokens + landing config. localStorage-backed and client-only, mirroring
 * `store.ts` — the public landing page is rendered by RSC from fixtures, so on
 * the server these reads return null and edits do not (yet) change the live
 * site. That wiring lands in pha 2 when this seam swaps to an API call and the
 * RSC fetch reads the same DB row.
 *
 * The editor seeds its initial state from the server fixtures (passed as
 * props), then overlays any saved draft found here on mount.
 */

/** Brand-defining tokens the editor exposes (subset of the full TenantTheme). */
export type BrandingDraft = {
  logoUrl: string | null;
  /** Base radius, e.g. "0.625rem". */
  radius: string;
  /** CSS font-family stack for `--font-sans`. */
  fontSans: string;
  /** Any valid CSS color (hex or oklch); written straight into the token. */
  primaryLight: string;
  primaryForegroundLight: string;
  primaryDark: string;
  primaryForegroundDark: string;
};

export type AppearanceDraft = {
  branding: BrandingDraft;
  config: LandingConfig;
};

const STORAGE_KEY = "edugate:mock:appearance";

type Store = Record<string, AppearanceDraft>;

function readStore(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}

function writeStore(store: Store): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Ignore quota / private-mode failures — mock data is non-critical.
  }
}

export function loadAppearanceDraft(tenantCode: string): AppearanceDraft | null {
  return readStore()[tenantCode] ?? null;
}

export function saveAppearanceDraft(
  tenantCode: string,
  draft: AppearanceDraft,
): void {
  const store = readStore();
  store[tenantCode] = draft;
  writeStore(store);
}

export function clearAppearanceDraft(tenantCode: string): void {
  const store = readStore();
  delete store[tenantCode];
  writeStore(store);
}
