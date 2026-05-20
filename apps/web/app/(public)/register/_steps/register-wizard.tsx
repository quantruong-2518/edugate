"use client";

import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Control, type FieldValues } from "react-hook-form";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { z } from "zod";

import type { Applicant, ApplicantRelationship } from "@shared/admission";
import {
  allFields,
  defaultValuesFor,
  fieldShape,
  isFieldVisible,
  refineFields,
  type FormSchema,
  type FormValidationMessages,
} from "@shared/form";
import { Button } from "@ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@ui/components/card";
import { Form } from "@ui/components/form";
import { Stepper } from "@ui/components/stepper";

import { createApplication } from "@/lib/api/admission";

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
        if (!isFieldVisible(field, v)) return true;
        if (!field.required) return true;
        return !isEmpty(v[field.name]);
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
    const application = await createApplication({
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

  const stepperSteps = STEPS.map((id) => ({
    id,
    label: t(`steps.${id === "verify-email" ? "verifyEmail" : id}`),
  }));

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader className="space-y-6">
        <CardTitle className="text-xl">{t("title")}</CardTitle>
        <Stepper steps={stepperSteps} current={stepIndex} />
      </CardHeader>
      <CardContent className="space-y-6">
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
          {step === "confirmation" && (
            <ConfirmationStep code={codeParam ?? ""} />
          )}
        </Form>

        {step !== "confirmation" && (
          <div className="flex items-center justify-between gap-3 pt-2">
            {stepIndex > 0 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                {actionsT("back")}
              </Button>
            ) : (
              <span />
            )}
            {stepIndex < 2 && (
              <Button type="button" onClick={goNext}>
                {actionsT("next")}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
