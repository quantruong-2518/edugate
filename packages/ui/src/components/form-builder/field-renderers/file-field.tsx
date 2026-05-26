"use client";

import { useRef, useState } from "react";
import { FileCheck2, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";

import type { FileField as FileFieldSchema } from "@shared/form";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@ui/components/form";
import { cn } from "@ui/lib/utils";

import type { FieldProps } from "./types";

// Domain chrome in VI (default locale `vi`); pha-2 moves these behind intl.
const COPY = {
  hint: "Kéo thả tệp vào đây, hoặc bấm để chọn",
  uploaded: "Đã tải lên hồ sơ",
  replace: "Chọn tệp khác",
  successToast: "Tải hồ sơ thành công",
  invalidToast: "Định dạng tệp không hợp lệ",
} as const;

/** True when `name`'s extension matches the comma-separated `accept` list. */
function matchesAccept(name: string, accept?: string): boolean {
  if (!accept) return true;
  const ext = name.slice(name.lastIndexOf(".")).toLowerCase();
  return accept
    .split(",")
    .map((a) => a.trim().toLowerCase())
    .some((a) => a === ext);
}

/**
 * Pha 1 stores only the filename (JSON-serializable for the draft + mock store);
 * the actual upload to R2/MinIO is pha 2. A dashed drop zone accepts drag-drop
 * or click-to-pick, validates the extension against `accept`, then shows a
 * success state. Invalid files raise a toast and are rejected.
 */
export function FileFieldRenderer({ field, control }: FieldProps<FileFieldSchema>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <FormField
      control={control}
      name={field.name}
      render={({ field: f }) => {
        const filename = (f.value as string | undefined) ?? "";

        const accept = (file: File): void => {
          if (!matchesAccept(file.name, field.accept)) {
            toast.error(COPY.invalidToast, { description: field.accept });
            return;
          }
          f.onChange(file.name);
          toast.success(COPY.successToast, { description: file.name });
        };

        return (
          <FormItem>
            <FormLabel>
              {field.label}
              {field.required && <span className="text-destructive"> *</span>}
            </FormLabel>
            <FormControl>
              <input
                ref={inputRef}
                type="file"
                accept={field.accept}
                className="sr-only"
                name={f.name}
                onBlur={f.onBlur}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) accept(file);
                  e.target.value = "";
                }}
              />
            </FormControl>

            {filename ? (
              <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
                <FileCheck2 className="size-5 shrink-0 text-primary" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {COPY.uploaded}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {filename}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {COPY.replace}
                </button>
                <button
                  type="button"
                  aria-label="Xóa tệp"
                  onClick={() => f.onChange("")}
                  className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) accept(file);
                }}
                className={cn(
                  "flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors",
                  dragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-accent/50",
                )}
              >
                <UploadCloud
                  className="size-7 text-muted-foreground"
                  aria-hidden
                />
                <span className="text-sm font-medium text-foreground">
                  {COPY.hint}
                </span>
                {field.accept && (
                  <span className="text-xs text-muted-foreground">
                    {field.accept}
                  </span>
                )}
              </button>
            )}

            {field.description && !filename && (
              <FormDescription>{field.description}</FormDescription>
            )}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
