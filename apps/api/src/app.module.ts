import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_INTERCEPTOR } from "@nestjs/core";

import { TenantConfigModule } from "./admin/tenant-config/tenant-config.module.js";
import { AdmissionModule } from "./admission/admission.module.js";
import { AuditInterceptor } from "./common/audit/audit.interceptor.js";
import { AuditModule } from "./common/audit/audit.module.js";
import { DbModule } from "./common/db.module.js";
import { TenantTxInterceptor } from "./common/tenant/tenant-tx.interceptor.js";
import { TenantModule } from "./common/tenant/tenant.module.js";
import { DebugModule } from "./_debug/debug.module.js";
import { HealthModule } from "./health/health.module.js";
import { UploadsModule } from "./uploads/uploads.module.js";

const isProd = process.env["NODE_ENV"] === "production";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: [".env.local", ".env"],
    }),
    DbModule,
    TenantModule,
    AuditModule,
    HealthModule,
    UploadsModule,
    AdmissionModule,
    TenantConfigModule,
    // Debug controller is dev-only — its endpoints leak the active tenant id.
    ...(isProd ? [] : [DebugModule]),
  ],
  providers: [
    // Order matters: TenantTx runs first to open the transaction, then
    // Audit runs inside it so the audit_log INSERT shares the same tx.
    { provide: APP_INTERCEPTOR, useClass: TenantTxInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
