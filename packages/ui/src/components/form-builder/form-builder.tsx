"use client";

import * as React from "react";
import { useWatch, type Control, type FieldValues } from "react-hook-form";

import {
  evalVisibility,
  type FormFieldSchema,
  type FormSection,
  type FormSchema,
} from "@shared/form";

import { cn } from "@ui/lib/utils";

import {
  FormBuilderConfigProvider,
  type FileUploader,
  type StudentResolver,
} from "./context";
import { FieldRenderer } from "./field-renderers";

export type FormBuilderProps = {
  schema: FormSchema;
  control: Control<FieldValues>;
  className?: string;
  studentResolver?: StudentResolver;
  fileUploader?: FileUploader;
};

function colSpanClass(field: FormFieldSchema): string {
  if (field.type === "gradeTable") return "sm:col-span-2";
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
  const depValue = useWatch({ control, name: cond?.field ?? "" });
  if (cond && !evalVisibility(cond, depValue)) return null;
  return <FieldRenderer field={field} control={control} />;
}

/** Standard 2-col grid section. */
function DefaultSection({
  section,
  control,
}: {
  section: FormSection;
  control: Control<FieldValues>;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {section.fields.map((field) => (
        <div key={field.name} className={colSpanClass(field)}>
          <FieldGate field={field} control={control} />
        </div>
      ))}
    </div>
  );
}

/**
 * Photo-profile layout:
 *   LEFT  — first field rendered as a portrait photo slot (3:4, shadow).
 *   RIGHT — remaining fields stacked in a single column.
 *   GAP   — 2.5 rem between the two columns.
 */
function PhotoProfileSection({
  section,
  control,
}: {
  section: FormSection;
  control: Control<FieldValues>;
}) {
  const [photoField, ...infoFields] = section.fields;
  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:gap-10">
      {/* Photo slot — portrait frame. Centered above the fields on mobile,
          left-aligned beside them from sm up. */}
      <div className="mx-auto w-40 shrink-0 sm:mx-0 sm:w-[140px]">
        {photoField && <FieldGate field={photoField} control={control} />}
      </div>

      {/* Info fields — single column, stretch to available height */}
      <div className="flex flex-1 flex-col gap-4">
        {infoFields.map((field) => (
          <FieldGate key={field.name} field={field} control={control} />
        ))}
      </div>
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
      <div className={cn("space-y-6", className)}>
        {schema.sections.map((section, index) => (
          <section key={section.title ?? index}>
            {(section.title || section.description) && (
              <div className="mb-4 space-y-1">
                {section.title && (
                  <h3 className="text-base font-semibold tracking-tight text-foreground">
                    {section.title}
                  </h3>
                )}
                {section.description && (
                  <p className="text-sm text-muted-foreground">
                    {section.description}
                  </p>
                )}
              </div>
            )}
            {section.layout === "photo-profile" ? (
              <PhotoProfileSection section={section} control={control} />
            ) : (
              <DefaultSection section={section} control={control} />
            )}
          </section>
        ))}
      </div>
    </FormBuilderConfigProvider>
  );
}
