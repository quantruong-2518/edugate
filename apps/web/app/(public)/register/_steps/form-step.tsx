"use client";

import type { Control, FieldValues } from "react-hook-form";

import type { FormSchema } from "@shared/form";
import { FormBuilder } from "@ui/components/form-builder";

import { lookupStudent } from "@/lib/api/students";

export function FormStep({
  schema,
  control,
}: {
  schema: FormSchema;
  control: Control<FieldValues>;
}) {
  return (
    <FormBuilder schema={schema} control={control} studentResolver={lookupStudent} />
  );
}
