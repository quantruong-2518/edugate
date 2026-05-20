/**
 * JSON-schema model for the configurable admission form (FormBuilder, task 10).
 * Stored per-campaign in the DB (pha 2) so a school can change its form without
 * a redeploy. Shared between the renderer (`@ui/form-builder`) and the Zod
 * builder (`build-zod.ts`).
 *
 * Field values are JSON-serializable on purpose (draft auto-save + mock store):
 * text/select/date/file → string, number/scoring → number. A `file` field
 * stores the filename only in pha 1; real upload lands in pha 2.
 */

export const FORM_FIELD_TYPES = [
  "text",
  "number",
  "date",
  "select",
  "file",
  "scoring",
] as const;

export type FormFieldType = (typeof FORM_FIELD_TYPES)[number];

/** Conditional visibility against a sibling field's value. */
export type VisibleWhen =
  | { field: string; op: "eq" | "ne"; value: string | number | boolean }
  | { field: string; op: "in"; value: Array<string | number> }
  | { field: string; op: "nonEmpty" };

type FieldBase = {
  name: string;
  label: string;
  required?: boolean;
  description?: string;
  placeholder?: string;
  visibleWhen?: VisibleWhen;
  /** Grid span on >=sm screens. Defaults to full width (2). */
  colSpan?: 1 | 2;
};

export type TextField = FieldBase & {
  type: "text";
  multiline?: boolean;
  maxLength?: number;
};

export type NumberField = FieldBase & {
  type: "number";
  min?: number;
  max?: number;
  step?: number;
};

export type DateField = FieldBase & {
  type: "date";
  /** ISO date strings (YYYY-MM-DD). */
  min?: string;
  max?: string;
};

export type SelectOption = { value: string; label: string };

export type SelectField = FieldBase & {
  type: "select";
  options: SelectOption[];
};

export type FileField = FieldBase & {
  type: "file";
  accept?: string;
};

export type ScoringField = FieldBase & {
  type: "scoring";
  min: number;
  max: number;
  step?: number;
};

export type FormFieldSchema =
  | TextField
  | NumberField
  | DateField
  | SelectField
  | FileField
  | ScoringField;

export type FormSection = {
  title?: string;
  description?: string;
  fields: FormFieldSchema[];
};

export type FormSchema = {
  sections: FormSection[];
};

/** Flatten every field across sections (validation, defaults). */
export function allFields(schema: FormSchema): FormFieldSchema[] {
  return schema.sections.flatMap((section) => section.fields);
}

const NUMERIC_TYPES: ReadonlySet<FormFieldType> = new Set(["number", "scoring"]);

export function isNumericField(field: FormFieldSchema): boolean {
  return NUMERIC_TYPES.has(field.type);
}

/** Evaluate a visibility condition against the depended-on field's value. */
export function evalVisibility(cond: VisibleWhen, depValue: unknown): boolean {
  switch (cond.op) {
    case "eq":
      return depValue === cond.value;
    case "ne":
      return depValue !== cond.value;
    case "in":
      return cond.value.includes(depValue as string | number);
    case "nonEmpty":
      return depValue !== undefined && depValue !== null && depValue !== "";
  }
}

/** Whole-form visibility check used by the Zod builder. */
export function isFieldVisible(
  field: FormFieldSchema,
  values: Record<string, unknown>,
): boolean {
  if (!field.visibleWhen) return true;
  return evalVisibility(field.visibleWhen, values[field.visibleWhen.field]);
}
