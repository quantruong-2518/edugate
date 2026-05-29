import { z } from "zod";

/**
 * Wire schemas for the upload-signing endpoint. The browser PUTs the file
 * directly to R2, so the API only validates the *intent*: kind + content
 * type + filename. Size is enforced at the browser before signing — R2
 * does not let us bound size in the signature without extra fields, and
 * the bucket has a hard 5 GiB single-PUT limit anyway. For tighter caps
 * see CLAUDE.md §uploads.
 */

export const signUploadSchema = z.object({
  kind: z.enum(["student_photo", "transcript"]),
  contentType: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z]+\/[a-z0-9.+-]+$/i, "Content-Type không hợp lệ."),
  filename: z.string().min(1).max(255),
});

export type SignUploadInput = z.infer<typeof signUploadSchema>;
