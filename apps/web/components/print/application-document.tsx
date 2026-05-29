import { useTranslations } from "next-intl";

import type { Application } from "@shared/admission";
import type { TenantBranding } from "@shared/branding";
import {
  allFields,
  isDisplayField,
  isFieldEmpty,
  type AddressValue,
  type FormFieldSchema,
  type FormSchema,
  type StudentLookupValue,
} from "@shared/form";
import { StateBadge, StateTimeline } from "@ui/components/admission";

import { DocSection, DocumentShell, Field } from "./document-shell";

const DATE_FORMATTER = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" });

function formatDate(value: string): string {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : DATE_FORMATTER.format(d);
}

/** Render a stored form value into a human-readable string for the document. */
function formatFieldValue(field: FormFieldSchema, value: unknown): string {
  switch (field.type) {
    case "select":
    case "radio":
      return (
        field.options.find((o) => o.value === value)?.label ?? String(value)
      );
    case "checkbox":
      if (Array.isArray(value)) {
        return value
          .map((v) => field.options.find((o) => o.value === v)?.label ?? v)
          .join(", ");
      }
      return "";
    case "date":
      return typeof value === "string" ? formatDate(value) : String(value);
    case "address": {
      const a = value as Partial<AddressValue>;
      return [a.ward, a.district, a.province].filter(Boolean).join(", ");
    }
    case "studentLookup": {
      const s = value as Partial<StudentLookupValue>;
      return s.name ? `${s.name} (${s.code})` : (s.code ?? "");
    }
    case "file": {
      // New writes carry `{ key, name }`; legacy mocks still hold a bare
      // filename string. Prefer the human name and never print the opaque key.
      if (typeof value === "string") return value;
      const f = value as { name?: string } | null | undefined;
      return f?.name ?? "";
    }
    default:
      return String(value);
  }
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
    .filter((field) => !isDisplayField(field))
    .map((field) => ({ field, value: application.formData[field.name] }))
    .filter(({ field, value }) => !isFieldEmpty(field, value));

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
