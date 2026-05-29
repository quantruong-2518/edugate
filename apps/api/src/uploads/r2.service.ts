import { randomUUID } from "node:crypto";

import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Cloudflare R2 client. R2 is S3-compatible: same SDK, region must be `auto`,
 * endpoint is `https://<account-id>.r2.cloudflarestorage.com`. Bucket is
 * created in the dashboard. Access keys are scoped to that bucket.
 *
 * The service issues presigned PUT URLs so the browser uploads straight to
 * R2 — the API never touches the bytes. Keys live under
 * `applications/<tenantCode>/<yyyy-mm>/<uuid>.<ext>` so retention by month
 * is a simple prefix scan and one tenant cannot list another's objects.
 */

export type UploadKind = "student_photo" | "transcript";

const KIND_RULES: Record<
  UploadKind,
  { prefix: string; allowedContentTypes: readonly string[] }
> = {
  student_photo: {
    prefix: "applications",
    allowedContentTypes: ["image/jpeg", "image/png"],
  },
  transcript: {
    prefix: "applications",
    allowedContentTypes: ["image/jpeg", "image/png", "application/pdf"],
  },
};

export type SignedPutResult = {
  /** Object key inside the bucket — store this in form_data, not the URL. */
  key: string;
  /** Presigned PUT URL — single-use, expires per `R2_SIGNED_TTL`. */
  url: string;
  /** ISO timestamp the URL stops working. */
  expiresAt: string;
};

@Injectable()
export class R2Service {
  private readonly logger = new Logger("R2");
  private client?: S3Client;
  private bucket?: string;
  private ttl = 300;

  constructor(
    @Inject(ConfigService) private readonly config: ConfigService,
  ) {
    const accountId = this.config.get<string>("R2_ACCOUNT_ID");
    const bucket = this.config.get<string>("R2_BUCKET");
    const accessKeyId = this.config.get<string>("R2_ACCESS_KEY_ID");
    const secretAccessKey = this.config.get<string>("R2_SECRET_ACCESS_KEY");
    const ttlEnv = this.config.get<string>("R2_SIGNED_TTL");

    if (!accountId || !bucket || !accessKeyId || !secretAccessKey) {
      this.logger.warn(
        "R2 not fully configured — uploads will return HTTP 503 until R2_* env vars are set.",
      );
      return;
    }

    this.bucket = bucket;
    this.ttl = ttlEnv ? Math.max(60, Math.min(3600, Number(ttlEnv))) : 300;
    this.client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  isConfigured(): boolean {
    return Boolean(this.client && this.bucket);
  }

  /**
   * Build a fresh key + presigned PUT URL for a single object. Content type
   * is enforced at sign time — the browser must PUT with the matching
   * `Content-Type` header or R2 rejects the upload (the signature covers it).
   */
  async signPut(input: {
    tenantCode: string;
    kind: UploadKind;
    contentType: string;
    filename: string;
  }): Promise<SignedPutResult> {
    if (!this.client || !this.bucket) {
      throw new Error("R2 not configured");
    }
    const rule = KIND_RULES[input.kind];
    if (!rule.allowedContentTypes.includes(input.contentType)) {
      throw new Error(
        `Content type ${input.contentType} not allowed for kind ${input.kind}`,
      );
    }

    const ext = extOf(input.filename, input.contentType);
    const now = new Date();
    const yyyymm = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
    const id = randomUUID();
    const key = `${rule.prefix}/${input.tenantCode}/${yyyymm}/${id}${ext}`;

    const url = await getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: input.contentType,
      }),
      { expiresIn: this.ttl },
    );

    return {
      key,
      url,
      expiresAt: new Date(Date.now() + this.ttl * 1000).toISOString(),
    };
  }
}

/** Pick a safe extension from filename, fall back to the content type. */
function extOf(filename: string, contentType: string): string {
  const m = filename.toLowerCase().match(/\.([a-z0-9]{2,5})$/);
  if (m) return `.${m[1]}`;
  if (contentType === "image/jpeg") return ".jpg";
  if (contentType === "image/png") return ".png";
  if (contentType === "application/pdf") return ".pdf";
  return "";
}
