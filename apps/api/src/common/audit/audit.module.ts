import { Module } from "@nestjs/common";

import { AuditLogController } from "./audit-log.controller.js";
import { AuditLogService } from "./audit-log.service.js";
import { AuditInterceptor } from "./audit.interceptor.js";

@Module({
  controllers: [AuditLogController],
  providers: [AuditInterceptor, AuditLogService],
  exports: [AuditInterceptor],
})
export class AuditModule {}
