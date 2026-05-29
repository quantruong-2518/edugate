import { Controller, Get, Inject, Query, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import type { AppRequest } from "../../common/types.js";
import { ZodValidationPipe } from "../../common/zod-validation.pipe.js";
import {
  listApplicationsQuerySchema,
  type ListApplicationsQuery,
} from "./admin-applications.dto.js";
import { AdminApplicationsService } from "./admin-applications.service.js";

/**
 * Tenant-scoped admin list endpoint. Auth is not enforced yet (pha 2 wires
 * Better-Auth + ADMISSION_ADMIN role) — the tenant interceptor already
 * isolates rows per school via SET app.tenant_id + RLS, so cross-tenant
 * leakage is impossible even without an authenticated user. Public
 * exposure is gated by the deployment perimeter (Caddy basic-auth in dev).
 */
@ApiTags("admission/admin")
@Controller("admin/applications")
export class AdminApplicationsController {
  constructor(
    @Inject(AdminApplicationsService)
    private readonly svc: AdminApplicationsService,
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
}
