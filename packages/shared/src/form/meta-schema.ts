/**
 * Zod **meta-validator** for the form *definition* (`FormSchema`) — the config a
 * school authors, NOT the applicant's answers. (Answer validation lives in
 * `build-zod.ts`; keep the two apart.)
 *
 * One source of truth for "is this a well-formed form?", used by:
 *  - pha 1: validating the per-tenant config files in `lib/api/form-schemas/`
 *    at load time (fail loud on a malformed schema instead of rendering blanks);
 *  - pha 2: validating the JSONB form config read from the DB / posted by the
 *    future admin form-builder before it ever reaches the renderer.
 *
 * Mirrors the hand-written types in `./schema.ts`. The `parseFormSchema` return
 * is deliberately uncast: if this validator ever drifts from `FormSchema`, the
 * uncast return stops compiling — that mismatch is the drift guard.
 */

import { z } from "zod";

import { FORM_FIELD_TYPES, type FormSchema } from "./schema";

const selectOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
});

const visibleWhenSchema = z.union([
  z.object({
    field: z.string(),
    op: z.enum(["eq", "ne"]),
    value: z.union([z.string(), z.number(), z.boolean()]),
  }),
  z.object({
    field: z.string(),
    op: z.literal("in"),
    value: z.array(z.union([z.string(), z.number()])),
  }),
  z.object({
    field: z.string(),
    op: z.literal("nonEmpty"),
  }),
]);

/** Shared `FieldBase` props, spread into every field-type branch. */
const fieldBase = {
  name: z.string(),
  label: z.string(),
  required: z.boolean().optional(),
  description: z.string().optional(),
  placeholder: z.string().optional(),
  visibleWhen: visibleWhenSchema.optional(),
  colSpan: z.union([z.literal(1), z.literal(2)]).optional(),
};

const fieldSchema = z.discriminatedUnion("type", [
  z.object({
    ...fieldBase,
    type: z.literal("text"),
    multiline: z.boolean().optional(),
    maxLength: z.number().optional(),
  }),
  z.object({
    ...fieldBase,
    type: z.literal("number"),
    min: z.number().optional(),
    max: z.number().optional(),
    step: z.number().optional(),
  }),
  z.object({
    ...fieldBase,
    type: z.literal("date"),
    min: z.string().optional(),
    max: z.string().optional(),
  }),
  z.object({
    ...fieldBase,
    type: z.literal("select"),
    options: z.array(selectOptionSchema),
  }),
  z.object({
    ...fieldBase,
    type: z.literal("file"),
    accept: z.string().optional(),
    photoPreview: z.boolean().optional(),
  }),
  z.object({
    ...fieldBase,
    type: z.literal("scoring"),
    min: z.number(),
    max: z.number(),
    step: z.number().optional(),
  }),
  z.object({ ...fieldBase, type: z.literal("email") }),
  z.object({ ...fieldBase, type: z.literal("phone") }),
  z.object({
    ...fieldBase,
    type: z.literal("radio"),
    options: z.array(selectOptionSchema),
  }),
  z.object({
    ...fieldBase,
    type: z.literal("checkbox"),
    options: z.array(selectOptionSchema),
    minSelected: z.number().optional(),
    maxSelected: z.number().optional(),
  }),
  z.object({ ...fieldBase, type: z.literal("address") }),
  z.object({
    // heading is display-only: omits `required` / `placeholder`.
    name: z.string(),
    label: z.string(),
    description: z.string().optional(),
    visibleWhen: visibleWhenSchema.optional(),
    colSpan: z.union([z.literal(1), z.literal(2)]).optional(),
    type: z.literal("heading"),
    body: z.string().optional(),
  }),
  z.object({ ...fieldBase, type: z.literal("studentLookup") }),
  z.object({
    ...fieldBase,
    type: z.literal("gradeTable"),
    rows: z.array(z.object({ name: z.string(), label: z.string() })),
    options: z.array(selectOptionSchema),
  }),
]);

// Cheap sanity check that the union covers exactly the declared field types —
// a new entry in `FORM_FIELD_TYPES` without a branch here is a config-validator
// blind spot, so surface it at module load in dev.
const COVERED_TYPES = new Set(fieldSchema.options.map((o) => o.shape.type.value));
const MISSING_TYPES = FORM_FIELD_TYPES.filter((t) => !COVERED_TYPES.has(t));
if (MISSING_TYPES.length > 0) {
  // Structural (not runtime) check: a field type declared in FORM_FIELD_TYPES
  // without a branch above is a config-validator blind spot. Surface it loudly.
  throw new Error(
    `formSchemaSchema is missing field-type branches: ${MISSING_TYPES.join(", ")}`,
  );
}

const formSectionSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  fields: z.array(fieldSchema),
  layout: z.literal("photo-profile").optional(),
});

/** Validator for a whole form definition. */
export const formSchemaSchema = z.object({
  notice: z.string().optional(),
  sections: z.array(formSectionSchema),
});

/**
 * Validate an untrusted form definition (config file in pha 1, DB JSONB in pha
 * 2). Throws `ZodError` on a malformed schema. The return is intentionally
 * uncast — see the file header.
 */
export function parseFormSchema(input: unknown): FormSchema {
  return formSchemaSchema.parse(input);
}
