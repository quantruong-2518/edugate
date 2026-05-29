import { Module } from "@nestjs/common";

import { AdminApplicationsController } from "./admin/admin-applications.controller.js";
import { AdminApplicationsService } from "./admin/admin-applications.service.js";
import { ApplicationController } from "./application/application.controller.js";
import { ApplicationService } from "./application/application.service.js";
import { MailModule } from "./mail/mail.module.js";
import { OtpService } from "./otp/otp.service.js";

@Module({
  imports: [MailModule],
  controllers: [ApplicationController, AdminApplicationsController],
  providers: [ApplicationService, OtpService, AdminApplicationsService],
  exports: [ApplicationService, OtpService],
})
export class AdmissionModule {}
