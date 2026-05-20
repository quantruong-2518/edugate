import axios from "axios";

import {
  parseTenantFromHost,
  parseTenantFromPath,
  resolveRootHosts,
} from "@shared/tenant";

/**
 * Shared axios instance for the NestJS API (pha 2). In pha 1 there is no
 * backend yet — the data seam in `admission.ts` / `forms.ts` / `landing.ts`
 * still serves mock data, and the TanStack Query hooks in `queries.ts` call
 * that seam directly. This client exists so the network layer (base URL,
 * tenant header, auth token) is already wired the day the API lands: at that
 * point the seam bodies swap to `http.get(...)` and nothing above changes.
 */
export const http = axios.create({
  // `/api` is a placeholder; pha 2 sets NEXT_PUBLIC_API_URL to the NestJS host.
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "/api",
  timeout: 15_000,
});

/**
 * Resolve the active tenant code on the client from the current URL, mirroring
 * the rule the middleware uses server-side (subdomain first, then /t/:code).
 * Pha 2 may instead read it from the decoded JWT.
 */
function activeTenantCode(): string | null {
  if (typeof window === "undefined") return null;
  const rootHosts = resolveRootHosts(process.env.NEXT_PUBLIC_TENANT_ROOT_HOSTS);
  return (
    parseTenantFromHost(window.location.host, rootHosts) ??
    parseTenantFromPath(window.location.pathname)?.code ??
    null
  );
}

http.interceptors.request.use((config) => {
  const tenant = activeTenantCode();
  if (tenant) {
    config.headers.set("x-tenant-code", tenant);
  }
  // TODO(pha 2): attach the Authorization bearer token once Better-Auth issues
  // the per-tenant JWT (read from cookie / session store here).
  return config;
});
