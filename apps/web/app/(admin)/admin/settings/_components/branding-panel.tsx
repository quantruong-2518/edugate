"use client";

import { useTranslations } from "next-intl";

import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/components/select";

import type { BrandingDraft } from "@/lib/api/appearance";

import { ColorField } from "./color-field";

const FONT_OPTIONS: readonly { value: string; label: string }[] = [
  {
    label: "Inter (mặc định)",
    value:
      "var(--font-sans), ui-sans-serif, system-ui, -apple-system, sans-serif",
  },
  {
    label: "System UI",
    value: "ui-sans-serif, system-ui, -apple-system, sans-serif",
  },
  { label: "Georgia (serif)", value: "Georgia, 'Times New Roman', serif" },
  {
    label: "Monospace",
    value: "ui-monospace, SFMono-Regular, Menlo, monospace",
  },
];

function radiusToRem(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0.625;
}

export function BrandingPanel({
  value,
  onChange,
}: {
  value: BrandingDraft;
  onChange: (next: BrandingDraft) => void;
}) {
  const t = useTranslations("admin.appearance.branding");
  const set = (patch: Partial<BrandingDraft>) =>
    onChange({ ...value, ...patch });

  const fontMatched = FONT_OPTIONS.some((f) => f.value === value.fontSans);

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">{t("logoUrl")}</Label>
        <Input
          value={value.logoUrl ?? ""}
          placeholder={t("logoUrlPlaceholder")}
          onChange={(e) => set({ logoUrl: e.target.value || null })}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">{t("font")}</Label>
        <Select
          value={fontMatched ? value.fontSans : ""}
          onValueChange={(v) => set({ fontSans: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_OPTIONS.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">
          {t("radius")} — {value.radius}
        </Label>
        <input
          type="range"
          min={0}
          max={2}
          step={0.125}
          value={radiusToRem(value.radius)}
          onChange={(e) => set({ radius: `${e.target.value}rem` })}
          className="w-full accent-primary"
        />
      </div>

      <div className="space-y-3 border-t border-border/60 pt-4">
        <p className="text-sm font-medium">{t("colors")}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <ColorField
            label={t("primaryLight")}
            value={value.primaryLight}
            onChange={(v) => set({ primaryLight: v })}
          />
          <ColorField
            label={t("primaryForegroundLight")}
            value={value.primaryForegroundLight}
            onChange={(v) => set({ primaryForegroundLight: v })}
          />
          <ColorField
            label={t("primaryDark")}
            value={value.primaryDark}
            onChange={(v) => set({ primaryDark: v })}
          />
          <ColorField
            label={t("primaryForegroundDark")}
            value={value.primaryForegroundDark}
            onChange={(v) => set({ primaryForegroundDark: v })}
          />
        </div>
      </div>
    </div>
  );
}
