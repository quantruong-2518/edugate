import { z } from "zod";

import { APPLICATION_STATE_CODES } from "shared/admission";

/**
 * Body of PATCH /v1/admin/applications/:code/transition. The state machine
 * (canTransition in @shared/admission/transitions) decides whether
 * `to` is reachable from the application's current state given the actor's
 * role; the service layer enforces it. `reason` is required at the schema
 * level only when the transition's `requireReason` flag is set — service
 * checks that after looking up the rule.
 */
export const transitionApplicationSchema = z.object({
  to: z.enum(APPLICATION_STATE_CODES as readonly [string, ...string[]]),
  reason: z.string().trim().max(2000).optional(),
});

export type TransitionApplicationInput = z.infer<typeof transitionApplicationSchema>;
