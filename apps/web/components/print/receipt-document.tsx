import { useTranslations } from "next-intl";

import type { Application } from "@shared/admission";
import type { TenantBranding } from "@shared/branding";
import { StateBadge } from "@ui/components/admission";

import { DocumentShell, Field } from "./document-shell";

const DATE_FORMATTER = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" });

export function ReceiptDocument({
  application,
  branding,
}: {
  application: Application;
  branding: TenantBranding;
}) {
  const t = useTranslations("print");
  const tApplicant = useTranslations("apply.applicant");

  return (
    <DocumentShell
      branding={branding}
      title={t("receipt.title")}
      code={application.code}
    >
      <div className="space-y-1 text-center">
        <p className="text-xs uppercase tracking-wide text-neutral-500">
          {t("fields.code")}
        </p>
        <p className="font-mono text-3xl font-bold tracking-wider text-primary">
          {application.code}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-4">
        <Field label={tApplicant("fullName")}>
          {application.applicant.fullName}
        </Field>
        <Field label={tApplicant("relationship")}>
          {tApplicant(`relationships.${application.applicant.relationship}`)}
        </Field>
        <Field label={t("fields.submittedAt")}>
          {DATE_FORMATTER.format(new Date(application.createdAt))}
        </Field>
        <Field label={t("fields.status")}>
          <StateBadge state={application.state} />
        </Field>
      </dl>

      <p className="rounded-md bg-neutral-50 px-4 py-3 text-center text-sm text-neutral-600">
        {t("receipt.note")}
      </p>
    </DocumentShell>
  );
}
