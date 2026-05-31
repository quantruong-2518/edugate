import {
  allFields,
  isDisplayField,
  isNumericField,
  type FormSchema,
} from "./schema";

/**
 * Default form values for RHF. Numeric fields start `undefined` (empty number
 * input), checkbox groups start as an empty array, address as an empty object,
 * everything else as an empty string so inputs are controlled from first
 * render. Display-only fields (headings) carry no value and are skipped.
 */
export function defaultValuesFor(schema: FormSchema): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const field of allFields(schema)) {
    if (isDisplayField(field)) continue;
    if (field.type === "checkbox") {
      out[field.name] = [];
    } else if (field.type === "address") {
      out[field.name] = { province: "", district: "", ward: "" };
    } else if (field.type === "studentLookup") {
      out[field.name] = { code: "" };
    } else if (field.type === "gradeTable") {
      out[field.name] = {};
    } else {
      out[field.name] = isNumericField(field) ? undefined : "";
    }
  }
  return out;
}
