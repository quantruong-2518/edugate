import type { ApplicantRelationship } from "@shared/admission";

/**
 * Per-tenant tweaks to the built-in applicant step of the register wizard.
 * The wizard step is not part of the configurable FormBuilder (those live in
 * `getApplicationFormSchema`), so tenants that need a different opener — extra
 * field, extra relationship option, top-of-page notice — opt in here.
 *
 * Pha 2: move to a `tenants.applicant_config` JSON column. The returned shape
 * stays this `ApplicantConfig` so the wizard does not change.
 */
export type ApplicantConfig = {
  /** Show a "student full name" input above the parent's name. */
  showStudentName: boolean;
  /** Relationship options offered in the select. Order is honoured. */
  relationships: ReadonlyArray<ApplicantRelationship>;
  /** Optional red marquee shown above the wizard (e.g. legal disclaimer). */
  noticeBanner?: string;
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

const NGT_CONFIG: ApplicantConfig = {
  showStudentName: true,
  relationships: [...DEFAULT_RELATIONSHIPS, "other"],
  noticeBanner:
    "Phụ huynh vui lòng cam kết và chịu trách nhiệm về tính chính xác của hồ sơ (bao gồm học bạ và thông tin cư trú). Trong trường hợp phát hiện thông tin không hợp lệ hoặc sai lệch so với quy định, nhà trường xin phép từ chối tiếp nhận học sinh, kể cả khi đã có kết quả trúng tuyển.",
};

const TENANT_CONFIGS: Readonly<Record<string, ApplicantConfig>> = {
  "nguyen-gia-thieu": NGT_CONFIG,
};

export async function getApplicantConfig(
  tenantCode: string,
): Promise<ApplicantConfig> {
  if (tenantCode in TENANT_CONFIGS) {
    return TENANT_CONFIGS[tenantCode] as ApplicantConfig;
  }
  return DEFAULT_CONFIG;
}
