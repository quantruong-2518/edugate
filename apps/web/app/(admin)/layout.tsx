import type { Metadata } from "next";
import { cookies } from "next/headers";
import type { ReactNode } from "react";

import type { TenantTheme } from "@shared/theme";
import { isValidTenantCode } from "@shared/tenant";

import { AbilityProvider } from "@/lib/auth/ability-provider";
import { MOCK_ABILITY_CONTEXT } from "@/lib/auth/session";
import { getTenantBranding, getTenantCode } from "@/lib/tenants/branding";

import { ADMIN_COOKIE } from "./_actions/session-cookie";
import { AdminGate } from "./_components/admin-gate";
import { AdminShell } from "./_components/admin-shell";

/**
 * Override the brand-mark accent (and only that) with a tenant's brand color.
 * The admin is neutral by design (ADR-013) so we can't reuse `--primary`,
 * which `.admin-neutral` pins neutral; the mark gets its own token sourced
 * from the resolved tenant rather than the request host. Targets the same
 * `.admin-neutral` selector as the globals.css default and renders later in
 * the body, so it wins on equal specificity. Built from server fixtures.
 */
function brandMarkCss(theme: TenantTheme): string {
  return [
    `.admin-neutral{--brand-mark:${theme.light.primary};`,
    `--brand-mark-foreground:${theme.light.primaryForeground};}`,
    `.dark .admin-neutral{--brand-mark:${theme.dark.primary};`,
    `--brand-mark-foreground:${theme.dark.primaryForeground};}`,
  ].join("");
}

/**
 * Admin <title> follows the authenticated tenant (cookie slug), not the request
 * host — the root layout's metadata is host-driven and falls back to "Ghi Danh"
 * when the admin is served on a host that carries no tenant. Falls back to the
 * host tenant pre-auth (the gate), then to the default.
 */
export async function generateMetadata(): Promise<Metadata> {
  const jar = await cookies();
  const slug = jar.get(ADMIN_COOKIE)?.value;
  const authedSlug = slug && isValidTenantCode(slug) ? slug : null;
  const branding = await getTenantBranding(authedSlug ?? (await getTenantCode()));
  // `absolute` ignores the root layout's host-driven "%s · Ghi Danh" template so
  // the tab shows just the authenticated school.
  return { title: { absolute: branding.name } };
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const jar = await cookies();
  const sessionSlug = jar.get(ADMIN_COOKIE)?.value;
  const authedSlug =
    sessionSlug && isValidTenantCode(sessionSlug) ? sessionSlug : null;

  // No session → show the access gate. The slug is driven by the host tenant
  // (read-only); admin is always reached via the school's own domain/subdomain.
  // The mark still gets the host tenant's color pre-auth (neutral if none).
  if (!authedSlug) {
    const hostCode = await getTenantCode();
    const branding = await getTenantBranding(hostCode);
    return (
      <div className="admin-neutral">
        <style
          id="admin-brand-mark"
          dangerouslySetInnerHTML={{ __html: brandMarkCss(branding.theme) }}
        />
        <AdminGate slug={hostCode ?? ""} />
      </div>
    );
  }

  // Brand-mark color follows the authenticated tenant (cookie slug), so the
  // mark is branded even when the admin is served on a host without a tenant.
  const branding = await getTenantBranding(authedSlug);
  return (
    <div className="admin-neutral">
      <style
        id="admin-brand-mark"
        dangerouslySetInnerHTML={{ __html: brandMarkCss(branding.theme) }}
      />
      <AbilityProvider context={MOCK_ABILITY_CONTEXT}>
        <AdminShell
          branding={{
            code: branding.code,
            name: branding.name,
            shortName: branding.shortName,
          }}
        >
          {children}
        </AdminShell>
      </AbilityProvider>
    </div>
  );
}
