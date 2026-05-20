import type { ReactNode } from "react";

import { AbilityProvider } from "@/lib/auth/ability-provider";
import { MOCK_ABILITY_CONTEXT } from "@/lib/auth/session";
import { getTenantBranding, getTenantCode } from "@/lib/tenants/branding";

import { AdminShell } from "./_components/admin-shell";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const branding = await getTenantBranding(await getTenantCode());
  return (
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
  );
}
