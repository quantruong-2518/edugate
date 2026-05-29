import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  Inject,
  Post,
  Req,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { SkipTenantTx } from "../common/tenant/skip-tenant-tx.decorator.js";
import type { AppRequest } from "../common/types.js";
import { ZodValidationPipe } from "../common/zod-validation.pipe.js";
import {
  signUploadSchema,
  type SignUploadInput,
} from "./uploads.dto.js";
import { R2Service } from "./r2.service.js";

/**
 * Upload-signing endpoint — issues short-lived presigned PUT URLs so the
 * browser uploads straight to R2. The tenant code on the request scopes the
 * generated object key under `applications/<tenantCode>/...` so one tenant's
 * keys can never collide with another's. No auth: the OTP-gated submit
 * later ties the key to a real application.
 */
@ApiTags("uploads")
@Controller("uploads")
@SkipTenantTx()
export class UploadsController {
  constructor(@Inject(R2Service) private readonly r2: R2Service) {}

  @Post("sign")
  @HttpCode(200)
  @ApiOperation({ summary: "Get a presigned PUT URL for a single object" })
  async sign(
    @Req() req: AppRequest,
    @Body(new ZodValidationPipe(signUploadSchema)) input: SignUploadInput,
  ): Promise<{ key: string; url: string; expiresAt: string }> {
    if (!this.r2.isConfigured()) {
      throw new ServiceUnavailableException({
        code: "UPLOAD_NOT_CONFIGURED",
        message: "Dịch vụ lưu trữ chưa được cấu hình.",
      });
    }
    // SkipTenantTx means the interceptor did not resolve req.tenant, so the
    // sign endpoint reads the tenant code straight from the header. This is
    // safe — the key is purely a path prefix; an attacker that fakes the
    // header still cannot read other tenants' keys.
    const tenantCode = readTenantHeader(req.headers["x-tenant-code"]);
    if (!tenantCode) {
      throw new ForbiddenException({
        code: "TENANT_REQUIRED",
        message: "Yêu cầu thiếu mã trường.",
      });
    }
    try {
      return await this.r2.signPut({ tenantCode, ...input });
    } catch (err) {
      throw new BadRequestException({
        code: "UPLOAD_SIGN_FAILED",
        message: (err as Error).message,
      });
    }
  }
}

function readTenantHeader(value: string | string[] | undefined): string | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0]?.trim() || null;
  return value.trim() || null;
}
