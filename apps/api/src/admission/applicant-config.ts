/**
 * Server-side mirror of the per-tenant applicant config. The FE source of
 * truth lives in `packages/shared/src/admission/applicant-config.ts` (so the
 * register wizard and a future tenant-config editor share it); this file is
 * duplicated here because the API uses NodeNext module resolution and the
 * shared package is not yet emitted with `.js` extensions. Drift risk is
 * acknowledged — pha 2 moves both reads to `tenant_configs.applicant_config`
 * in the DB and this file goes away.
 *
 * Used by ApplicationService.submit() to re-validate the relationship enum
 * and the `studentFullName` requirement so any client that bypasses the FE
 * narrowing still gets a 400 instead of a silent insert.
 */

type ApplicantRelationship =
  | "father"
  | "mother"
  | "guardian"
  | "self"
  | "other";

export type ApplicantConfig = {
  showStudentName: boolean;
  relationships: ReadonlyArray<ApplicantRelationship>;
};

const DEFAULT_RELATIONSHIPS: ReadonlyArray<ApplicantRelationship> = [
  "father",
  "mother",
  "guardian",
  "self",
];

const DEFAULT_CONFIG: ApplicantConfig = {
  showStudentName: false,
  relationships: DEFAULT_RELATIONSHIPS,
};

const TENANT_CONFIGS: Readonly<Record<string, ApplicantConfig>> = {
  "nguyen-gia-thieu": {
    showStudentName: true,
    relationships: [...DEFAULT_RELATIONSHIPS, "other"],
  },
};

export function resolveApplicantConfig(tenantCode: string): ApplicantConfig {
  if (tenantCode in TENANT_CONFIGS) {
    return TENANT_CONFIGS[tenantCode] as ApplicantConfig;
  }
  return DEFAULT_CONFIG;
}
