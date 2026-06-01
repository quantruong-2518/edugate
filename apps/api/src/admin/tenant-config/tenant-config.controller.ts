import { Body, Controller, Get, Inject, Patch, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { Audit } from "../../common/audit/audit.decorator.js";
import type { AppRequest } from "../../common/types.js";
import { ZodValidationPipe } from "../../common/zod-validation.pipe.js";
import {
  updateBrandingSchema,
  updateLandingSchema,
  type UpdateBrandingInput,
  type UpdateLandingInput,
} from "./tenant-config.dto.js";
import { TenantConfigService } from "./tenant-config.service.js";

/**
 * Per-tenant settings the admin UI edits at /admin/settings:
 *   GET    /v1/admin/tenant-config          → branding + landing snapshot
 *   PATCH  /v1/admin/tenant-config/branding → write logo + theme
 *   PATCH  /v1/admin/tenant-config/landing  → write landing sections
 *
 * Tenant scope enforced by TenantTxInterceptor + RLS. Auth not yet wired —
 * the deployment perimeter gates this until P2.6.
 */
@ApiTags("admin/tenant-config")
@Controller("admin/tenant-config")
export class TenantConfigController {
  constructor(
    @Inject(TenantConfigService) private readonly svc: TenantConfigService,
  ) {}

  @Get()
  @ApiOperation({ summary: "Read branding + landing for the current tenant" })
  get(@Req() req: AppRequest) {
    return this.svc.get(req);
  }

  @Patch("branding")
  @Audit({ resource: "tenant_config", action: "settings_update" })
  @ApiOperation({ summary: "Update logo + theme" })
  updateBranding(
    @Req() req: AppRequest,
    @Body(new ZodValidationPipe(updateBrandingSchema))
    body: UpdateBrandingInput,
  ) {
    return this.svc.updateBranding(req, body);
  }

  @Patch("landing")
  @Audit({ resource: "tenant_config", action: "settings_update" })
  @ApiOperation({ summary: "Update landing sections" })
  updateLanding(
    @Req() req: AppRequest,
    @Body(new ZodValidationPipe(updateLandingSchema))
    body: UpdateLandingInput,
  ) {
    return this.svc.updateLanding(req, body);
  }
}
