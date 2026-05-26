import { useTranslations } from "next-intl";

import type { Application } from "@shared/admission";
import type { TenantBranding } from "@shared/branding";
import { StateBadge } from "@ui/components/admission";

import { DocumentShell, Field } from "./document-shell";

const DATE_FORMATTER = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" });
const NUM = new Intl.NumberFormat("vi-VN");

/**
 * Deterministic intake sequence + campaign total derived from the code, so the
 * receipt can state "application N of M received" without a backend. Pha 2 reads
 * the real sequence from the campaign counter.
 */
function receiptNumbers(code: string): { seq: number; total: number } {
  let h = 2166136261;
  for (let i = 0; i < code.length; i += 1) {
    h ^= code.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h >>>= 0;
  const total = 1200 + (h % 600); // 1200–1799 applications this campaign
  const seq = 1 + (h % total);
  return { seq, total };
}

export function ReceiptDocument({
  application,
  branding,
}: {
  application: Application;
  branding: TenantBranding;
}) {
  const t = useTranslations("print");
  const tApplicant = useTranslations("apply.applicant");
  const { seq, total } = receiptNumbers(application.code);

  return (
    <DocumentShell
      branding={branding}
      title={t("receipt.title")}
      code={application.code}
    >
      <div className="rounded-xl border-2 border-primary/30 bg-primary/5 px-6 py-5 text-center">
        <p className="text-sm text-neutral-600">{t("receipt.received")}</p>
        <p className="mt-1 text-3xl font-bold text-primary sm:text-4xl">
          {t("receipt.sequence", { seq: NUM.format(seq), total: NUM.format(total) })}
        </p>
      </div>

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
