import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Query,
  Req,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import type { AppRequest } from "../../common/types.js";
import { ZodValidationPipe } from "../../common/zod-validation.pipe.js";
import {
  analyticsRangeQuerySchema,
  listApplicationsQuerySchema,
  type AnalyticsRangeQuery,
  type ListApplicationsQuery,
} from "./admin-applications.dto.js";
import { AdminApplicationsService } from "./admin-applications.service.js";
import { AdminAnalyticsService } from "./admin-analytics.service.js";
import {
  transitionApplicationSchema,
  type TransitionApplicationInput,
} from "./transition.dto.js";

/**
 * Tenant-scoped admin admission endpoints. Auth is not enforced yet (pha 2
 * wires Better-Auth + ADMISSION_ADMIN role) — the tenant interceptor already
 * isolates rows per school via SET app.tenant_id + RLS, so cross-tenant
 * leakage is impossible even without an authenticated user. Public exposure
 * is gated by the deployment perimeter (Caddy basic-auth in dev).
 */
@ApiTags("admission/admin")
@Controller("admin/applications")
export class AdminApplicationsController {
  constructor(
    @Inject(AdminApplicationsService)
    private readonly svc: AdminApplicationsService,
    @Inject(AdminAnalyticsService)
    private readonly analytics: AdminAnalyticsService,
  ) {}

  @Get()
  @ApiOperation({ summary: "List applications for the current tenant" })
  list(
    @Req() req: AppRequest,
    @Query(new ZodValidationPipe(listApplicationsQuerySchema))
    query: ListApplicationsQuery,
  ) {
    return this.svc.list(req, query);
  }

  @Get("analytics")
  @ApiOperation({ summary: "Dashboard analytics for admissions" })
  getAnalytics(
    @Req() req: AppRequest,
    @Query(new ZodValidationPipe(analyticsRangeQuerySchema))
    query: AnalyticsRangeQuery,
  ) {
    return this.analytics.overview(req, query);
  }

  @Patch(":code/transition")
  @ApiOperation({
    summary: "Move an application to a new state (validated by the state machine)",
  })
  transition(
    @Req() req: AppRequest,
    @Param("code") code: string,
    @Body(new ZodValidationPipe(transitionApplicationSchema))
    body: TransitionApplicationInput,
  ) {
    return this.svc.transition(req, code, body);
  }
}
