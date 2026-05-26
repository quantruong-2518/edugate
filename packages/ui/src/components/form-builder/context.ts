"use client";

import { createContext, useContext } from "react";

import type { StudentLookupValue } from "@shared/form";

/** Resolves a MOET student code to a record, or null if not found. */
export type StudentResolver = (
  code: string,
) => Promise<Pick<
  StudentLookupValue,
  "code" | "name" | "dob" | "gender"
> | null>;

export type FormBuilderConfig = {
  /** Injected by the app so the `ui` package stays free of API dependencies. */
  studentResolver?: StudentResolver;
};

const FormBuilderConfigContext = createContext<FormBuilderConfig>({});

export const FormBuilderConfigProvider = FormBuilderConfigContext.Provider;

export function useFormBuilderConfig(): FormBuilderConfig {
  return useContext(FormBuilderConfigContext);
}
