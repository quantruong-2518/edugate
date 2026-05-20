"use client";

import type { Control, FieldValues } from "react-hook-form";

import type { FormSchema } from "@shared/form";
import { FormBuilder } from "@ui/components/form-builder";

export function FormStep({
  schema,
  control,
}: {
  schema: FormSchema;
  control: Control<FieldValues>;
}) {
  return <FormBuilder schema={schema} control={control} />;
}
