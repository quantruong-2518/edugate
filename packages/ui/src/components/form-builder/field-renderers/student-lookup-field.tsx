"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Search } from "lucide-react";

import type {
  StudentLookupField as StudentLookupFieldSchema,
  StudentLookupValue,
} from "@shared/form";

import { Button } from "@ui/components/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@ui/components/form";
import { Input } from "@ui/components/input";

import { useFormBuilderConfig } from "../context";
import type { FieldProps } from "./types";

// Domain-fixed VI labels (default locale `vi`); same convention as address.
const GENDER_LABEL: Record<string, string> = {
  male: "Nam",
  female: "Nữ",
  other: "Khác",
};
const DOB_FMT = new Intl.DateTimeFormat("vi-VN", { dateStyle: "long" });

function formatDob(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : DOB_FMT.format(d);
}

export function StudentLookupFieldRenderer({
  field,
  control,
}: FieldProps<StudentLookupFieldSchema>) {
  const { studentResolver } = useFormBuilderConfig();
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  return (
    <FormField
      control={control}
      name={field.name}
      render={({ field: f }) => {
        const value = (f.value as StudentLookupValue | undefined) ?? {
          code: "",
        };
        const resolved = Boolean(value.name);

        const setCode = (code: string) => {
          setNotFound(false);
          // Editing the code invalidates any previously resolved record.
          f.onChange({ code });
        };

        const lookup = async () => {
          const code = (value.code ?? "").trim();
          if (!code || !studentResolver) return;
          setLoading(true);
          setNotFound(false);
          try {
            const record = await studentResolver(code);
            if (record) {
              f.onChange(record);
            } else {
              f.onChange({ code });
              setNotFound(true);
            }
          } finally {
            setLoading(false);
          }
        };

        return (
          <FormItem>
            <FormLabel>
              {field.label}
              {field.required && <span className="text-destructive"> *</span>}
            </FormLabel>
            <div className="flex gap-2">
              <FormControl>
                <Input
                  inputMode="numeric"
                  placeholder={field.placeholder}
                  value={value.code ?? ""}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void lookup();
                    }
                  }}
                  onBlur={f.onBlur}
                />
              </FormControl>
              <Button
                type="button"
                variant="outline"
                onClick={() => void lookup()}
                disabled={loading || !value.code}
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Search className="size-4" aria-hidden />
                )}
                Tra cứu
              </Button>
            </div>

            {resolved && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <CheckCircle2 className="size-4 text-primary" aria-hidden />
                  {value.name}
                </div>
                <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Ngày sinh</dt>
                    <dd className="font-medium">{formatDob(value.dob)}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Giới tính</dt>
                    <dd className="font-medium">
                      {GENDER_LABEL[value.gender ?? ""] ?? "—"}
                    </dd>
                  </div>
                </dl>
              </div>
            )}

            {notFound && (
              <p className="text-xs font-medium text-destructive">
                Không tìm thấy học sinh với mã này. Vui lòng kiểm tra lại.
              </p>
            )}

            {field.description && !resolved && (
              <FormDescription>{field.description}</FormDescription>
            )}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
