import { useTranslations } from "next-intl";

import type { Application } from "@shared/admission";
import type { TenantBranding } from "@shared/branding";
import { allFields, type FormFieldSchema, type FormSchema } from "@shared/form";
import { StateBadge, StateTimeline } from "@ui/components/admission";

import { DocSection, DocumentShell, Field } from "./document-shell";

const DATE_FORMATTER = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" });

function formatDate(value: string): string {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : DATE_FORMATTER.format(d);
}

/** Render a stored form value into a human-readable string for the document. */
function formatFieldValue(field: FormFieldSchema, value: unknown): string {
  if (field.type === "select") {
    return field.options.find((o) => o.value === value)?.label ?? String(value);
  }
  if (field.type === "date" && typeof value === "string") {
    return formatDate(value);
  }
  return String(value);
}

export function ApplicationDocument({
  application,
  branding,
  formSchema,
}: {
  application: Application;
  branding: TenantBranding;
  formSchema: FormSchema;
}) {
  const t = useTranslations("print");
  const tApplicant = useTranslations("apply.applicant");

  const answered = allFields(formSchema)
    .map((field) => ({ field, value: application.formData[field.name] }))
    .filter(({ value }) => value !== undefined && value !== null && value !== "");

  return (
    <DocumentShell
      branding={branding}
      title={t("profile.title")}
      code={application.code}
    >
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Field label={t("fields.status")}>
          <StateBadge state={application.state} />
        </Field>
        <Field label={t("fields.submittedAt")}>
          {formatDate(application.createdAt)}
        </Field>
      </dl>

      <DocSection title={t("profile.declarant")}>
        <dl className="grid grid-cols-2 gap-4">
          <Field label={tApplicant("fullName")}>
            {application.applicant.fullName}
          </Field>
          <Field label={tApplicant("relationship")}>
            {tApplicant(`relationships.${application.applicant.relationship}`)}
          </Field>
          <Field label={tApplicant("email")}>{application.applicant.email}</Field>
          <Field label={tApplicant("phone")}>{application.applicant.phone}</Field>
        </dl>
      </DocSection>

      {answered.length > 0 && (
        <DocSection title={t("profile.formData")}>
          <dl className="grid grid-cols-2 gap-4">
            {answered.map(({ field, value }) => (
              <Field key={field.name} label={field.label}>
                {formatFieldValue(field, value)}
              </Field>
            ))}
          </dl>
        </DocSection>
      )}

      {application.history.length > 0 && (
        <DocSection title={t("profile.history")}>
          <StateTimeline
            history={application.history.map((entry) => ({
              state: entry.state,
              at: entry.at,
              reason: entry.note,
            }))}
          />
        </DocSection>
      )}
    </DocumentShell>
  );
}
