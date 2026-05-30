import { getTranslations } from "next-intl/server";

import { getTenantCode } from "@/lib/tenants/branding";

import { DashboardOverview } from "./_components/dashboard-overview";

/** Tenant the dashboard defaults to when no tenant resolves from the URL
 * (root admin host) — pha 1 demo only; pha 2 always runs under a tenant. */
const DEFAULT_ADMIN_TENANT = "nguyen-huy-tuong";

export default async function AdminHomePage() {
  const code = await getTenantCode();
  const t = await getTranslations("admin.dashboard");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <DashboardOverview tenantCode={code ?? DEFAULT_ADMIN_TENANT} />
    </div>
  );
}
