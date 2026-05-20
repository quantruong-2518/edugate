"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";

import type { Application, ApplicationCode } from "@shared/admission";

import {
  createApplication,
  getApplicationByCode,
  sendEmailOtp,
  verifyEmailOtp,
  type CreateApplicationInput,
  type SendEmailOtpInput,
  type SendEmailOtpResult,
  type VerifyEmailOtpInput,
  type VerifyEmailOtpResult,
} from "./admission";

/**
 * TanStack Query hooks for the admission seam. They wrap the data functions in
 * `admission.ts` (mock-backed in pha 1) so call sites get caching, loading and
 * error state for free. When pha 2 swaps the seam bodies to axios, these hooks
 * are unchanged.
 */

/** Centralised query keys — keep every cache reference in one place. */
export const admissionKeys = {
  all: ["admission"] as const,
  application: (code: string) =>
    [...admissionKeys.all, "application", code] as const,
};

export function useApplication(
  code: ApplicationCode,
): UseQueryResult<Application | null> {
  const trimmed = code.trim();
  return useQuery({
    queryKey: admissionKeys.application(trimmed),
    queryFn: () => getApplicationByCode(trimmed),
    enabled: trimmed.length > 0,
  });
}

export function useCreateApplication(): UseMutationResult<
  Application,
  Error,
  CreateApplicationInput
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createApplication,
    onSuccess: (application) => {
      // Seed the cache so /track/[code] resolves instantly after submit.
      queryClient.setQueryData(
        admissionKeys.application(application.code),
        application,
      );
    },
  });
}

export function useSendEmailOtp(): UseMutationResult<
  SendEmailOtpResult,
  Error,
  SendEmailOtpInput
> {
  return useMutation({ mutationFn: sendEmailOtp });
}

export function useVerifyEmailOtp(): UseMutationResult<
  VerifyEmailOtpResult,
  Error,
  VerifyEmailOtpInput
> {
  return useMutation({ mutationFn: verifyEmailOtp });
}
