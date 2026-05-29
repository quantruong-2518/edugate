import { getTenantCode } from "@/lib/tenants/branding";

import { DashboardOverview } from "./_components/dashboard-overview";

/** Tenant the dashboard defaults to when no tenant resolves from the URL
 * (root admin host) — pha 1 demo only; pha 2 always runs under a tenant. */
const DEFAULT_ADMIN_TENANT = "nguyen-huy-tuong";

export default async function AdminHomePage() {
  const code = await getTenantCode();

  return (
    <div className="mx-auto w-full max-w-6xl p-4 sm:p-6">
      <DashboardOverview tenantCode={code ?? DEFAULT_ADMIN_TENANT} />
    </div>
  );
}
