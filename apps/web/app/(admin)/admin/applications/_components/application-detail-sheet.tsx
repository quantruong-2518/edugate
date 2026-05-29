"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import type {
  Application,
  ApplicationHistoryEntry,
  Transition,
} from "@shared/admission";
import { StateActions, StateBadge, StateTimeline } from "@ui/components/admission";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@ui/components/sheet";
import { Separator } from "@ui/components/separator";

import type { FormSchema } from "@shared/form";
import { allFields } from "@shared/form";

const DATE_FORMATTER = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "✓" : "—";
  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    // File field: prefer the human filename over the opaque storage key.
    if (typeof o["name"] === "string" && typeof o["key"] === "string") {
      return o["name"] as string;
    }
    // Student lookup: "Name (code)" matches the print document's rendering.
    if (typeof o["name"] === "string" && typeof o["code"] === "string") {
      return `${o["name"]} (${o["code"]})`;
    }
    // Vietnamese address: ward, district, province.
    if (typeof o["province"] === "string") {
      return [o["ward"], o["district"], o["province"]]
        .filter((s) => typeof s === "string" && s)
        .join(", ");
    }
    return JSON.stringify(value);
  }
  return String(value);
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

export function ApplicationDetailSheet({
  application,
  formSchema,
  open,
  onOpenChange,
  onTransition,
}: {
  application: Application | null;
  formSchema: FormSchema | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Performs the optimistic state change; resolves with the updated history. */
  onTransition: (
    application: Application,
    transition: Transition,
    reason: string | null,
  ) => void;
}) {
  const t = useTranslations("admin.applications.detail");
  const tApp = useTranslations("admin.applications");
  const tRel = useTranslations("admin.applications.relationships");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setBusy(false);
  }, [application?.code]);

  if (!application) return null;

  const fieldLabels = formSchema
    ? new Map(allFields(formSchema).map((f) => [f.name, f.label]))
    : new Map<string, string>();

  // Build a label/value list from formData, preferring schema field labels.
  const formEntries = Object.entries(application.formData).filter(
    ([key]) => key !== "studentName",
  );

  const timeline: ApplicationHistoryEntry[] = application.history;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-lg"
      >
        <SheetHeader className="space-y-2 border-b p-5 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <SheetTitle className="font-mono text-base">
              {application.code}
            </SheetTitle>
            <StateBadge state={application.state} />
          </div>
          <SheetDescription>
            {t("submittedAt")}: {DATE_FORMATTER.format(new Date(application.createdAt))}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 p-5">
          {/* Applicant */}
          <section>
            <h3 className="mb-1 text-sm font-semibold">{t("applicantInfo")}</h3>
            <div className="divide-y rounded-lg border px-3">
              {application.applicant.studentFullName && (
                <DetailRow
                  label={t("studentFullName")}
                  value={application.applicant.studentFullName}
                />
              )}
              <DetailRow label={t("fullName")} value={application.applicant.fullName} />
              <DetailRow label={t("email")} value={application.applicant.email} />
              <DetailRow label={t("phone")} value={application.applicant.phone} />
              <DetailRow
                label={t("relationship")}
                value={tRel(application.applicant.relationship)}
              />
            </div>
          </section>

          {/* Form data */}
          <section>
            <h3 className="mb-1 text-sm font-semibold">{t("formData")}</h3>
            <div className="divide-y rounded-lg border px-3">
              {formEntries.map(([key, value]) => (
                <DetailRow
                  key={key}
                  label={fieldLabels.get(key) ?? key}
                  value={formatValue(value)}
                />
              ))}
            </div>
          </section>

          <Separator />

          {/* Timeline */}
          <section>
            <h3 className="mb-3 text-sm font-semibold">{t("timeline")}</h3>
            <StateTimeline
              history={timeline.map((h) => ({
                state: h.state,
                at: h.at,
                reason: h.note ?? null,
              }))}
            />
          </section>

          {/* Manual actions — driven by the state machine transitions. Never
              blocked by a guard (pha 1 UX-only gating). */}
          <section>
            <h3 className="mb-3 text-sm font-semibold">{t("actions")}</h3>
            <StateActions
              state={application.state}
              role="ADMISSION_ADMIN"
              busy={busy}
              onTransition={(transition, reason) => {
                setBusy(true);
                onTransition(application, transition, reason);
                toast.success(tApp("transitionSuccess"));
              }}
            />
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
