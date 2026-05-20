"use client";

import type {
  NumberField as NumberFieldSchema,
  ScoringField as ScoringFieldSchema,
} from "@shared/form";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@ui/components/form";
import { Input } from "@ui/components/input";

import type { FieldProps } from "./types";

/** Shared renderer for `number` and `scoring` (both bounded numeric inputs). */
export function NumberFieldRenderer({
  field,
  control,
}: FieldProps<NumberFieldSchema | ScoringFieldSchema>) {
  return (
    <FormField
      control={control}
      name={field.name}
      render={({ field: f }) => (
        <FormItem>
          <FormLabel>
            {field.label}
            {field.required && " *"}
          </FormLabel>
          <FormControl>
            <Input
              type="number"
              inputMode="numeric"
              placeholder={field.placeholder}
              min={field.min}
              max={field.max}
              step={field.step}
              name={f.name}
              ref={f.ref}
              onBlur={f.onBlur}
              value={(f.value as number | undefined) ?? ""}
              onChange={(e) =>
                f.onChange(
                  e.target.value === "" ? undefined : e.target.valueAsNumber,
                )
              }
            />
          </FormControl>
          {field.description && (
            <FormDescription>{field.description}</FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
