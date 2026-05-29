import { z } from "zod";

/**
 * Wire-format Zod schemas for public admission endpoints.
 *
 * Validation matches specs/API_SPEC.md §3:
 *   • OTP send/verify — minimal email/code shape
 *   • Submit — declarant + dynamic formData + otpToken (string)
 *
 * `formData` is `z.record()` here because the actual shape comes from the
 * tenant's form_template and is enforced inside the service against the
 * campaign's published schema (Day 4.x will plumb buildZodSchema through).
 */

export const otpSendSchema = z.object({
  email: z.string().email("Email không hợp lệ."),
});
export type OtpSendInput = z.infer<typeof otpSendSchema>;

export const otpVerifySchema = z.object({
  email: z.string().email("Email không hợp lệ."),
  code: z
    .string()
    .regex(/^\d{6}$/, "Mã xác thực phải gồm 6 chữ số."),
});
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;

export const applicantSchema = z.object({
  /** Student's full name — collected up-front by tenants that ask for it (e.g. NGT). */
  studentFullName: z.string().min(1).optional(),
  fullName: z.string().min(1, "Vui lòng nhập họ tên."),
  email: z.string().email(),
  phone: z
    .string()
    .regex(/^(0|\+84)\d{9,10}$/, "Số điện thoại không hợp lệ."),
  relationship: z.enum(["father", "mother", "guardian", "self", "other"]),
});

export const submitApplicationSchema = z.object({
  campaignId: z.string().uuid().optional(),
  applicant: applicantSchema,
  formData: z.record(z.string(), z.unknown()),
  otpToken: z.string().min(32, "Token xác thực không hợp lệ."),
});
export type SubmitApplicationInput = z.infer<typeof submitApplicationSchema>;
