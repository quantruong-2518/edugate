import type { ApplicationState } from "./states.js";

/**
 * Admission application entity. Shared between FE (mock store + track page) and
 * pha 2 BE (Drizzle row + API payload) — keep the shape framework-agnostic.
 * `formData` holds the dynamic answers produced by the FormBuilder (task 10);
 * its shape is per-campaign so it stays an open record here.
 */
export type ApplicationCode = string;

export type ApplicantRelationship =
  | "father"
  | "mother"
  | "guardian"
  | "self"
  | "other";

export type Applicant = {
  fullName: string;
  email: string;
  phone: string;
  relationship: ApplicantRelationship;
  /** Student's full name, collected when the campaign asks for it up-front. */
  studentFullName?: string;
};

export type ApplicationHistoryEntry = {
  state: ApplicationState;
  /** ISO 8601 timestamp. */
  at: string;
  note?: string;
};

export type Application = {
  code: ApplicationCode;
  tenantCode: string;
  campaignId?: string;
  state: ApplicationState;
  applicant: Applicant;
  formData: Record<string, unknown>;
  history: ApplicationHistoryEntry[];
  /** ISO 8601 timestamps. */
  createdAt: string;
  updatedAt: string;
};

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomSuffix(length: number): string {
  let out = "";
  for (let i = 0; i < length; i += 1) {
    const idx = Math.floor(Math.random() * CODE_ALPHABET.length);
    out += CODE_ALPHABET[idx];
  }
  return out;
}

/**
 * Human-friendly, reasonably-unique application code, e.g. `CVA-26-7K3QF2`.
 * Tenant prefix is derived from the tenant code so parents can eyeball which
 * school a code belongs to. Pha 2 BE will own canonical generation (sequence
 * per campaign); this is a mock-grade collision-unlikely id.
 */
export function generateApplicationCode(tenantCode: string): ApplicationCode {
  const prefix = tenantCode
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 3)
    .toUpperCase();
  const year = String(new Date().getFullYear()).slice(2);
  return `${prefix || "EDU"}-${year}-${randomSuffix(6)}`;
}
