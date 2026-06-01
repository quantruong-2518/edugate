import { parseFormSchema, type FormSchema } from "@shared/form";

import { DEFAULT_FORM_SCHEMA } from "./default";
import { NGT_FORM_SCHEMA } from "./nguyen-gia-thieu";
import { NHT_FORM_SCHEMA } from "./nguyen-huy-tuong";
import { NVH_FORM_SCHEMA } from "./nguyen-van-huyen";
import { THPT_FORM_SCHEMA } from "./tran-dai-nghia";

/**
 * Single place that maps a tenant code → its admission form definition. Adding
 * a school is a one-file change: drop `<code>.ts` exporting a `satisfies
 * FormSchema` object, then add one line below. The seam `getApplicationFormSchema`
 * (`lib/api/forms.ts`) reads this and is unchanged in pha 2 — only the source of
 * the schemas moves from these files to a DB query.
 */
const RAW_SCHEMAS: Record<string, FormSchema> = {
  "tran-dai-nghia": THPT_FORM_SCHEMA,
  "nguyen-gia-thieu": NGT_FORM_SCHEMA,
  "nguyen-huy-tuong": NHT_FORM_SCHEMA,
  "nguyen-van-huyen": NVH_FORM_SCHEMA,
};

/**
 * Validate every config against the shared meta-validator at load. A malformed
 * schema fails loud in dev (so a broken form never silently renders blank);
 * in production it is dropped to the default rather than breaking the page —
 * mirroring the resilient fallback philosophy of `getTenantBranding`.
 */
function validated(code: string, schema: FormSchema): FormSchema {
  try {
    return parseFormSchema(schema);
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      throw new Error(
        `Invalid form schema for tenant "${code}": ${String(err)}`,
      );
    }
    console.error(`Invalid form schema for tenant "${code}", using default.`, err);
    return DEFAULT_FORM_SCHEMA;
  }
}

export const DEFAULT_FORM_SCHEMA_VALIDATED = validated("default", DEFAULT_FORM_SCHEMA);

export const FORM_SCHEMA_REGISTRY: Record<string, FormSchema> = Object.fromEntries(
  Object.entries(RAW_SCHEMAS).map(([code, schema]) => [code, validated(code, schema)]),
);

export { DEFAULT_FORM_SCHEMA } from "./default";
