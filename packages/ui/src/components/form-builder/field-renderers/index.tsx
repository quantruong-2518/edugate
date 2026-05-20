"use client";

import type { Control, FieldValues } from "react-hook-form";

import type { FormFieldSchema } from "@shared/form";

import { DateFieldRenderer } from "./date-field";
import { FileFieldRenderer } from "./file-field";
import { NumberFieldRenderer } from "./number-field";
import { SelectFieldRenderer } from "./select-field";
import { TextFieldRenderer } from "./text-field";

export function FieldRenderer({
  field,
  control,
}: {
  field: FormFieldSchema;
  control: Control<FieldValues>;
}) {
  switch (field.type) {
    case "text":
      return <TextFieldRenderer field={field} control={control} />;
    case "number":
    case "scoring":
      return <NumberFieldRenderer field={field} control={control} />;
    case "date":
      return <DateFieldRenderer field={field} control={control} />;
    case "select":
      return <SelectFieldRenderer field={field} control={control} />;
    case "file":
      return <FileFieldRenderer field={field} control={control} />;
  }
}
