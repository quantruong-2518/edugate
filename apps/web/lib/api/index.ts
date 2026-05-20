export {
  MOCK_OTP_CODE,
  createApplication,
  getApplicationByCode,
  sendEmailOtp,
  verifyEmailOtp,
  type CreateApplicationInput,
  type SendEmailOtpInput,
  type SendEmailOtpResult,
  type VerifyEmailOtpInput,
  type VerifyEmailOtpResult,
} from "./admission";

export { getApplicationFormSchema } from "./forms";
