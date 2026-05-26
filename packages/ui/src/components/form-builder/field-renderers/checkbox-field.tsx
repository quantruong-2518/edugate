"use client";

import type { CheckboxField as CheckboxFieldSchema } from "@shared/form";

import { Checkbox } from "@ui/components/checkbox";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@ui/components/form";

import type { FieldProps } from "./types";

export function CheckboxFieldRenderer({
  field,
  control,
}: FieldProps<CheckboxFieldSchema>) {
  return (
    <FormField
      control={control}
      name={field.name}
      render={({ field: f }) => {
        const selected = Array.isArray(f.value) ? (f.value as string[]) : [];
        const toggle = (value: string, checked: boolean) => {
          f.onChange(
            checked
              ? [...selected, value]
              : selected.filter((v) => v !== value),
          );
        };
        return (
          <FormItem>
            <FormLabel>
              {field.label}
              {field.required && <span className="text-destructive"> *</span>}
            </FormLabel>
            <FormControl>
              <div className="grid gap-2.5">
                {field.options.map((option) => {
                  const id = `${field.name}-${option.value}`;
                  const checked = selected.includes(option.value);
                  return (
                    <label
                      key={option.value}
                      htmlFor={id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm font-normal transition-colors hover:bg-accent has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                    >
                      <Checkbox
                        id={id}
                        checked={checked}
                        onCheckedChange={(c) => toggle(option.value, c === true)}
                      />
                      {option.label}
                    </label>
                  );
                })}
              </div>
            </FormControl>
            {field.description && (
              <FormDescription>{field.description}</FormDescription>
            )}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
