import { z } from "zod";

/**
 * Zod schemas for the auth forms. FE-only validation (pha 2 NestJS has its own
 * DTO validation), so these live in apps/web rather than @shared. Built as
 * factories taking the `auth` translator so messages stay i18n-driven.
 */
type Translate = (
  key: string,
  values?: Record<string, string | number>,
) => string;

export const PASSWORD_MIN = 8;

export function loginSchema(t: Translate) {
  return z.object({
    email: z
      .string()
      .min(1, t("validation.required"))
      .email(t("validation.invalidEmail")),
    password: z.string().min(1, t("validation.required")),
  });
}

export function forgotSchema(t: Translate) {
  return z.object({
    email: z
      .string()
      .min(1, t("validation.required"))
      .email(t("validation.invalidEmail")),
  });
}

export function credentialSchema(t: Translate) {
  return z
    .object({
      password: z
        .string()
        .min(PASSWORD_MIN, t("validation.passwordMin", { min: PASSWORD_MIN })),
      confirmPassword: z.string().min(1, t("validation.required")),
    })
    .refine((d) => d.password === d.confirmPassword, {
      message: t("validation.passwordMismatch"),
      path: ["confirmPassword"],
    });
}

export type LoginValues = z.infer<ReturnType<typeof loginSchema>>;
export type ForgotValues = z.infer<ReturnType<typeof forgotSchema>>;
export type CredentialValues = z.infer<ReturnType<typeof credentialSchema>>;
