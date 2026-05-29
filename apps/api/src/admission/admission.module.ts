import { Module } from "@nestjs/common";

import { ApplicationController } from "./application/application.controller.js";
import { ApplicationService } from "./application/application.service.js";
import { MailModule } from "./mail/mail.module.js";
import { OtpService } from "./otp/otp.service.js";

@Module({
  imports: [MailModule],
  controllers: [ApplicationController],
  providers: [ApplicationService, OtpService],
  exports: [ApplicationService, OtpService],
})
export class AdmissionModule {}
