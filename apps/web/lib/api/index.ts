export {
  MOCK_OTP_CODE,
  createApplication,
  getApplicationByCode,
  sendEmailOtp,
  verifyEmailOtp,
  listApplications,
  getApplicationAnalytics,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  applicationScore,
  studentNameOf,
  type CreateApplicationInput,
  type SendEmailOtpInput,
  type SendEmailOtpResult,
  type VerifyEmailOtpInput,
  type VerifyEmailOtpResult,
  type ListApplicationsInput,
  type ListApplicationsResult,
  type ApplicationSort,
  type ApplicationAnalytics,
  type AnalyticsPoint,
  type FunnelStep,
  type AppNotification,
  type NotificationKind,
} from "./admission";

export { getApplicationFormSchema } from "./forms";

export { getLandingConfig } from "./landing";
