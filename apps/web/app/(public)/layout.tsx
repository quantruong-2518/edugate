import type { ReactNode } from "react";

import { LocaleSwitcher } from "@/components/i18n/locale-switcher";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/*
        Public pages have no AppShell, so the locale switcher lives here as a
        thin top-right bar. Non-sticky + transparent to avoid disrupting the
        landing hero / centered form layouts.
      */}
      <div className="flex justify-end px-4 py-3">
        <LocaleSwitcher />
      </div>
      {children}
    </>
  );
}
