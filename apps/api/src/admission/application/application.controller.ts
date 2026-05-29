import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  Post,
  Req,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { Audit } from "../../common/audit/audit.decorator.js";
import type { AppRequest } from "../../common/types.js";
import { ZodValidationPipe } from "../../common/zod-validation.pipe.js";
import { OtpService } from "../otp/otp.service.js";
import {
  otpSendSchema,
  otpVerifySchema,
  submitApplicationSchema,
  type OtpSendInput,
  type OtpVerifyInput,
  type SubmitApplicationInput,
} from "./application.dto.js";
import { ApplicationService } from "./application.service.js";

/**
 * Public admission endpoints — specs/API_SPEC.md §3.
 *
 * All four require `x-tenant-code` (resolved + pinned by
 * TenantTxInterceptor). None require auth — parents submit anonymously
 * and prove email ownership via the OTP flow.
 */
@ApiTags("admission/public")
@Controller("applications")
export class ApplicationController {
  constructor(
    @Inject(OtpService) private readonly otp: OtpService,
    @Inject(ApplicationService) private readonly applications: ApplicationService,
  ) {}

  @Post("otp/send")
  @HttpCode(200)
  @ApiOperation({ summary: "Send a 6-digit code to the applicant's email" })
  sendOtp(
    @Req() req: AppRequest,
    @Body(new ZodValidationPipe(otpSendSchema)) body: OtpSendInput,
  ) {
    return this.otp.send(req, body.email);
  }

  @Post("otp/verify")
  @HttpCode(200)
  @ApiOperation({
    summary: "Verify the code; on success returns a single-use submit token",
  })
  verifyOtp(
    @Req() req: AppRequest,
    @Body(new ZodValidationPipe(otpVerifySchema)) body: OtpVerifyInput,
  ) {
    return this.otp.verify(req, body.email, body.code);
  }

  @Post()
  @HttpCode(201)
  @Audit({ resource: "application", action: "create", omit: ["otpToken"] })
  @ApiOperation({ summary: "Submit a new application" })
  async submit(
    @Req() req: AppRequest,
    @Body(new ZodValidationPipe(submitApplicationSchema))
    body: SubmitApplicationInput,
  ) {
    const created = await this.applications.submit(req, body);
    return {
      code: created.code,
      state: created.state,
      createdAt: created.created_at,
    };
  }

  @Get("by-code/:code")
  @ApiOperation({ summary: "Look up an application by its public code" })
  trackByCode(@Req() req: AppRequest, @Param("code") code: string) {
    return this.applications.getByCode(req, code);
  }
}
