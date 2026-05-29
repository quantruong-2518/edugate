import { http } from "./http";

/**
 * Browser-side upload pipeline: ask the API for a presigned PUT URL, PUT the
 * file straight to R2, return the resulting object key. The API never sees
 * the bytes — only the intent (kind + content type) and the resulting key.
 *
 * Field name → upload kind mapping is centralized here so adding a new file
 * field is a one-line table addition. Unknown field names default to
 * "student_photo" (the only kind any pha-1 tenant collects). Pha 2 can move
 * this map into the form-template schema if a tenant ever ships exotic kinds.
 */

export type UploadKind = "student_photo" | "transcript";

const FIELD_KIND: Readonly<Record<string, UploadKind>> = {
  studentPhoto: "student_photo",
  transcript: "transcript",
};

type SignResponse = {
  key: string;
  url: string;
  expiresAt: string;
};

/** Upload a file via presigned PUT. Throws on any non-2xx step. */
export async function uploadFile(
  file: File,
  context: { fieldName: string },
): Promise<{ key: string; filename: string }> {
  const kind = FIELD_KIND[context.fieldName] ?? "student_photo";
  const contentType = file.type || "application/octet-stream";

  const { data: signed } = await http.post<SignResponse>("/v1/uploads/sign", {
    kind,
    contentType,
    filename: file.name,
  });

  // R2 expects the same Content-Type the signature was generated for. The
  // signed URL embeds the host + key + expiry; everything else is plain PUT.
  const res = await fetch(signed.url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: file,
  });
  if (!res.ok) {
    throw new Error(`R2 upload failed (HTTP ${res.status})`);
  }

  return { key: signed.key, filename: file.name };
}
