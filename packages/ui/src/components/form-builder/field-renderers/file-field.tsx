"use client";

import { useRef, useState } from "react";
import { Loader2, UploadCloud, X } from "lucide-react";
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
  hintMobile: "Bấm để chọn tệp",
  uploading: "Đang tải lên...",
  uploaded: "Đã tải lên hồ sơ",
  replace: "Chọn tệp khác",
  successToast: "Tải hồ sơ thành công",
  invalidToast: "Định dạng tệp không hợp lệ",
  failedToast: "Tải tệp thất bại",
} as const;

/**
 * Photo preview cache shared across remounts of `FileFieldRenderer`. The
 * register wizard unmounts the form step when the user navigates away (e.g.
 * to verify-email and back), which would otherwise drop the local object URL
 * and force the field to render the generic "Đã tải lên" chip instead of the
 * actual photo. Keying by field name is enough — there is at most one photo
 * field per form, and a fresh upload overwrites the entry.
 */
const PHOTO_PREVIEW_CACHE = new Map<string, string>();

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
  const [previewUrl, setPreviewUrl] = useState<string | null>(() =>
    field.photoPreview ? (PHOTO_PREVIEW_CACHE.get(field.name) ?? null) : null,
  );
  const { fileUploader } = useFormBuilderConfig();

  // No revoke-on-unmount: the wizard unmounts this field when the user steps
  // forward/back, and we need the preview URL to survive that. Revocation
  // happens only when the user explicitly replaces or clears the photo.

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

        const writePreview = (url: string | null) => {
          const prev = PHOTO_PREVIEW_CACHE.get(field.name);
          if (prev && prev !== url) URL.revokeObjectURL(prev);
          if (url) PHOTO_PREVIEW_CACHE.set(field.name, url);
          else PHOTO_PREVIEW_CACHE.delete(field.name);
          setPreviewUrl(url);
        };

        const accept = async (file: File): Promise<void> => {
          if (!matchesAccept(file.name, field.accept)) {
            toast.error(COPY.invalidToast, { description: field.accept });
            return;
          }
          // Show a live local preview as soon as the user picks a file — works
          // for both the mock (no uploader) path and the real presigned-PUT
          // path, so the photo slot is always populated immediately.
          if (field.photoPreview) {
            writePreview(URL.createObjectURL(file));
          }
          if (!fileUploader) {
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
            if (field.photoPreview) writePreview(null);
            toast.error(COPY.failedToast, {
              description: (err as Error).message,
            });
          } finally {
            setUploading(false);
          }
        };

        return (
          <FormItem className={field.photoPreview ? "space-y-1.5" : undefined}>
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
            ) : field.photoPreview && previewUrl ? (
              /* Local image preview — photo slot with overlay controls */
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl shadow">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Ảnh thẻ thí sinh"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/40 px-2 py-1.5">
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="text-[11px] font-medium text-white/90 hover:text-white"
                  >
                    Đổi ảnh
                  </button>
                  <button
                    type="button"
                    aria-label="Xóa ảnh"
                    onClick={() => {
                      writePreview(null);
                      f.onChange("");
                    }}
                    className="rounded-full p-0.5 text-white/70 hover:text-white"
                  >
                    <X className="size-3.5" aria-hidden />
                  </button>
                </div>
              </div>
            ) : filename ? (
              <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
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
            ) : field.photoPreview ? (
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
                  "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-colors",
                  "aspect-[3/4] shadow",
                  dragging
                    ? "border-primary bg-primary/5"
                    : "border-border bg-muted/20 hover:border-primary/50 hover:bg-accent/40",
                )}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-muted-foreground/50"
                  aria-hidden
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span className="text-xs font-medium text-muted-foreground">
                  Chọn ảnh thẻ
                </span>
                {field.accept && (
                  <span className="text-[10px] text-muted-foreground/50">
                    JPG / PNG
                  </span>
                )}
              </button>
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
                {/* Drag is desktop-only; show a tap-oriented label on mobile. */}
                <span className="text-sm font-medium text-foreground sm:hidden">
                  {COPY.hintMobile}
                </span>
                <span className="hidden text-sm font-medium text-foreground sm:inline">
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
