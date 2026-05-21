import { getTranslations } from "next-intl/server";

import { RequirePermission } from "@/components/auth/require-permission";
import { getLandingConfig } from "@/lib/api";
import type { BrandingDraft } from "@/lib/api/appearance";
import { getTenantBranding, getTenantCode } from "@/lib/tenants/branding";

import { AppearanceEditor } from "./_components/appearance-editor";

export default async function AppearanceSettingsPage() {
  const code = await getTenantCode();
  const branding = await getTenantBranding(code);
  const config = await getLandingConfig(code);
  const t = await getTranslations("admin.appearance");

  const initialBranding: BrandingDraft = {
    logoUrl: branding.logoUrl,
    radius: branding.theme.radius,
    fontSans: branding.theme.font.sans,
    primaryLight: branding.theme.light.primary,
    primaryForegroundLight: branding.theme.light.primaryForeground,
    primaryDark: branding.theme.dark.primary,
    primaryForegroundDark: branding.theme.dark.primaryForeground,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-10">
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <RequirePermission action="update" resource="tenant_config">
        <AppearanceEditor
          tenantCode={code ?? "default"}
          initialBranding={initialBranding}
          initialConfig={config}
        />
      </RequirePermission>
    </div>
  );
}
