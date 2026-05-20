export {
  APPLICATION_STATE_CODES,
  APPLICATION_STATES,
  isTerminalState,
  type ApplicationState,
  type ApplicationStateMeta,
  type ApplicationStateTone,
} from "./states";

export {
  APPLICATION_ROLES,
  TRANSITIONS,
  canTransition,
  getAllowedTransitions,
  type ApplicationRole,
  type Transition,
} from "./transitions";
