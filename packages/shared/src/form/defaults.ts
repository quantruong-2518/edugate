import { allFields, isNumericField, type FormSchema } from "./schema";

/**
 * Default form values for RHF. Numeric fields start `undefined` (empty number
 * input), everything else starts as an empty string so inputs are controlled
 * from first render.
 */
export function defaultValuesFor(schema: FormSchema): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const field of allFields(schema)) {
    out[field.name] = isNumericField(field) ? undefined : "";
  }
  return out;
}
