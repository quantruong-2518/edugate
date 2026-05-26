import type { HeadingField as HeadingFieldSchema } from "@shared/form";

/**
 * Display-only block: a sub-heading + optional body used to group fields and
 * give guidance inside a section. Not bound to RHF — carries no value.
 */
export function HeadingFieldRenderer({ field }: { field: HeadingFieldSchema }) {
  return (
    <div className="border-l-2 border-primary/40 pl-3">
      <p className="text-sm font-semibold text-foreground">{field.label}</p>
      {field.body && (
        <p className="mt-0.5 text-sm text-muted-foreground">{field.body}</p>
      )}
    </div>
  );
}
