import type { Application, ApplicationCode } from "@shared/admission";

/**
 * Mock persistence for applications. localStorage-backed so a freshly-submitted
 * application survives navigation to `/track/[code]` and page reloads. This is
 * client-only state; on the server (RSC/SSR) reads return an empty store, which
 * is why the apply wizard and track page run client-side in pha 1.
 *
 * Pha 2 (task 15) deletes this file — the API seam in `admission.ts` swaps to
 * real network calls and persistence moves to Postgres.
 */
const STORAGE_KEY = "ghidanh:mock:applications";

type Store = Record<ApplicationCode, Application>;

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

export function saveApplication(application: Application): void {
  const store = readStore();
  store[application.code] = application;
  writeStore(store);
}

export function findApplication(code: ApplicationCode): Application | null {
  const store = readStore();
  return store[code] ?? null;
}
