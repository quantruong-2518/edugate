"use client";

import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Control, type FieldValues } from "react-hook-form";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import type { Applicant, ApplicantRelationship } from "@shared/admission";
import {
  allFields,
  defaultValuesFor,
  fieldShape,
  isDisplayField,
  isFieldEmpty,
  isFieldVisible,
  refineFields,
  type FormSchema,
  type FormValidationMessages,
} from "@shared/form";
import { Button } from "@ui/components/button";
import { Card, CardContent } from "@ui/components/card";
import { Form } from "@ui/components/form";
import { Stepper } from "@ui/components/stepper";
import { cn } from "@ui/lib/utils";

import { useCreateApplication } from "@/lib/api/queries";

import { ApplicantStep } from "./applicant-step";
import { ConfirmationStep } from "./confirmation-step";
import { FormStep } from "./form-step";
import { VerifyEmailStep } from "./verify-email-step";

const STEPS = ["applicant", "form", "verify-email", "confirmation"] as const;
type Step = (typeof STEPS)[number];

export const RELATIONSHIPS: readonly ApplicantRelationship[] = [
  "father",
  "mother",
  "guardian",
  "self",
];

function isStep(value: string | null): value is Step {
  return value !== null && (STEPS as readonly string[]).includes(value);
}

function isEmpty(value: unknown): boolean {
  return value === undefined || value === null || value === "";
}

export function RegisterWizard({
  tenantCode,
  formSchema,
}: {
  tenantCode: string;
  formSchema: FormSchema;
}) {
  const t = useTranslations("apply");
  const formT = useTranslations("form");
  const actionsT = useTranslations("common.actions");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const stepParam = searchParams.get("step");
  const step: Step = isStep(stepParam) ? stepParam : "applicant";
  const stepIndex = STEPS.indexOf(step);
  const codeParam = searchParams.get("code");

  const draftKey = `edugate:draft:register:${tenantCode || "default"}`;

  const dynamicFields = useMemo(() => allFields(formSchema), [formSchema]);

  const schema = useMemo(() => {
    const messages: FormValidationMessages = {
      required: formT("required"),
      min: (min) => formT("min", { min }),
      max: (max) => formT("max", { max }),
      email: formT("invalidEmail"),
      phone: t("applicant.invalidPhone"),
    };
    return z
      .object({
        fullName: z.string().min(1, formT("required")),
        email: z
          .string()
          .min(1, formT("required"))
          .email(t("applicant.invalidEmail")),
        phone: z
          .string()
          .min(1, formT("required"))
          .regex(/^(0|\+84)\d{9,10}$/, t("applicant.invalidPhone")),
        relationship: z.enum(["father", "mother", "guardian", "self"], {
          errorMap: () => ({ message: formT("required") }),
        }),
        ...fieldShape(formSchema),
      })
      .superRefine((data, ctx) =>
        refineFields(dynamicFields, data, ctx, messages),
      );
  }, [formSchema, dynamicFields, t, formT]);

  const defaultValues = useMemo(
    () => ({
      fullName: "",
      email: "",
      phone: "",
      relationship: "",
      ...defaultValuesFor(formSchema),
    }),
    [formSchema],
  );

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onTouched",
  });
  const control = form.control as unknown as Control<FieldValues>;
  const createApplication = useCreateApplication();

  // --- Draft hydrate (once, after mount) -----------------------------------
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(draftKey);
      if (raw) {
        form.reset({ ...defaultValues, ...(JSON.parse(raw) as object) });
        toast.info(t("draft.restored"));
      }
    } catch {
      // Ignore corrupt draft.
    }
    setHydrated(true);
    // Only on mount: draftKey/defaultValues are stable per tenant render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Draft autosave (debounced) ------------------------------------------
  useEffect(() => {
    if (!hydrated) return;
    const timers: { id: ReturnType<typeof setTimeout> | null } = { id: null };
    const sub = form.watch((values) => {
      if (timers.id) clearTimeout(timers.id);
      timers.id = setTimeout(() => {
        try {
          window.localStorage.setItem(draftKey, JSON.stringify(values));
        } catch {
          // Ignore quota / private-mode failures.
        }
      }, 500);
    });
    return () => {
      if (timers.id) clearTimeout(timers.id);
      sub.unsubscribe();
    };
  }, [form, hydrated, draftKey]);

  // --- Lightweight per-step validity (for the step guard) ------------------
  const isApplicantValid = useCallback((v: FieldValues): boolean => {
    return (
      !isEmpty(v.fullName) &&
      /.+@.+\..+/.test(String(v.email ?? "")) &&
      !isEmpty(v.phone) &&
      (RELATIONSHIPS as readonly string[]).includes(String(v.relationship))
    );
  }, []);

  const isFormValid = useCallback(
    (v: FieldValues): boolean =>
      dynamicFields.every((field) => {
        if (isDisplayField(field)) return true;
        if (!isFieldVisible(field, v)) return true;
        if (!field.required) return true;
        return !isFieldEmpty(field, v[field.name]);
      }),
    [dynamicFields],
  );

  // --- Step guard: never let ?step= jump past what the data supports -------
  useEffect(() => {
    if (!hydrated) return;
    const v = form.getValues();
    let furthest = 0;
    if (isApplicantValid(v)) furthest = 1;
    if (furthest === 1 && isFormValid(v)) furthest = 2;
    if (codeParam) furthest = 3;
    if (stepIndex > furthest) {
      router.replace(`${pathname}?step=${STEPS[furthest]}` as Route);
    }
  }, [
    hydrated,
    stepIndex,
    codeParam,
    form,
    isApplicantValid,
    isFormValid,
    pathname,
    router,
  ]);

  const goTo = (next: Step) =>
    router.push(`${pathname}?step=${next}` as Route);

  const goNext = async () => {
    const fieldsForStep =
      step === "applicant"
        ? ["fullName", "email", "phone", "relationship"]
        : step === "form"
          ? dynamicFields.map((f) => f.name)
          : [];
    const ok =
      fieldsForStep.length === 0
        ? true
        : await form.trigger(fieldsForStep as never);
    if (!ok) return;
    goTo(STEPS[stepIndex + 1] as Step);
  };

  const submit = async () => {
    const v = form.getValues();
    const dynamicNames = new Set(dynamicFields.map((f) => f.name));
    const formData = Object.fromEntries(
      Object.entries(v).filter(([key]) => dynamicNames.has(key)),
    );
    const applicant: Applicant = {
      fullName: String(v.fullName),
      email: String(v.email),
      phone: String(v.phone),
      relationship: v.relationship as ApplicantRelationship,
    };
    const application = await createApplication.mutateAsync({
      tenantCode,
      applicant,
      formData,
    });
    try {
      window.localStorage.removeItem(draftKey);
    } catch {
      // Ignore.
    }
    router.replace(
      `${pathname}?step=confirmation&code=${application.code}` as Route,
    );
  };

  const labelFor = (id: Step) =>
    t(`steps.${id === "verify-email" ? "verifyEmail" : id}`);
  const stepperSteps = STEPS.map((id) => ({
    id,
    label: labelFor(id),
    description: t(`hints.${id === "verify-email" ? "verifyEmail" : id}`),
  }));
  const total = STEPS.length;

  // Live per-step validity drives the Next button's enabled state. `watch()`
  // re-renders on every change so the gate tracks the form in real time.
  const watched = form.watch();
  const canAdvance =
    step === "applicant"
      ? isApplicantValid(watched)
      : step === "form"
        ? isFormValid(watched)
        : false;

  // Confirmation is a terminal success screen — no rail, progress, or nav.
  if (step === "confirmation") {
    return (
      <div className="mx-auto w-full max-w-xl">
        <Card className="rounded-2xl">
          <CardContent className="p-6 sm:p-8">
            <Form {...form}>
              <ConfirmationStep code={codeParam ?? ""} />
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-12">
        {/* Desktop side rail: title + vertical progress + reassurance */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-8">
            <div className="space-y-1.5">
              <h1 className="text-xl font-semibold tracking-tight">
                {t("title")}
              </h1>
              <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
            </div>
            <Stepper
              steps={stepperSteps}
              current={stepIndex}
              orientation="vertical"
            />
            <div className="flex items-start gap-2 rounded-lg border border-dashed bg-muted/40 p-3 text-xs text-muted-foreground">
              <ShieldCheck
                className="mt-0.5 size-4 shrink-0 text-primary"
                aria-hidden
              />
              <span>{t("autosave")}</span>
            </div>
          </div>
        </aside>

        {/* Main column */}
        <div className="space-y-5">
          {/* Mobile/tablet progress header */}
          <div className="space-y-3 lg:hidden">
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-lg font-semibold tracking-tight">
                {t("title")}
              </h1>
              <span className="shrink-0 text-xs font-medium text-muted-foreground">
                {t("stepOf", { current: stepIndex + 1, total })}
              </span>
            </div>
            <div className="flex gap-1.5" aria-hidden>
              {STEPS.map((id, i) => (
                <span
                  key={id}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-colors",
                    i <= stepIndex ? "bg-primary" : "bg-border",
                  )}
                />
              ))}
            </div>
            <p className="text-sm font-medium text-foreground">
              {stepperSteps[stepIndex]?.label}
            </p>
          </div>

          <Card className="rounded-2xl">
            <CardContent className="p-5 sm:p-7">
              <Form {...form}>
                {step === "applicant" && <ApplicantStep control={control} />}
                {step === "form" && (
                  <FormStep schema={formSchema} control={control} />
                )}
                {step === "verify-email" && (
                  <VerifyEmailStep
                    email={String(form.getValues("email"))}
                    onSubmit={submit}
                  />
                )}
              </Form>
            </CardContent>
          </Card>

          {/* Navigation: sticky thumb bar on mobile, inline on desktop */}
          <div className="sticky bottom-0 z-10 -mx-4 flex items-center justify-between gap-3 border-t bg-background/80 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:mx-0 sm:rounded-xl sm:border sm:px-4 lg:static lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
            {stepIndex > 0 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                <ChevronLeft className="size-4" aria-hidden />
                {actionsT("back")}
              </Button>
            ) : (
              <span />
            )}
            {stepIndex < 2 && (
              <Button
                type="button"
                onClick={goNext}
                disabled={!canAdvance}
              >
                {actionsT("next")}
                <ChevronRight className="size-4" aria-hidden />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
