import type { ReactNode } from "react";

import { FooterSection } from "@/components/landing/footer-section";
import { PublicHeader } from "@/components/public/public-header";
import { getLandingConfig } from "@/lib/api";
import { getTenantCode } from "@/lib/tenants/branding";

export default async function PublicLayout({
  children,
}: {
  children: ReactNode;
}) {
  const tenantCode = await getTenantCode();
  const config = tenantCode ? await getLandingConfig(tenantCode) : null;
  const footerSection = config?.sections.find((s) => s.type === "footer");

  return (
    <div className="relative flex min-h-dvh flex-col">
      {/*
        The per-tenant header renders only when a tenant is resolved (landing /
        register / track). The root marketing site resolves no tenant, so it
        falls through to its own <MarketingHeader>. The applicant surfaces are
        VI-only, so the header carries no locale switcher.
      */}
      <PublicHeader />
      <div className="flex-1">{children}</div>
      {footerSection && footerSection.type === "footer" && (
        <FooterSection section={footerSection} />
      )}
    </div>
  );
}
