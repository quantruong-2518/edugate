import {
  BadgeCheck,
  Ban,
  CheckCircle2,
  Clock,
  Eye,
  FileEdit,
  GraduationCap,
  type LucideIcon,
  Send,
  TriangleAlert,
  XCircle,
} from "lucide-react";

import type { ApplicationState } from "@shared/admission";

export const STATE_ICON: Readonly<Record<ApplicationState, LucideIcon>> = {
  DRAFT: FileEdit,
  SUBMITTED: Send,
  UNDER_REVIEW: Eye,
  NEEDS_INFO: TriangleAlert,
  APPROVED: CheckCircle2,
  REJECTED: XCircle,
  CONFIRMED: BadgeCheck,
  ENROLLED: GraduationCap,
  CANCELLED: Ban,
  EXPIRED: Clock,
};
