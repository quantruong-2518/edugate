"use client";

import { useRef, useState } from "react";
import { FileCheck2, Loader2, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";

import type {
  FileField as FileFieldSchema,
  FileValue,
} from "@shared/form";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@ui/components/form";
import { cn } from "@ui/lib/utils";

import { useFormBuilderConfig } from "../context";
import type { FieldProps } from "./types";

// Domain chrome in VI (default locale `vi`); pha-2 moves these behind intl.
const COPY = {
  hint: "Kéo thả tệp vào đây, hoặc bấm để chọn",
  uploading: "Đang tải lên...",
  uploaded: "Đã tải lên hồ sơ",
  replace: "Chọn tệp khác",
  successToast: "Tải hồ sơ thành công",
  invalidToast: "Định dạng tệp không hợp lệ",
  failedToast: "Tải tệp thất bại",
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
 * Drop zone that uploads picked files via the configured `fileUploader`
 * (typically presigned PUT to R2 — see `apps/web/lib/api/uploads.ts`).
 * Stores the opaque storage key as the field value so the API never sees
 * the bytes. When no uploader is wired (e.g. preview / pha 1 mocks), falls
 * back to recording only the filename. Invalid extensions raise a toast.
 */
export function FileFieldRenderer({ field, control }: FieldProps<FileFieldSchema>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { fileUploader } = useFormBuilderConfig();

  return (
    <FormField
      control={control}
      name={field.name}
      render={({ field: f }) => {
        // Field value is `{key, name}` for new writes; legacy drafts may still
        // carry a plain filename string from the pha-1 mocks. Normalise both
        // so the chip + downstream consumers see a consistent shape.
        const raw = f.value as FileValue | string | undefined;
        const filename =
          typeof raw === "string" ? raw : (raw?.name ?? "");

        const accept = async (file: File): Promise<void> => {
          if (!matchesAccept(file.name, field.accept)) {
            toast.error(COPY.invalidToast, { description: field.accept });
            return;
          }
          if (!fileUploader) {
            // No upload pipeline wired (preview / mocks) — record the filename
            // only so callers that don't need an object store still work.
            f.onChange({ key: "", name: file.name });
            toast.success(COPY.successToast, { description: file.name });
            return;
          }
          setUploading(true);
          try {
            const result = await fileUploader(file, { fieldName: field.name });
            f.onChange({ key: result.key, name: result.name });
            toast.success(COPY.successToast, { description: result.name });
          } catch (err) {
            toast.error(COPY.failedToast, {
              description: (err as Error).message,
            });
          } finally {
            setUploading(false);
          }
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
                  if (file) void accept(file);
                  e.target.value = "";
                }}
              />
            </FormControl>

            {uploading ? (
              <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
                <Loader2
                  className="size-5 shrink-0 animate-spin text-primary"
                  aria-hidden
                />
                <p className="text-sm font-medium text-foreground">
                  {COPY.uploading}
                </p>
              </div>
            ) : filename ? (
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
                  if (file) void accept(file);
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
