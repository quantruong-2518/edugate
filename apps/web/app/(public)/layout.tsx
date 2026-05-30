import type { ReactNode } from "react";

import { PublicHeader } from "@/components/public/public-header";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh">
      {/*
        The per-tenant header renders only when a tenant is resolved (landing /
        register / track). The root marketing site resolves no tenant, so it
        falls through to its own <MarketingHeader>. The applicant surfaces are
        VI-only, so the header carries no locale switcher.
      */}
      <PublicHeader />
      {children}
    </div>
  );
}
