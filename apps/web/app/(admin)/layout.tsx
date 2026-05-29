import { cookies } from "next/headers";
import type { ReactNode } from "react";

import { isValidTenantCode } from "@shared/tenant";

import { AbilityProvider } from "@/lib/auth/ability-provider";
import { MOCK_ABILITY_CONTEXT } from "@/lib/auth/session";
import { getTenantBranding, getTenantCode } from "@/lib/tenants/branding";

import { ADMIN_COOKIE } from "./_actions/session-cookie";
import { AdminGate } from "./_components/admin-gate";
import { AdminShell } from "./_components/admin-shell";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const jar = await cookies();
  const sessionSlug = jar.get(ADMIN_COOKIE)?.value;
  const authedSlug =
    sessionSlug && isValidTenantCode(sessionSlug) ? sessionSlug : null;

  // No session → show the access gate. The slug is driven by the host tenant
  // (read-only); admin is always reached via the school's own domain/subdomain.
  if (!authedSlug) {
    const hostCode = await getTenantCode();
    return (
      <div className="admin-neutral">
        <AdminGate slug={hostCode ?? ""} />
      </div>
    );
  }

  const branding = await getTenantBranding(authedSlug);
  return (
    <div className="admin-neutral">
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
