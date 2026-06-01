export {
  APPLICATION_STATE_CODES,
  APPLICATION_STATES,
  isTerminalState,
  type ApplicationState,
  type ApplicationStateMeta,
  type ApplicationStateTone,
} from "./states.js";

export {
  APPLICATION_ROLES,
  TRANSITIONS,
  canTransition,
  getAllowedTransitions,
  type ApplicationRole,
  type Transition,
} from "./transitions.js";

export {
  generateApplicationCode,
  type Applicant,
  type ApplicantRelationship,
  type Application,
  type ApplicationCode,
  type ApplicationHistoryEntry,
} from "./application.js";

export {
  resolveApplicantConfig,
  type ApplicantConfig,
} from "./applicant-config.js";

export {
  ANALYTICS_SERIES_DAYS,
  emptyByState,
  FUNNEL_ORDER,
  type AnalyticsPoint,
  type ApplicationAnalytics,
  type FunnelStep,
} from "./analytics.js";
