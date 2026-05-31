import type { FormSchema } from "@shared/form";

import {
  DEFAULT_FORM_SCHEMA_VALIDATED,
  FORM_SCHEMA_REGISTRY,
} from "./form-schemas";

/**
 * Per-tenant admission form schema. The actual configs live as one file per
 * tenant in `./form-schemas/` (registered in `./form-schemas/index.ts`) and are
 * validated against the shared `formSchemaSchema` meta-validator at load.
 *
 * This stays the single swap-point for pha 1 → pha 2: the body changes from a
 * registry lookup to a Drizzle query (`SELECT schema FROM tenant_form_schemas`)
 * + `parseFormSchema(row.schema)`, while this signature and every call site stay
 * the same. Form config is plain data (not i18n), safe to read from RSC.
 */
export async function getApplicationFormSchema(
  tenantCode: string,
): Promise<FormSchema> {
  return FORM_SCHEMA_REGISTRY[tenantCode] ?? DEFAULT_FORM_SCHEMA_VALIDATED;
}
