"use client";

import {
  createAbility,
  type Ability,
  type AbilityContext,
} from "@shared/auth";
import { createContext, useContext, useMemo, type ReactNode } from "react";

const AbilityCtx = createContext<Ability | null>(null);

/**
 * Provides a bound `Ability` to the subtree. `context` is a plain serializable
 * object so it can be built in an RSC layout and passed across the boundary;
 * the function-bearing `Ability` is constructed here on the client.
 */
export function AbilityProvider({
  context,
  children,
}: {
  context: AbilityContext;
  children: ReactNode;
}) {
  const ability = useMemo(() => createAbility(context), [context]);
  return <AbilityCtx.Provider value={ability}>{children}</AbilityCtx.Provider>;
}

export function useAbility(): Ability {
  const ability = useContext(AbilityCtx);
  if (!ability) {
    throw new Error("useAbility must be used within <AbilityProvider>");
  }
  return ability;
}
