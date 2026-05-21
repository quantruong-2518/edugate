import { getTranslations } from "next-intl/server";

import { RequirePermission } from "@/components/auth/require-permission";
import { getTenantCode } from "@/lib/tenants/branding";

import { AuditLogViewer } from "./_components/audit-log-viewer";

export default async function AuditLogPage() {
  const code = await getTenantCode();
  const t = await getTranslations("admin.audit");

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-10">
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <RequirePermission action="read" resource="audit_log">
        {/* Default to the demo tenant so the sample log is visible at the
            root admin host too (pha 1 only — pha 2 always runs under a tenant). */}
        <AuditLogViewer tenantCode={code ?? "cva-edu"} />
      </RequirePermission>
    </div>
  );
}
