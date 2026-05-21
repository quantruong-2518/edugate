import { PrintView } from "@/components/print/print-view";
import { getApplicationFormSchema } from "@/lib/api/forms";
import { getTenantBranding, getTenantCode } from "@/lib/tenants/branding";

/**
 * Printable view of an application. `?doc=receipt` renders the compact receipt,
 * anything else (default) renders the full profile. Branding + form schema are
 * fetched server-side (RSC); the application itself is read client-side from
 * the mock store inside <PrintView>. Pha 2: a Puppeteer worker navigates here
 * headless to generate the stored/emailed PDF (ADR-009).
 */
export default async function ApplicationPrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ doc?: string }>;
}) {
  const { code } = await params;
  const { doc } = await searchParams;
  const tenantCode = await getTenantCode();
  const branding = await getTenantBranding(tenantCode);
  const formSchema = await getApplicationFormSchema(tenantCode ?? "");

  return (
    <PrintView
      code={decodeURIComponent(code)}
      doc={doc === "receipt" ? "receipt" : "profile"}
      branding={branding}
      formSchema={formSchema}
    />
  );
}
