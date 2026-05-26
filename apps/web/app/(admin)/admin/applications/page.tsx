import { getTranslations } from "next-intl/server";

import { getApplicationFormSchema } from "@/lib/api";
import { getTenantCode } from "@/lib/tenants/branding";

import { ApplicationsView } from "./_components/applications-view";

/** Tenant the list defaults to when no tenant resolves from the URL (root
 * admin host) — pha 1 demo only; pha 2 always runs under a tenant. */
const DEFAULT_ADMIN_TENANT = "nguyen-huy-tuong";

export default async function ApplicationsPage() {
  const code = await getTenantCode();
  const tenantCode = code ?? DEFAULT_ADMIN_TENANT;
  const t = await getTranslations("admin.applications");
  // Form schema is plain data (not i18n) so it is safe to read in RSC and pass
  // to the client for resolving formData field labels in the detail sheet.
  const formSchema = await getApplicationFormSchema(tenantCode);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-10">
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <ApplicationsView tenantCode={tenantCode} formSchema={formSchema} />
    </div>
  );
}
