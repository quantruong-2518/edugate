"use client";

import type { RadioField as RadioFieldSchema } from "@shared/form";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@ui/components/form";
import { RadioGroup, RadioGroupItem } from "@ui/components/radio-group";

import type { FieldProps } from "./types";

export function RadioFieldRenderer({
  field,
  control,
}: FieldProps<RadioFieldSchema>) {
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
            <RadioGroup
              value={(f.value as string | undefined) || ""}
              onValueChange={f.onChange}
              className="gap-2.5"
            >
              {field.options.map((option) => {
                const id = `${field.name}-${option.value}`;
                return (
                  <label
                    key={option.value}
                    htmlFor={id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm font-normal transition-colors hover:bg-accent has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <RadioGroupItem id={id} value={option.value} />
                    {option.label}
                  </label>
                );
              })}
            </RadioGroup>
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
