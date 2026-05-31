import { z } from "zod";

import {
  allFields,
  isDisplayField,
  isFieldEmpty,
  isFieldVisible,
  isNumericField,
  type FormFieldSchema,
  type FormSchema,
} from "./schema";

/**
 * Validation messages injected by the caller so copy stays behind next-intl at
 * the edge (the apply page passes `t('form.*')`). Defaults are Vietnamese
 * fallbacks — same convention as the hardcoded VI labels in `admission/states.ts`
 * that task 14 will move behind i18n keys. The non-`required/min/max` fields are
 * optional so existing callers keep compiling; they fall back to the defaults.
 */
export type FormValidationMessages = {
  required: string;
  min: (min: number) => string;
  max: (max: number) => string;
  email?: string;
  phone?: string;
  minSelected?: (n: number) => string;
  maxSelected?: (n: number) => string;
};

export const DEFAULT_FORM_MESSAGES: Required<FormValidationMessages> = {
  required: "Trường này là bắt buộc",
  min: (min) => `Giá trị tối thiểu là ${min}`,
  max: (max) => `Giá trị tối đa là ${max}`,
  email: "Email không hợp lệ",
  phone: "Số điện thoại không hợp lệ",
  minSelected: (n) => `Chọn ít nhất ${n} mục`,
  maxSelected: (n) => `Chọn tối đa ${n} mục`,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VN_PHONE_RE = /^(0|\+84)\d{9,10}$/;

function fieldBaseZod(field: FormFieldSchema): z.ZodTypeAny {
  // Optional at the base; required/range is enforced by `refineFields` only when
  // the field is visible, so a hidden field never blocks submit.
  if (isNumericField(field)) return z.number().optional();
  if (field.type === "checkbox") return z.array(z.string()).default([]);
  if (field.type === "address") {
    return z
      .object({
        province: z.string(),
        district: z.string(),
        ward: z.string(),
      })
      .partial()
      .optional();
  }
  if (field.type === "studentLookup") {
    return z
      .object({
        code: z.string(),
        name: z.string(),
        dob: z.string(),
        gender: z.string(),
      })
      .partial()
      .optional();
  }
  if (field.type === "file") {
    // New writes produce `{ key, name }`; legacy drafts may still hold a bare
    // filename string. Accept both — `isFieldEmpty` enforces non-empty when
    // the field is required.
    return z
      .union([
        z.object({ key: z.string(), name: z.string() }).partial(),
        z.string(),
      ])
      .optional()
      .default("");
  }
  if (field.type === "gradeTable") {
    return z.record(z.string()).optional().default({});
  }
  return z.string().optional().default("");
}

/**
 * Per-field base Zod shape as a plain record (no `.superRefine`, so it stays
 * mergeable). The apply wizard (task 12) spreads this alongside a static
 * declarant shape into one `z.object`, then runs `refineFields` in a single
 * `.superRefine`. `buildZodSchema` below composes the same two pieces.
 * Display-only fields (headings) carry no value and are skipped.
 */
export function fieldShape(schema: FormSchema): Record<string, z.ZodTypeAny> {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of allFields(schema)) {
    if (isDisplayField(field)) continue;
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
  const msg = { ...DEFAULT_FORM_MESSAGES, ...messages };

  for (const field of fields) {
    if (isDisplayField(field)) continue;
    if (!isFieldVisible(field, data)) continue;

    const value = data[field.name];
    const empty = isFieldEmpty(field, value);

    if (field.required && empty) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [field.name],
        message: msg.required,
      });
      continue;
    }
    if (empty) continue;

    switch (field.type) {
      case "number":
      case "scoring":
        if (typeof value === "number") {
          if (typeof field.min === "number" && value < field.min) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [field.name],
              message: msg.min(field.min),
            });
          }
          if (typeof field.max === "number" && value > field.max) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [field.name],
              message: msg.max(field.max),
            });
          }
        }
        break;
      case "email":
        if (!EMAIL_RE.test(String(value))) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [field.name],
            message: msg.email,
          });
        }
        break;
      case "phone":
        if (!VN_PHONE_RE.test(String(value))) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [field.name],
            message: msg.phone,
          });
        }
        break;
      case "checkbox": {
        const count = Array.isArray(value) ? value.length : 0;
        if (typeof field.minSelected === "number" && count < field.minSelected) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [field.name],
            message: msg.minSelected(field.minSelected),
          });
        }
        if (typeof field.maxSelected === "number" && count > field.maxSelected) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [field.name],
            message: msg.maxSelected(field.maxSelected),
          });
        }
        break;
      }
      default:
        break;
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
