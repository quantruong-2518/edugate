export {
  DEFAULT_TENANT_THEME,
  tenantThemeToCss,
  type TenantColorTokens,
  type TenantTheme,
} from "./theme";

export {
  RESERVED_SUBDOMAINS,
  TENANT_HEADER,
  isValidTenantCode,
  parseTenantFromHost,
  parseTenantFromPath,
  resolveRootHosts,
} from "./tenant";

export type { TenantBranding } from "./branding";

export {
  APPLICATION_ROLES,
  APPLICATION_STATE_CODES,
  APPLICATION_STATES,
  TRANSITIONS,
  canTransition,
  generateApplicationCode,
  getAllowedTransitions,
  isTerminalState,
  type Applicant,
  type ApplicantRelationship,
  type Application,
  type ApplicationCode,
  type ApplicationHistoryEntry,
  type ApplicationRole,
  type ApplicationState,
  type ApplicationStateMeta,
  type ApplicationStateTone,
  type Transition,
} from "./admission";

export {
  ACTIONS,
  CORE_MODULES,
  MODULES,
  RESOURCES,
  ROLES,
  ROLE_ABILITIES,
  SCOPES,
  can,
  createAbility,
  moduleOf,
  type Ability,
  type AbilityContext,
  type AbilityRule,
  type Action,
  type ModuleKey,
  type Resource,
  type ResourceSubject,
  type Role,
  type Scope,
  type Subject,
} from "./auth";
