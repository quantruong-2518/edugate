"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, GripVertical, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import type { LandingSection, LandingSectionType } from "@shared/landing";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { cn } from "@ui/lib/utils";

import { SectionFields } from "./section-fields";

const KNOWN_TYPES: readonly LandingSectionType[] = [
  "hero",
  "stats",
  "process",
  "infoTabs",
  "about",
  "testimonials",
  "faq",
  "footer",
];

export function SectionCard({
  id,
  section,
  onChange,
  onRemove,
}: {
  id: string;
  section: LandingSection;
  onChange: (next: LandingSection) => void;
  onRemove: () => void;
}) {
  const t = useTranslations("admin.appearance.sections");
  const [open, setOpen] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const typeKnown = (KNOWN_TYPES as readonly string[]).includes(section.type);
  const typeLabel = typeKnown
    ? t(`types.${section.type as LandingSectionType}`)
    : section.type;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "rounded-xl border border-border/60 bg-card",
        isDragging && "z-10 opacity-80 shadow-lg",
      )}
    >
      <div className="flex items-center gap-2 p-2">
        <button
          type="button"
          aria-label={t("dragHint")}
          className="cursor-grab touch-none rounded-md p-1.5 text-muted-foreground hover:bg-muted active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
        <button
          type="button"
          className="flex flex-1 items-center gap-2 text-left"
          onClick={() => setOpen((v) => !v)}
        >
          <Badge variant="secondary">{typeLabel}</Badge>
          <ChevronDown
            className={cn(
              "size-4 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
      {open && (
        <div className="border-t border-border/60 p-3">
          <SectionFields section={section} onChange={onChange} />
        </div>
      )}
    </div>
  );
}
