import { Suspense } from "react";

import { getApplicationFormSchema } from "@/lib/api/forms";
import { getTenantCode } from "@/lib/tenants/branding";

import { RegisterWizard } from "./_steps/register-wizard";

export default async function RegisterPage() {
  const tenantCode = (await getTenantCode()) ?? "";
  const formSchema = await getApplicationFormSchema(tenantCode);

  return (
    <main className="container mx-auto px-4 py-10">
      <Suspense>
        <RegisterWizard tenantCode={tenantCode} formSchema={formSchema} />
      </Suspense>
    </main>
  );
}
