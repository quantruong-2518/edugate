"use client";

import { Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Textarea } from "@ui/components/textarea";

/** Small labeled controls shared by the section field editors. */

export function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function LabeledTextarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Textarea
        value={value}
        rows={3}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

/**
 * Repeating-row editor for array fields (stats items, faq entries, ...). The
 * caller renders each row via `render`, receiving an immutable `update` patcher.
 */
export function ArrayEditor<T>({
  items,
  onChange,
  makeEmpty,
  addLabel,
  render,
}: {
  items: T[];
  onChange: (next: T[]) => void;
  makeEmpty: () => T;
  addLabel: string;
  render: (
    item: T,
    update: (patch: Partial<T>) => void,
    index: number,
  ) => ReactNode;
}) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          // Index key is acceptable: rows reorder only via whole-section drag,
          // never within this list.
          key={index}
          className="space-y-2 rounded-lg border border-border/60 bg-muted/30 p-3"
        >
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-muted-foreground hover:text-destructive"
              onClick={() => onChange(items.filter((_, j) => j !== index))}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
          {render(
            item,
            (patch) =>
              onChange(
                items.map((it, j) => (j === index ? { ...it, ...patch } : it)),
              ),
            index,
          )}
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => onChange([...items, makeEmpty()])}
      >
        <Plus className="size-3.5" />
        {addLabel}
      </Button>
    </div>
  );
}
