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

import type { FormFieldSchema, FormSchema } from "@shared/form";
import { allFields } from "@shared/form";

const DATE_FORMATTER = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const DOB_FORMATTER = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

// Fields with a dedicated display. Scoring fields and file (document) fields are
// excluded dynamically from the schema, so they are not listed here.
const DEDICATED_FIELDS = new Set([
  "studentName",
  "dateOfBirth",
  "gender",
  "priorityCategory",
  "specialAchievements",
  "parentWishes",
  // Derived average — surfaced via the score column, not as a raw form answer.
  "gpa",
]);

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "Có" : "Không";
  if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : "—";
  return String(value);
}

/** Resolve a stored value to a display string, mapping option values to labels. */
function formatFieldValue(
  field: FormFieldSchema | undefined,
  value: unknown,
): string {
  if (value === null || value === undefined || value === "") return "—";
  if (field?.type === "select" || field?.type === "radio") {
    return field.options.find((o) => o.value === value)?.label ?? String(value);
  }
  if (field?.type === "checkbox" && Array.isArray(value)) {
    return value.length > 0
      ? value
          .map((v) => field.options.find((o) => o.value === v)?.label ?? String(v))
          .join(", ")
      : "—";
  }
  return formatValue(value);
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </h3>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

/** Arrow/tag-shaped priority category badge. */
function PriorityTag({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center bg-amber-100 py-1 pl-3 pr-6 text-xs font-medium text-amber-800 dark:bg-amber-950/70 dark:text-amber-200"
      style={{
        clipPath:
          "polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%)",
        borderRadius: "2px 0 0 2px",
      }}
    >
      {label}
    </span>
  );
}

/** One score chip: a short label over its value. */
function ScoreCell({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-md bg-muted/40 px-2.5 py-2 text-center">
      <div className="text-[11px] leading-tight text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-semibold tabular-nums">
        {typeof value === "number" ? value.toFixed(1) : "—"}
      </div>
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

  // Schema-derived helpers. `allFields` preserves declaration order; scoreGroups
  // keeps the section grouping so THCS grades and entrance-exam scores read as
  // separate blocks for the THPT form.
  const schemaFields = formSchema ? allFields(formSchema) : [];
  const fieldByName = new Map(schemaFields.map((f) => [f.name, f]));
  const fieldLabels = new Map(schemaFields.map((f) => [f.name, f.label]));

  // Priority category options from schema for label lookup.
  const priorityOptions: Map<string, string> = new Map();
  const priorityField = fieldByName.get("priorityCategory");
  if (priorityField?.type === "checkbox") {
    for (const opt of priorityField.options) priorityOptions.set(opt.value, opt.label);
  }

  // Scoring fields grouped by their section ("Kết quả học tập THCS", "Điểm thi
  // tuyển sinh vào 10", "Thành tích học tập"…). Empty groups are dropped.
  const scoreGroups = (formSchema?.sections ?? [])
    .map((section) => ({
      title: section.title,
      fields: section.fields.filter((f) => f.type === "scoring"),
    }))
    .filter((g) => g.fields.length > 0);
  const scoringNames = new Set(
    scoreGroups.flatMap((g) => g.fields.map((f) => f.name)),
  );

  const fd = application.formData;

  // Student basics
  const studentName =
    typeof fd["studentName"] === "string" ? fd["studentName"] : "—";
  const dob =
    typeof fd["dateOfBirth"] === "string" && fd["dateOfBirth"]
      ? (() => {
          const d = new Date(fd["dateOfBirth"] as string);
          return isNaN(d.getTime())
            ? (fd["dateOfBirth"] as string)
            : DOB_FORMATTER.format(d);
        })()
      : "—";
  const gender = fd["gender"];
  const genderLabel =
    gender === "male"
      ? t("genderMale")
      : gender === "female"
        ? t("genderFemale")
        : typeof gender === "string"
          ? gender
          : "—";

  // Priority categories
  const priorities = Array.isArray(fd["priorityCategory"])
    ? (fd["priorityCategory"] as string[])
    : [];

  // Special achievements
  const specialAchievements =
    typeof fd["specialAchievements"] === "string" && fd["specialAchievements"]
      ? fd["specialAchievements"]
      : null;

  // Parent wishes
  const parentWishes =
    typeof fd["parentWishes"] === "string" && fd["parentWishes"]
      ? fd["parentWishes"]
      : null;

  // Uploaded documents = every file field that has a stored filename.
  const docFields = schemaFields
    .filter((f) => f.type === "file" && typeof fd[f.name] === "string" && fd[f.name])
    .map((f) => f.name);

  // Remaining form data (not shown in a dedicated section above).
  const handledNames = new Set<string>([
    ...DEDICATED_FIELDS,
    ...scoringNames,
    ...docFields,
  ]);
  const otherEntries = Object.entries(fd).filter(
    ([key]) => !handledNames.has(key),
  );

  const timeline: ApplicationHistoryEntry[] = application.history;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-lg"
      >
        {/* Header */}
        <SheetHeader className="space-y-2 px-5 py-4 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <SheetTitle className="font-mono text-sm">{application.code}</SheetTitle>
            <StateBadge state={application.state} />
          </div>
          <SheetDescription className="text-xs">
            {t("submittedAt")}:{" "}
            {DATE_FORMATTER.format(new Date(application.createdAt))}
          </SheetDescription>
        </SheetHeader>

        <Separator />

        <div className="space-y-6 px-5 py-5">
          {/* Student info */}
          <section>
            <SectionHeader>{t("studentInfo")}</SectionHeader>
            <div className="space-y-0 divide-y">
              <DetailRow label={tApp("columns.student")} value={studentName} />
              <DetailRow label={t("dob")} value={dob} />
              <DetailRow label={t("gender")} value={genderLabel} />
            </div>
          </section>

          {/* Priority tags */}
          {priorities.length > 0 && (
            <section>
              <SectionHeader>{t("priorityTags")}</SectionHeader>
              <div className="flex flex-col gap-1.5">
                {priorities.map((code) => (
                  <PriorityTag
                    key={code}
                    label={priorityOptions.get(code) ?? code}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Academic record — schema-driven score grids, grouped by section */}
          {(scoreGroups.length > 0 || specialAchievements) && (
            <section>
              <SectionHeader>{t("gradeRecord")}</SectionHeader>
              <div className="space-y-3">
                {scoreGroups.map((group) => (
                  <div key={group.title}>
                    {scoreGroups.length > 1 && (
                      <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                        {group.title}
                      </p>
                    )}
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {group.fields.map((f) => (
                        <ScoreCell key={f.name} label={f.label} value={fd[f.name]} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {specialAchievements && (
                <div className="mt-3">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    {t("specialAchievements")}
                  </p>
                  <p className="text-sm">{specialAchievements}</p>
                </div>
              )}
            </section>
          )}

          {/* Applicant (submitter) */}
          <section>
            <SectionHeader>{t("applicantInfo")}</SectionHeader>
            <div className="space-y-0 divide-y">
              <DetailRow label={t("fullName")} value={application.applicant.fullName} />
              <DetailRow label={t("email")} value={application.applicant.email} />
              <DetailRow label={t("phone")} value={application.applicant.phone} />
              <DetailRow
                label={t("relationship")}
                value={tRel(application.applicant.relationship)}
              />
            </div>
          </section>

          {/* Parent wishes */}
          {parentWishes && (
            <section>
              <SectionHeader>{t("parentWishes")}</SectionHeader>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {parentWishes}
              </p>
            </section>
          )}

          {/* Documents */}
          {docFields.length > 0 && (
            <section>
              <SectionHeader>{t("documents")}</SectionHeader>
              <div className="space-y-0 divide-y">
                {docFields.map((key) => (
                  <DetailRow
                    key={key}
                    label={fieldLabels.get(key) ?? key}
                    value={String(fd[key])}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Other form data */}
          {otherEntries.length > 0 && (
            <section>
              <SectionHeader>{t("otherInfo")}</SectionHeader>
              <div className="space-y-0 divide-y">
                {otherEntries.map(([key, value]) => (
                  <DetailRow
                    key={key}
                    label={fieldLabels.get(key) ?? key}
                    value={formatFieldValue(fieldByName.get(key), value)}
                  />
                ))}
              </div>
            </section>
          )}

          <Separator />

          {/* Timeline */}
          <section>
            <SectionHeader>{t("timeline")}</SectionHeader>
            <StateTimeline
              history={timeline.map((h) => ({
                state: h.state,
                at: h.at,
                reason: h.note ?? null,
              }))}
            />
          </section>

          {/* Actions */}
          <section>
            <SectionHeader>{t("actions")}</SectionHeader>
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
