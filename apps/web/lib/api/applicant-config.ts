import {
  resolveApplicantConfig,
  type ApplicantConfig,
} from "@shared/admission";

/**
 * RSC seam for the shared applicant config. The body is async to keep the
 * call signature compatible with the rest of `lib/api` (every other helper is
 * a Promise so the page can `await Promise.all`); the real lookup is sync in
 * `@shared/admission`.
 *
 * Pha 2: replace with a Drizzle query against `tenants.applicant_config`.
 */
export async function getApplicantConfig(
  tenantCode: string,
): Promise<ApplicantConfig> {
  return resolveApplicantConfig(tenantCode);
}

export type { ApplicantConfig };
