import { z } from "zod";

import {
  allFields,
  isFieldVisible,
  isNumericField,
  type FormFieldSchema,
  type FormSchema,
} from "./schema";

/**
 * Validation messages injected by the caller so copy stays behind next-intl at
 * the edge (the apply page passes `t('form.*')`). Defaults are Vietnamese
 * fallbacks — same convention as the hardcoded VI labels in `admission/states.ts`
 * that task 14 will move behind i18n keys.
 */
export type FormValidationMessages = {
  required: string;
  min: (min: number) => string;
  max: (max: number) => string;
};

export const DEFAULT_FORM_MESSAGES: FormValidationMessages = {
  required: "Trường này là bắt buộc",
  min: (min) => `Giá trị tối thiểu là ${min}`,
  max: (max) => `Giá trị tối đa là ${max}`,
};

function fieldBaseZod(field: FormFieldSchema): z.ZodTypeAny {
  // Optional at the base; required/range is enforced by the superRefine below
  // only when the field is visible, so a hidden field never blocks submit.
  if (isNumericField(field)) return z.number().optional();
  return z.string().optional().default("");
}

function isEmpty(value: unknown): boolean {
  return value === undefined || value === null || value === "";
}

/**
 * Build a Zod schema from a `FormSchema`. Required fields are only enforced when
 * visible; numeric `min`/`max` validate when a value is present.
 */
export function buildZodSchema(
  schema: FormSchema,
  messages: FormValidationMessages = DEFAULT_FORM_MESSAGES,
) {
  const fields = allFields(schema);
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of fields) {
    shape[field.name] = fieldBaseZod(field);
  }

  return z.object(shape).superRefine((data, ctx) => {
    for (const field of fields) {
      if (!isFieldVisible(field, data)) continue;

      const value = data[field.name];

      if (field.required && isEmpty(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field.name],
          message: messages.required,
        });
        continue;
      }

      if (
        !isEmpty(value) &&
        (field.type === "number" || field.type === "scoring") &&
        typeof value === "number"
      ) {
        if (typeof field.min === "number" && value < field.min) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [field.name],
            message: messages.min(field.min),
          });
        }
        if (typeof field.max === "number" && value > field.max) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [field.name],
            message: messages.max(field.max),
          });
        }
      }
    }
  });
}

export type BuiltFormValues = z.infer<ReturnType<typeof buildZodSchema>>;
