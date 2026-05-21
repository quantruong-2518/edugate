"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import type { LandingSection, LandingSectionType } from "@shared/landing";
import { LANDING_SECTION_TYPES } from "@shared/landing";
import { Button } from "@ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/components/select";

import { SectionCard } from "./section-card";

export type SectionItem = { id: string; section: LandingSection };

export function SectionsPanel({
  items,
  onReorder,
  onUpdate,
  onRemove,
  onAdd,
}: {
  items: SectionItem[];
  onReorder: (next: SectionItem[]) => void;
  onUpdate: (id: string, next: LandingSection) => void;
  onRemove: (id: string) => void;
  onAdd: (type: LandingSectionType) => void;
}) {
  const t = useTranslations("admin.appearance.sections");
  const [addType, setAddType] = useState<LandingSectionType>("hero");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = items.findIndex((it) => it.id === active.id);
    const to = items.findIndex((it) => it.id === over.id);
    if (from === -1 || to === -1) return;
    onReorder(arrayMove(items, from, to));
  }

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((it) => it.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {items.map((it) => (
                <SectionCard
                  key={it.id}
                  id={it.id}
                  section={it.section}
                  onChange={(next) => onUpdate(it.id, next)}
                  onRemove={() => onRemove(it.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <div className="flex items-center gap-2 pt-1">
        <Select
          value={addType}
          onValueChange={(v) => setAddType(v as LandingSectionType)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANDING_SECTION_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {t(`types.${type}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          className="gap-1.5"
          onClick={() => onAdd(addType)}
        >
          <Plus className="size-4" />
          {t("add")}
        </Button>
      </div>
    </div>
  );
}
