import { LandingSectionRenderer } from "@/components/landing/section-registry";
import { MarketingHome } from "@/components/marketing/marketing-home";
import { getLandingConfig } from "@/lib/api";
import { getTenantCode } from "@/lib/tenants/branding";

export default async function LandingPage() {
  const code = await getTenantCode();

  // Root host (no tenant) → the Ghi Danh product marketing site. A resolved
  // tenant → that school's configurable admission landing.
  if (!code) return <MarketingHome />;

  const config = await getLandingConfig(code);

  return (
    <main>
      {config.sections.map((section, index) => (
        <LandingSectionRenderer
          key={`${section.type}-${index}`}
          section={section}
        />
      ))}
    </main>
  );
}
