import { NextResponse, type NextRequest } from "next/server";

import {
  TENANT_COOKIE,
  TENANT_HEADER,
  isValidTenantCode,
  parseTenantFromCustomDomain,
  parseTenantFromHost,
  parseTenantFromPath,
  resolveRootHosts,
} from "@shared/tenant";

import { CUSTOM_DOMAIN_TENANTS } from "@/lib/tenants/custom-domains";

const ROOT_HOSTS = resolveRootHosts(process.env.TENANT_ROOT_HOSTS);

// 30 days, refreshed on every tenant'd request (sliding expiry). Persists the
// active tenant so a reload of a tenant-less URL keeps the school's branding +
// form instead of dropping to the unbranded default (ADR-014).
const TENANT_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const host = req.headers.get("host");

  // Resolution order — these three are explicit (the tenant is named in the
  // request), so they always win over the cookie fallback below.
  let tenantCode = parseTenantFromHost(host, ROOT_HOSTS);
  let rewritten = false;

  // Custom domain a school owns (e.g. a-tuyen-sinh.vn) → its tenant code.
  // No parseable label, so it's an explicit map lookup (ADR-012). Like a
  // subdomain, the path is served as-is — no rewrite.
  if (!tenantCode) {
    tenantCode = parseTenantFromCustomDomain(host, CUSTOM_DOMAIN_TENANTS);
  }

  if (!tenantCode) {
    const fromPath = parseTenantFromPath(url.pathname);
    if (fromPath) {
      tenantCode = fromPath.code;
      url.pathname = fromPath.rest;
      rewritten = true;
    }
  }

  // Cookie fallback — only when the URL names no tenant, and never on the root
  // path. On a shared host (dev localhost), `/` is the marketing / tenant
  // chooser and must ignore the cookie so the visitor can leave or switch
  // schools (ADR-014, option A). Deeper applicant routes (/register, /track)
  // inherit the last active tenant. In prod each tenant is its own host, so the
  // cookie is host-scoped and can never bleed across tenants.
  if (!tenantCode && url.pathname !== "/") {
    const cookieCode = req.cookies.get(TENANT_COOKIE)?.value;
    if (cookieCode && isValidTenantCode(cookieCode)) {
      tenantCode = cookieCode;
    }
  }

  const requestHeaders = new Headers(req.headers);
  if (tenantCode) {
    requestHeaders.set(TENANT_HEADER, tenantCode);
  } else {
    // Drop any inbound spoof attempt — the header is server-authoritative.
    requestHeaders.delete(TENANT_HEADER);
  }

  const response = rewritten
    ? NextResponse.rewrite(url, { request: { headers: requestHeaders } })
    : NextResponse.next({ request: { headers: requestHeaders } });

  if (tenantCode) {
    response.headers.set(TENANT_HEADER, tenantCode);
    // Persist / refresh the active tenant. Host-only (no Domain attr) keeps
    // prod subdomains isolated; httpOnly because the client never reads it —
    // theme + form schema are resolved server-side from the header.
    response.cookies.set(TENANT_COOKIE, tenantCode, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: TENANT_COOKIE_MAX_AGE,
    });
  }

  return response;
}

export const config = {
  // Run on app routes only. Skip Next internals, the API surface, and any
  // request that looks like a static asset (has a file extension).
  matcher: ["/((?!_next/static|_next/image|api|favicon.ico|.*\\..*).*)"],
};
