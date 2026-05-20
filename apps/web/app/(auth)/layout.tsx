import type { ReactNode } from "react";

import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { getTenantBranding, getTenantCode } from "@/lib/tenants/branding";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const branding = await getTenantBranding(await getTenantCode());

  return (
    <div className="relative min-h-dvh">
      <div className="absolute right-4 top-4">
        <LocaleSwitcher />
      </div>
      <div className="grid min-h-dvh place-items-center px-4 py-10 sm:px-6 sm:py-12">
        <div className="w-full max-w-sm space-y-6">
          {/* Tenant brand mark — auth pages inherit the per-tenant theme. */}
          <div className="flex flex-col items-center gap-2">
            <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-base font-semibold text-primary-foreground">
              {branding.shortName.slice(0, 3).toUpperCase()}
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              {branding.name}
            </span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
