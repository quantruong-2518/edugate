import { Controller, Get, Inject, Query, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import type { AppRequest } from "../types.js";
import { ZodValidationPipe } from "../zod-validation.pipe.js";
import { auditLogQuerySchema, type AuditLogQuery } from "./audit-log.dto.js";
import { AuditLogService } from "./audit-log.service.js";

/**
 * Read-only audit log feed for admin/audit-log. Tenant interceptor + RLS
 * scope the rows; only TENANT_ADMIN / SUPER_ADMIN see this in the FE menu
 * (apps/web permission matrix) but the BE doesn't enforce role yet — public
 * exposure is gated by the deployment perimeter until P2.6.
 */
@ApiTags("audit")
@Controller("admin/audit-log")
export class AuditLogController {
  constructor(
    @Inject(AuditLogService) private readonly svc: AuditLogService,
  ) {}

  @Get()
  @ApiOperation({ summary: "List audit log entries for the current tenant" })
  list(
    @Req() req: AppRequest,
    @Query(new ZodValidationPipe(auditLogQuerySchema)) query: AuditLogQuery,
  ) {
    return this.svc.list(req, query);
  }
}
