import { Suspense } from "react";

import { getApplicantConfig } from "@/lib/api/applicant-config";
import { getApplicationFormSchema } from "@/lib/api/forms";
import { getTenantCode } from "@/lib/tenants/branding";

import { NoticeBanner } from "./_steps/notice-banner";
import { RegisterWizard } from "./_steps/register-wizard";

export default async function RegisterPage() {
  const tenantCode = (await getTenantCode()) ?? "";
  const [formSchema, applicantConfig] = await Promise.all([
    getApplicationFormSchema(tenantCode),
    getApplicantConfig(tenantCode),
  ]);

  return (
    <>
      {applicantConfig.noticeBanner && (
        <NoticeBanner text={applicantConfig.noticeBanner} />
      )}
      <main className="container mx-auto px-4 py-12 sm:px-6 sm:py-16">
        <Suspense>
          <RegisterWizard
            tenantCode={tenantCode}
            formSchema={formSchema}
            applicantConfig={applicantConfig}
          />
        </Suspense>
      </main>
    </>
  );
}
