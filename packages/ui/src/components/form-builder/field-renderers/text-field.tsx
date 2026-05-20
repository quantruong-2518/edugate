"use client";

import type { TextField as TextFieldSchema } from "@shared/form";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@ui/components/form";
import { Input } from "@ui/components/input";
import { Textarea } from "@ui/components/textarea";

import type { FieldProps } from "./types";

export function TextFieldRenderer({ field, control }: FieldProps<TextFieldSchema>) {
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
            {field.multiline ? (
              <Textarea
                placeholder={field.placeholder}
                maxLength={field.maxLength}
                {...f}
                value={(f.value as string | undefined) ?? ""}
              />
            ) : (
              <Input
                placeholder={field.placeholder}
                maxLength={field.maxLength}
                {...f}
                value={(f.value as string | undefined) ?? ""}
              />
            )}
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
