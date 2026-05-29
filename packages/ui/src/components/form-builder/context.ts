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

/**
 * Uploads a single file to object storage and returns the storage key. The
 * app injects this so the `ui` package doesn't import any HTTP client. The
 * caller is expected to: (1) ask the API for a presigned PUT URL, (2) PUT
 * the bytes, (3) return the opaque key the server stores in form_data.
 */
export type FileUploader = (
  file: File,
  context: { fieldName: string },
) => Promise<{ key: string; name: string }>;

export type FormBuilderConfig = {
  /** Injected by the app so the `ui` package stays free of API dependencies. */
  studentResolver?: StudentResolver;
  /** Optional uploader — when absent, file fields fall back to filename-only. */
  fileUploader?: FileUploader;
};

const FormBuilderConfigContext = createContext<FormBuilderConfig>({});

export const FormBuilderConfigProvider = FormBuilderConfigContext.Provider;

export function useFormBuilderConfig(): FormBuilderConfig {
  return useContext(FormBuilderConfigContext);
}
