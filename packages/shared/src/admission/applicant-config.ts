import type { ApplicantRelationship } from "./application";

/**
 * Per-tenant tweaks to the built-in applicant step of the register wizard
 * AND the server-side allowlist enforced when an application is submitted.
 * The FE narrowing (select options, required-field hint) is UX-only; the
 * BE re-checks against the same config so any client that bypasses the UI
 * (devtools, curl, future SDK) cannot lie about its tenant's rules.
 *
 * Pha 2: move to a `tenants.applicant_config` JSONB column. The returned
 * shape stays this `ApplicantConfig` so both surfaces keep working.
 */
export type ApplicantConfig = {
  /** Tenant collects the student's full name on the applicant step (required when true). */
  showStudentName: boolean;
  /** Relationship options allowed for this tenant. Order is honoured in the FE select. */
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

const NHT_CONFIG: ApplicantConfig = {
  showStudentName: true,
  relationships: [...DEFAULT_RELATIONSHIPS, "other"],
  noticeBanner:
    "Phụ huynh vui lòng cam kết và chịu trách nhiệm về tính chính xác của hồ sơ (học bạ và thông tin cư trú). Nếu phát hiện thông tin không hợp lệ hoặc sai lệch so với quy định, nhà trường có quyền từ chối tiếp nhận học sinh, kể cả khi đã có kết quả trúng tuyển.",
};

const TENANT_CONFIGS: Readonly<Record<string, ApplicantConfig>> = {
  "nguyen-gia-thieu": NGT_CONFIG,
  "nguyen-huy-tuong": NHT_CONFIG,
};

/** Sync lookup — both the RSC page (FE) and the Nest service (BE) call this. */
export function resolveApplicantConfig(tenantCode: string): ApplicantConfig {
  if (tenantCode in TENANT_CONFIGS) {
    return TENANT_CONFIGS[tenantCode] as ApplicantConfig;
  }
  return DEFAULT_CONFIG;
}
