import type { ReactNode } from "react";

import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { getTenantCode } from "@/lib/tenants/branding";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const tenantCode = await getTenantCode();

  return (
    <div className="relative">
      {/*
        Tenant pages (landing/register/track) have no AppShell, so the locale
        switcher overlays the top-right corner. Absolute (not a layout bar) so
        the landing hero can run full-bleed underneath it. The root marketing
        site has its own header switcher, so skip the overlay there.
      */}
      {tenantCode && (
        <div className="absolute right-4 top-3 z-50 print:hidden">
          <LocaleSwitcher />
        </div>
      )}
      {children}
    </div>
  );
}
