"use client";

import type { GradeTableField } from "@shared/form";

import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@ui/components/form";

import type { FieldProps } from "./types";

export function GradeTableRenderer({
  field,
  control,
}: FieldProps<GradeTableField>) {
  return (
    <FormField
      control={control}
      name={field.name}
      render={({ field: f }) => {
        const values = (f.value ?? {}) as Record<string, string>;

        const setRow = (rowName: string, optValue: string) => {
          f.onChange({ ...values, [rowName]: optValue });
        };

        return (
          <FormItem className="space-y-2">
            <FormLabel>
              {field.label}
              {field.required && <span className="text-destructive"> *</span>}
            </FormLabel>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full table-fixed text-sm">
                <colgroup>
                  <col style={{ width: "5rem" }} />
                  {field.options.map((opt) => (
                    <col key={opt.value} />
                  ))}
                </colgroup>
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="py-2 pl-4 pr-3 text-left text-xs font-medium text-muted-foreground">
                      Năm học
                    </th>
                    {field.options.map((opt) => (
                      <th
                        key={opt.value}
                        className="px-2 py-2 text-center text-xs font-medium text-muted-foreground"
                      >
                        {opt.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {field.rows.map((row, i) => (
                    <tr
                      key={row.name}
                      className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}
                    >
                      <td className="py-3 pl-4 pr-3 font-medium text-foreground">
                        {row.label}
                      </td>
                      {field.options.map((opt) => (
                        <td key={opt.value} className="px-2 py-3 text-center">
                          <input
                            type="radio"
                            aria-label={`${row.label}: ${opt.label}`}
                            name={`${f.name}_${row.name}`}
                            value={opt.value}
                            checked={values[row.name] === opt.value}
                            onChange={() => setRow(row.name, opt.value)}
                            onBlur={f.onBlur}
                            className="size-4 cursor-pointer accent-primary"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {field.description && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
