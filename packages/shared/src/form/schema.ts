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
  "email",
  "phone",
  "radio",
  "checkbox",
  "address",
  "heading",
  "studentLookup",
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

/**
 * The persisted value of a `file` field. `key` is the opaque storage key
 * (R2 object key in pha 2); `name` is the human filename so receipts/print
 * docs / admin views display something parents recognise. Both must be set
 * for the field to count as non-empty.
 */
export type FileValue = {
  key: string;
  name: string;
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

/** Single-line text with email-format validation. */
export type EmailField = FieldBase & { type: "email" };

/** Single-line text with Vietnamese phone-format validation. */
export type PhoneField = FieldBase & { type: "phone" };

/** Single choice rendered as radio buttons. Value: the chosen option value. */
export type RadioField = FieldBase & {
  type: "radio";
  options: SelectOption[];
};

/** Multiple choice rendered as checkboxes. Value: array of option values. */
export type CheckboxField = FieldBase & {
  type: "checkbox";
  options: SelectOption[];
  /** Optional bounds on how many options must/may be selected. */
  minSelected?: number;
  maxSelected?: number;
};

/** Cascading Vietnamese administrative address (province → district → ward). */
export type AddressValue = {
  province: string;
  district: string;
  ward: string;
};

export type AddressField = FieldBase & { type: "address" };

/**
 * Display-only block — a section heading + optional body. Carries no value and
 * is excluded from defaults/validation/submitted data. Used to group and guide.
 */
export type HeadingField = Omit<FieldBase, "required" | "placeholder"> & {
  type: "heading";
  /** Optional supporting text under the heading. */
  body?: string;
};

/**
 * Student-code lookup: the parent enters the MOET-issued student code and the
 * field fetches + displays the matching student (name / DOB / gender). The
 * resolved record is the stored value; an unresolved code counts as empty.
 */
export type StudentLookupValue = {
  code: string;
  name?: string;
  dob?: string;
  gender?: string;
};

export type StudentLookupField = FieldBase & { type: "studentLookup" };

export type FormFieldSchema =
  | TextField
  | NumberField
  | DateField
  | SelectField
  | FileField
  | ScoringField
  | EmailField
  | PhoneField
  | RadioField
  | CheckboxField
  | AddressField
  | HeadingField
  | StudentLookupField;

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

/** Display-only fields carry no value (excluded from defaults/validation/data). */
export function isDisplayField(
  field: FormFieldSchema,
): field is HeadingField {
  return field.type === "heading";
}

/**
 * Type-aware emptiness check. Centralizes how each field type represents "no
 * answer" so the Zod builder and the apply wizard's step guard agree:
 * arrays (checkbox) are empty when length 0, address is empty unless all three
 * parts are filled, numbers are empty only when nullish.
 */
export function isFieldEmpty(field: FormFieldSchema, value: unknown): boolean {
  switch (field.type) {
    case "checkbox":
      return !Array.isArray(value) || value.length === 0;
    case "address": {
      const addr = value as Partial<AddressValue> | null | undefined;
      return !addr || !addr.province || !addr.district || !addr.ward;
    }
    case "studentLookup": {
      const s = value as Partial<StudentLookupValue> | null | undefined;
      return !s || !s.code || !s.name;
    }
    case "file": {
      // Tolerate the legacy plain-string shape (pha-1 mocks stored filename
      // only) so existing drafts/seed data still validate. New writes always
      // produce { key, name }.
      if (typeof value === "string") return value === "";
      const f = value as Partial<FileValue> | null | undefined;
      return !f || !f.key || !f.name;
    }
    case "number":
    case "scoring":
      return value === undefined || value === null;
    case "heading":
      return false;
    default:
      return value === undefined || value === null || value === "";
  }
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
      if (Array.isArray(depValue)) return depValue.length > 0;
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
