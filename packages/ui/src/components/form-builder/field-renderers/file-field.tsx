"use client";

import type { FileField as FileFieldSchema } from "@shared/form";

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

/**
 * Pha 1 stores only the filename (JSON-serializable for the draft + mock store);
 * the actual upload to R2/MinIO is pha 2. File inputs cannot be controlled, so
 * the value is written on change and surfaced as helper text.
 */
export function FileFieldRenderer({ field, control }: FieldProps<FileFieldSchema>) {
  return (
    <FormField
      control={control}
      name={field.name}
      render={({ field: f }) => {
        const filename = (f.value as string | undefined) ?? "";
        return (
          <FormItem>
            <FormLabel>
              {field.label}
              {field.required && " *"}
            </FormLabel>
            <FormControl>
              <Input
                type="file"
                accept={field.accept}
                name={f.name}
                ref={f.ref}
                onBlur={f.onBlur}
                onChange={(e) => f.onChange(e.target.files?.[0]?.name ?? "")}
                className="file:mr-3 file:rounded file:border-0 file:bg-muted file:px-2 file:py-1 file:text-sm"
              />
            </FormControl>
            {filename ? (
              <FormDescription>Đã chọn: {filename}</FormDescription>
            ) : (
              field.description && (
                <FormDescription>{field.description}</FormDescription>
              )
            )}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
