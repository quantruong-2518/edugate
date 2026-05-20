import type { ReactNode } from "react";

import { LocaleSwitcher } from "@/components/i18n/locale-switcher";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      {/*
        Public pages have no AppShell, so the locale switcher overlays the
        top-right corner. Absolute (not a layout bar) so the landing hero can
        run full-bleed underneath it.
      */}
      <div className="absolute right-4 top-3 z-50">
        <LocaleSwitcher />
      </div>
      {children}
    </div>
  );
}
