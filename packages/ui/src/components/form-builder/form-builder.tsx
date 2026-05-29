"use client";

import * as React from "react";
import { useWatch, type Control, type FieldValues } from "react-hook-form";

import {
  evalVisibility,
  type FormFieldSchema,
  type FormSchema,
} from "@shared/form";

import { cn } from "@ui/lib/utils";

import {
  FormBuilderConfigProvider,
  type FileUploader,
  type StudentResolver,
} from "./context";
import { FieldRenderer } from "./field-renderers";

/**
 * Renders a `FormSchema` into the caller's RHF context. The caller owns the
 * `<Form>` provider and submit handler (task 12 merges a static declarant
 * schema with this dynamic one in a single `useForm`), so this only needs
 * `control`. Hidden fields are skipped from the DOM; the Zod builder mirrors
 * the same visibility rule so they never block submit.
 */
export type FormBuilderProps = {
  schema: FormSchema;
  control: Control<FieldValues>;
  className?: string;
  /** App-injected resolver for `studentLookup` fields (keeps `ui` API-free). */
  studentResolver?: StudentResolver;
  /** App-injected uploader for `file` fields (presigned PUT, etc.). */
  fileUploader?: FileUploader;
};

function colSpanClass(field: FormFieldSchema): string {
  return field.colSpan === 1 ? "sm:col-span-1" : "sm:col-span-2";
}

function FieldGate({
  field,
  control,
}: {
  field: FormFieldSchema;
  control: Control<FieldValues>;
}) {
  const cond = field.visibleWhen;
  // Hook order stays stable: always watch, ignore the value when unconditional.
  const depValue = useWatch({ control, name: cond?.field ?? "" });

  if (cond && !evalVisibility(cond, depValue)) return null;

  return (
    <div className={colSpanClass(field)}>
      <FieldRenderer field={field} control={control} />
    </div>
  );
}

export function FormBuilder({
  schema,
  control,
  className,
  studentResolver,
  fileUploader,
}: FormBuilderProps) {
  return (
    <FormBuilderConfigProvider value={{ studentResolver, fileUploader }}>
      <div className={cn("space-y-8", className)}>
        {schema.sections.map((section, index) => (
        <section key={section.title ?? index} className="space-y-4">
          {(section.title || section.description) && (
            <div className="space-y-1">
              {section.title && (
                <h3 className="text-base font-semibold">{section.title}</h3>
              )}
              {section.description && (
                <p className="text-sm text-muted-foreground">
                  {section.description}
                </p>
              )}
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {section.fields.map((field) => (
              <FieldGate key={field.name} field={field} control={control} />
            ))}
          </div>
          </section>
        ))}
      </div>
    </FormBuilderConfigProvider>
  );
}
