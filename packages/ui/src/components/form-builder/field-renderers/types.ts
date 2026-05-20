import type { Control, FieldValues } from "react-hook-form";

import type { FormFieldSchema } from "@shared/form";

export type FieldProps<T extends FormFieldSchema = FormFieldSchema> = {
  field: T;
  control: Control<FieldValues>;
};
