"use client";

import type { DateField as DateFieldSchema } from "@shared/form";

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

export function DateFieldRenderer({ field, control }: FieldProps<DateFieldSchema>) {
  return (
    <FormField
      control={control}
      name={field.name}
      render={({ field: f }) => (
        <FormItem>
          <FormLabel>
            {field.label}
            {field.required && <span className="text-destructive"> *</span>}
          </FormLabel>
          <FormControl>
            <Input
              type="date"
              min={field.min}
              max={field.max}
              {...f}
              value={(f.value as string | undefined) ?? ""}
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
