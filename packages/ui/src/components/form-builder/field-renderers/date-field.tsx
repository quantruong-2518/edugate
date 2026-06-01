"use client";

import { useEffect, useState } from "react";

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

/** `2015-06-12` → `12/06/2015`. Empty string in → empty string out. */
function isoToDmy(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return "";
  return `${m[3]}/${m[2]}/${m[1]}`;
}

/** `12/06/2015` → `2015-06-12`. Returns null on any malformed / impossible date. */
function dmyToIso(s: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
  if (!m) return null;
  const dd = Number(m[1]);
  const mm = Number(m[2]);
  const yyyy = Number(m[3]);
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  // Round-trip through Date to reject impossible dates (Feb 30, Apr 31, …).
  const d = new Date(yyyy, mm - 1, dd);
  if (
    d.getFullYear() !== yyyy ||
    d.getMonth() !== mm - 1 ||
    d.getDate() !== dd
  ) {
    return null;
  }
  return `${m[3]}-${m[2]}-${m[1]}`;
}

/**
 * Insert `/` separators while the user types — `12062015` → `12/06/2015`. Any
 * non-digit is stripped first, so paste-from-clipboard with `.` or `-` still
 * normalises cleanly. Caps at 8 digits.
 */
function maskDmy(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/**
 * Masked DD/MM/YYYY text input. Native `<input type="date">` uses the
 * browser/OS locale (en-US shows MM/DD/YYYY), which confuses Vietnamese
 * parents. The form value stays ISO (YYYY-MM-DD) so Zod validation and
 * submission are unaffected.
 */
export function DateFieldRenderer({ field, control }: FieldProps<DateFieldSchema>) {
  return (
    <FormField
      control={control}
      name={field.name}
      render={({ field: f }) => {
        const iso = (f.value as string | undefined) ?? "";
        // Display state mirrors `f.value` but also holds partial typing
        // ("12/" while the user is still entering) that has no valid ISO yet.
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [display, setDisplay] = useState<string>(() => isoToDmy(iso));

        // Sync the visible text when the form value changes from outside
        // (draft restore, programmatic reset, etc.). Skip when we're already
        // showing the same date to avoid clobbering mid-type partial input.
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useEffect(() => {
          const expected = isoToDmy(iso);
          if (expected !== display && dmyToIso(display) !== iso) {
            setDisplay(expected);
          }
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [iso]);

        return (
          <FormItem>
            <FormLabel>
              {field.label}
              {field.required && <span className="text-destructive"> *</span>}
            </FormLabel>
            <FormControl>
              <Input
                type="text"
                inputMode="numeric"
                autoComplete="bday"
                placeholder="DD/MM/YYYY"
                maxLength={10}
                name={f.name}
                ref={f.ref}
                onBlur={f.onBlur}
                value={display}
                onChange={(e) => {
                  const next = maskDmy(e.target.value);
                  setDisplay(next);
                  // Only push a value to the form once it parses to a real
                  // date. Partial input clears the field so `required`
                  // validation fires correctly.
                  f.onChange(dmyToIso(next) ?? "");
                }}
              />
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
