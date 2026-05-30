import type { ReactNode } from "react";

import { PublicHeader } from "@/components/public/public-header";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh">
      {/*
        The per-tenant header renders only when a tenant is resolved (landing /
        register / track). The root marketing site resolves no tenant, so it
        falls through to its own <MarketingHeader>. This also replaces the old
        floating locale switcher (a "locale strip"), folding language selection
        into a real one-line header.
      */}
      <PublicHeader />
      {children}
    </div>
  );
}
