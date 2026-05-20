import { LandingSectionRenderer } from "@/components/landing/section-registry";
import { getLandingConfig } from "@/lib/api";
import { getTenantCode } from "@/lib/tenants/branding";

export default async function LandingPage() {
  const code = await getTenantCode();
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
