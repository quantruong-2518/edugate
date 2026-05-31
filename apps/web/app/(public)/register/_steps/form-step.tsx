"use client";

import type { Control, FieldValues } from "react-hook-form";

import type { FormSchema } from "@shared/form";
import { FormBuilder } from "@ui/components/form-builder";

import { lookupStudent } from "@/lib/api/students";

/**
 * Parse `**bold**` markers into alternating plain / gradient-bold segments.
 * Returns an array of {text, bold} objects safe to render with React.
 */
function parseNotice(text: string): Array<{ text: string; bold: boolean }> {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) => ({ text: part, bold: i % 2 === 1 }));
}

function FormNotice({ text }: { text: string }) {
  const segments = parseNotice(text);
  return (
    <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/5 px-4 py-3">
      <div className="absolute inset-y-0 left-0 w-1 rounded-l-xl bg-gradient-to-b from-primary to-primary/40" />
      <p className="pl-3 text-sm leading-relaxed text-foreground">
        <span className="font-semibold text-primary">Lưu ý: </span>
        {segments.map((seg, i) =>
          seg.bold ? (
            <strong
              key={i}
              className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text font-bold text-transparent"
            >
              {seg.text}
            </strong>
          ) : (
            <span key={i}>{seg.text}</span>
          ),
        )}
      </p>
    </div>
  );
}

export function FormStep({
  schema,
  control,
}: {
  schema: FormSchema;
  control: Control<FieldValues>;
}) {
  return (
    <div className="space-y-5">
      {schema.notice && <FormNotice text={schema.notice} />}
      <FormBuilder
        schema={schema}
        control={control}
        studentResolver={lookupStudent}
      />
    </div>
  );
}
