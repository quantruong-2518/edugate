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
  // Optional at the base; required/range is enforced by `refineFields` only when
  // the field is visible, so a hidden field never blocks submit.
  if (isNumericField(field)) return z.number().optional();
  return z.string().optional().default("");
}

function isEmpty(value: unknown): boolean {
  return value === undefined || value === null || value === "";
}

/**
 * Per-field base Zod shape as a plain record (no `.superRefine`, so it stays
 * mergeable). The apply wizard (task 12) spreads this alongside a static
 * declarant shape into one `z.object`, then runs `refineFields` in a single
 * `.superRefine`. `buildZodSchema` below composes the same two pieces.
 */
export function fieldShape(schema: FormSchema): Record<string, z.ZodTypeAny> {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of allFields(schema)) {
    shape[field.name] = fieldBaseZod(field);
  }
  return shape;
}

/**
 * Enforce required-when-visible + numeric `min`/`max` for a set of fields
 * inside a caller-owned `.superRefine`. Hidden fields are skipped so they
 * never block submit.
 */
export function refineFields(
  fields: FormFieldSchema[],
  data: Record<string, unknown>,
  ctx: z.RefinementCtx,
  messages: FormValidationMessages = DEFAULT_FORM_MESSAGES,
): void {
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
  return z.object(fieldShape(schema)).superRefine((data, ctx) => {
    refineFields(fields, data, ctx, messages);
  });
}

export type BuiltFormValues = z.infer<ReturnType<typeof buildZodSchema>>;
