import {
  generateApplicationCode,
  type Applicant,
  type Application,
  type ApplicationCode,
} from "@shared/admission";

import { findApplication, saveApplication } from "./store";

/**
 * Admission API seam. In pha 1 these are localStorage-backed mocks; task 15
 * replaces the bodies with axios + TanStack Query against the NestJS API while
 * keeping these signatures identical. Treat this module as the single swap
 * point — UI code depends only on the exported functions, never on the store.
 */

/** Fixed OTP for the mock email-verification step. Surfaced to the user via a
 * toast by the verify-email step so the demo is self-serve. Dev-only. */
export const MOCK_OTP_CODE = "123456";

/** Simulated network latency so loading states (task 16) have something to
 * render against. */
const MOCK_LATENCY_MS = 250;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_LATENCY_MS));
}

export type CreateApplicationInput = {
  tenantCode: string;
  applicant: Applicant;
  formData: Record<string, unknown>;
  campaignId?: string;
};

export type SendEmailOtpInput = {
  email: string;
};

export type SendEmailOtpResult = {
  sent: true;
  /** Mock-only: the code the UI should display. Removed in pha 2. */
  devCode: string;
};

export type VerifyEmailOtpInput = {
  email: string;
  code: string;
};

export type VerifyEmailOtpResult = {
  verified: boolean;
};

export async function createApplication(
  input: CreateApplicationInput,
): Promise<Application> {
  const now = new Date().toISOString();
  const application: Application = {
    code: generateApplicationCode(input.tenantCode),
    tenantCode: input.tenantCode,
    campaignId: input.campaignId,
    state: "SUBMITTED",
    applicant: input.applicant,
    formData: input.formData,
    history: [{ state: "SUBMITTED", at: now }],
    createdAt: now,
    updatedAt: now,
  };
  saveApplication(application);
  return delay(application);
}

export async function getApplicationByCode(
  code: ApplicationCode,
): Promise<Application | null> {
  return delay(findApplication(code.trim().toUpperCase()));
}

export async function sendEmailOtp(
  _input: SendEmailOtpInput,
): Promise<SendEmailOtpResult> {
  return delay({ sent: true, devCode: MOCK_OTP_CODE });
}

export async function verifyEmailOtp(
  input: VerifyEmailOtpInput,
): Promise<VerifyEmailOtpResult> {
  return delay({ verified: input.code.trim() === MOCK_OTP_CODE });
}
