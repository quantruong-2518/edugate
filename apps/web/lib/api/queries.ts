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
import type { LandingConfig } from "@shared/landing";
import type { TenantTheme } from "@shared/theme";

import {
  createApplication,
  getApplicationByCode,
  sendEmailOtp,
  transitionApplication,
  verifyEmailOtp,
  listApplications,
  getApplicationAnalytics,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type CreateApplicationInput,
  type SendEmailOtpInput,
  type SendEmailOtpResult,
  type TransitionApplicationInput,
  type VerifyEmailOtpInput,
  type VerifyEmailOtpResult,
  type ListApplicationsInput,
  type ListApplicationsResult,
  type ApplicationAnalytics,
  type AppNotification,
} from "./admission";
import {
  getTenantConfig,
  updateTenantBranding,
  updateTenantLanding,
  type TenantConfigPayload,
} from "./appearance";
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

export const tenantConfigKeys = {
  all: ["tenant-config"] as const,
  byCode: (tenantCode: string) =>
    [...tenantConfigKeys.all, tenantCode] as const,
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

/**
 * State transition mutation. On success, patch every cached list page that
 * contains this application and seed the by-code cache so the detail sheet
 * stays in sync without a refetch.
 */
export function useTransitionApplication(): UseMutationResult<
  Application,
  Error,
  TransitionApplicationInput
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: transitionApplication,
    onSuccess: (updated) => {
      queryClient.setQueryData(
        admissionKeys.application(updated.code),
        updated,
      );
      queryClient.setQueriesData<{ items: Application[] }>(
        { queryKey: admissionKeys.all },
        (prev) => {
          if (!prev || !Array.isArray(prev.items)) return prev;
          if (!prev.items.some((a) => a.code === updated.code)) return prev;
          return {
            ...prev,
            items: prev.items.map((a) => (a.code === updated.code ? updated : a)),
          };
        },
      );
      // Analytics + audit log both reflect this change.
      void queryClient.invalidateQueries({
        queryKey: admissionKeys.analytics(updated.tenantCode),
      });
      void queryClient.invalidateQueries({ queryKey: auditKeys.all });
    },
  });
}

export function useTenantConfig(
  tenantCode: string,
): UseQueryResult<TenantConfigPayload> {
  return useQuery({
    queryKey: tenantConfigKeys.byCode(tenantCode),
    queryFn: () => getTenantConfig(tenantCode),
    enabled: tenantCode.length > 0,
  });
}

export function useUpdateBranding(
  tenantCode: string,
): UseMutationResult<
  TenantConfigPayload["branding"],
  Error,
  { logoUrl: string | null; theme: TenantTheme }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => updateTenantBranding(tenantCode, body),
    onSuccess: (branding) => {
      queryClient.setQueryData<TenantConfigPayload | undefined>(
        tenantConfigKeys.byCode(tenantCode),
        (prev) => (prev ? { ...prev, branding } : prev),
      );
      void queryClient.invalidateQueries({ queryKey: auditKeys.all });
    },
  });
}

export function useUpdateLanding(
  tenantCode: string,
): UseMutationResult<{ landing: LandingConfig }, Error, LandingConfig> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (landing) => updateTenantLanding(tenantCode, landing),
    onSuccess: ({ landing }) => {
      queryClient.setQueryData<TenantConfigPayload | undefined>(
        tenantConfigKeys.byCode(tenantCode),
        (prev) => (prev ? { ...prev, landing } : prev),
      );
      void queryClient.invalidateQueries({ queryKey: auditKeys.all });
    },
  });
}
