"use client";

import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";

/**
 * Color control: a native swatch picker beside a free text field. The text
 * field is canonical and accepts any CSS color (the existing tenant fixtures
 * use oklch); it drives the live preview directly. The native `<input
 * type="color">` only emits hex, so it seeds from the text value when that
 * value is already hex and overwrites it with hex on pick — a dependency-free
 * way to avoid an oklch↔hex conversion library.
 */
export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const swatch = /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000";
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={label}
          value={swatch}
          onChange={(e) => onChange(e.target.value)}
          className="size-9 shrink-0 cursor-pointer rounded-md border border-input bg-transparent p-0.5"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono text-xs"
        />
      </div>
    </div>
  );
}
