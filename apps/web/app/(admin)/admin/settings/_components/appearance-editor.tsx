"use client";

import { RotateCcw, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  landingConfigSchema,
  type LandingConfig,
  type LandingSection,
  type LandingSectionType,
} from "@shared/landing";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@ui/components/tabs";

import {
  clearAppearanceDraft,
  loadAppearanceDraft,
  saveAppearanceDraft,
  type BrandingDraft,
} from "@/lib/api/appearance";

import { BrandingPanel } from "./branding-panel";
import { LandingPreview } from "./landing-preview";
import { emptySection } from "./section-fields";
import { SectionsPanel, type SectionItem } from "./sections-panel";

function toItems(config: LandingConfig, prefix: string): SectionItem[] {
  return config.sections.map((section, i) => ({
    id: `${prefix}-${i}`,
    section,
  }));
}

export function AppearanceEditor({
  tenantCode,
  initialBranding,
  initialConfig,
}: {
  tenantCode: string;
  initialBranding: BrandingDraft;
  initialConfig: LandingConfig;
}) {
  const t = useTranslations("admin.appearance");

  const [branding, setBranding] = useState<BrandingDraft>(initialBranding);
  // Deterministic ids (`s-<i>`) so SSR and the first client render agree.
  const [items, setItems] = useState<SectionItem[]>(() =>
    toItems(initialConfig, "s"),
  );
  const nextId = useRef(initialConfig.sections.length);

  // Overlay a saved draft after mount (localStorage is client-only).
  useEffect(() => {
    const draft = loadAppearanceDraft(tenantCode);
    if (!draft) return;
    setBranding(draft.branding);
    setItems(toItems(draft.config, "d"));
    nextId.current = draft.config.sections.length;
  }, [tenantCode]);

  const updateSection = (id: string, next: LandingSection) =>
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, section: next } : it)),
    );
  const removeSection = (id: string) =>
    setItems((prev) => prev.filter((it) => it.id !== id));
  const addSection = (type: LandingSectionType) =>
    setItems((prev) => [
      ...prev,
      { id: `n-${nextId.current++}`, section: emptySection(type) },
    ]);

  const sections = items.map((it) => it.section);

  function handleSave() {
    const result = landingConfigSchema.safeParse({ sections });
    if (!result.success) {
      toast.error(t("invalid"));
      return;
    }
    saveAppearanceDraft(tenantCode, { branding, config: result.data });
    toast.success(t("saved"));
  }

  function handleReset() {
    clearAppearanceDraft(tenantCode);
    setBranding(initialBranding);
    setItems(toItems(initialConfig, "s"));
    nextId.current = initialConfig.sections.length;
    toast.success(t("resetDone"));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="lg:max-h-[calc(100vh-8rem)] lg:overflow-hidden">
        <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-base">{t("title")}</CardTitle>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={handleReset}
            >
              <RotateCcw className="size-4" />
              {t("reset")}
            </Button>
            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              onClick={handleSave}
            >
              <Save className="size-4" />
              {t("save")}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="lg:overflow-y-auto">
          <Tabs defaultValue="branding">
            <TabsList className="mb-4">
              <TabsTrigger value="branding">{t("tabs.branding")}</TabsTrigger>
              <TabsTrigger value="sections">{t("tabs.sections")}</TabsTrigger>
            </TabsList>
            <TabsContent value="branding">
              <BrandingPanel value={branding} onChange={setBranding} />
            </TabsContent>
            <TabsContent value="sections">
              <SectionsPanel
                items={items}
                onReorder={setItems}
                onUpdate={updateSection}
                onRemove={removeSection}
                onAdd={addSection}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="lg:sticky lg:top-20 lg:self-start">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-sm font-medium">{t("previewTitle")}</h2>
          <p className="text-xs text-muted-foreground">{t("previewNote")}</p>
        </div>
        <div className="overflow-hidden rounded-xl border border-border/60 lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto">
          <LandingPreview sections={sections} branding={branding} />
        </div>
      </div>
    </div>
  );
}
