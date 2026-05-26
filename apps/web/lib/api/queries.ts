"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";

import type { Application, ApplicationCode } from "@shared/admission";
import type { AuditLogEntry, AuditLogFilters } from "@shared/audit";

import {
  createApplication,
  getApplicationByCode,
  sendEmailOtp,
  verifyEmailOtp,
  listApplications,
  getApplicationAnalytics,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type CreateApplicationInput,
  type SendEmailOtpInput,
  type SendEmailOtpResult,
  type VerifyEmailOtpInput,
  type VerifyEmailOtpResult,
  type ListApplicationsInput,
  type ListApplicationsResult,
  type ApplicationAnalytics,
  type AppNotification,
} from "./admission";
import { getAuditLog } from "./audit";

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
  list: (input: ListApplicationsInput) =>
    [...admissionKeys.all, "list", input] as const,
  analytics: (tenantCode: string) =>
    [...admissionKeys.all, "analytics", tenantCode] as const,
  notifications: (tenantCode: string) =>
    [...admissionKeys.all, "notifications", tenantCode] as const,
};

export const auditKeys = {
  all: ["audit"] as const,
  list: (tenantCode: string, filters: AuditLogFilters) =>
    [...auditKeys.all, "list", tenantCode, filters] as const,
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

export function useAuditLog(
  tenantCode: string,
  filters: AuditLogFilters,
): UseQueryResult<AuditLogEntry[]> {
  return useQuery({
    queryKey: auditKeys.list(tenantCode, filters),
    queryFn: () => getAuditLog(tenantCode, filters),
  });
}

export function useApplications(
  input: ListApplicationsInput,
): UseQueryResult<ListApplicationsResult> {
  return useQuery({
    queryKey: admissionKeys.list(input),
    queryFn: () => listApplications(input),
    placeholderData: (prev) => prev,
  });
}

export function useApplicationAnalytics(
  tenantCode: string,
): UseQueryResult<ApplicationAnalytics> {
  return useQuery({
    queryKey: admissionKeys.analytics(tenantCode),
    queryFn: () => getApplicationAnalytics(tenantCode),
  });
}

export function useNotifications(
  tenantCode: string,
): UseQueryResult<AppNotification[]> {
  return useQuery({
    queryKey: admissionKeys.notifications(tenantCode),
    queryFn: () => listNotifications(tenantCode),
  });
}

export function useMarkNotificationRead(
  tenantCode: string,
): UseMutationResult<AppNotification[], Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(tenantCode, id),
    onSuccess: (items) => {
      queryClient.setQueryData(admissionKeys.notifications(tenantCode), items);
    },
  });
}

export function useMarkAllNotificationsRead(
  tenantCode: string,
): UseMutationResult<AppNotification[], Error, void> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markAllNotificationsRead(tenantCode),
    onSuccess: (items) => {
      queryClient.setQueryData(admissionKeys.notifications(tenantCode), items);
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
