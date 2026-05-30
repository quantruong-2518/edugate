import { NextResponse, type NextRequest } from "next/server";

import {
  TENANT_HEADER,
  parseTenantFromCustomDomain,
  parseTenantFromHost,
  parseTenantFromPath,
  resolveRootHosts,
} from "@shared/tenant";

import { CUSTOM_DOMAIN_TENANTS } from "@/lib/tenants/custom-domains";

const ROOT_HOSTS = resolveRootHosts(process.env.TENANT_ROOT_HOSTS);

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const host = req.headers.get("host");

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
  }

  return response;
}

export const config = {
  // Run on app routes only. Skip Next internals, the API surface, and any
  // request that looks like a static asset (has a file extension).
  matcher: ["/((?!_next/static|_next/image|api|favicon.ico|.*\\..*).*)"],
};
