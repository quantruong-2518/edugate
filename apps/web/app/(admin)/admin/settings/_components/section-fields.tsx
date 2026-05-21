"use client";

import { useTranslations } from "next-intl";

import type {
  LandingLink,
  LandingSection,
  LandingSectionType,
} from "@shared/landing";

import { ArrayEditor, LabeledInput, LabeledTextarea } from "./field-kit";

/**
 * Per-type content editor. Renders the right field set for each landing
 * section, narrowing the discriminated union in a switch. Unknown types (a pha
 * 2 config may carry one this build does not know) get a read-only notice — the
 * row can still be reordered or removed.
 */
export function SectionFields({
  section,
  onChange,
}: {
  section: LandingSection;
  onChange: (next: LandingSection) => void;
}) {
  const t = useTranslations("admin.appearance.fields");
  const ts = useTranslations("admin.appearance.sections");

  switch (section.type) {
    case "hero": {
      const set = (patch: Partial<typeof section>) =>
        onChange({ ...section, ...patch });
      const setCta = (
        key: "ctaPrimary" | "ctaSecondary",
        next: LandingLink,
      ) => set({ [key]: next.label || next.href ? next : undefined });
      const primary = section.ctaPrimary ?? { label: "", href: "" };
      const secondary = section.ctaSecondary ?? { label: "", href: "" };
      return (
        <div className="space-y-3">
          <LabeledInput
            label={t("eyebrow")}
            value={section.eyebrow ?? ""}
            onChange={(v) => set({ eyebrow: v })}
          />
          <LabeledInput
            label={t("headline")}
            value={section.headline}
            onChange={(v) => set({ headline: v })}
          />
          <LabeledTextarea
            label={t("subheadline")}
            value={section.subheadline ?? ""}
            onChange={(v) => set({ subheadline: v })}
          />
          <LabeledInput
            label={t("image")}
            value={section.image ?? ""}
            onChange={(v) => set({ image: v })}
          />
          <div className="grid grid-cols-2 gap-2">
            <LabeledInput
              label={`${t("ctaPrimary")} — ${t("label")}`}
              value={primary.label}
              onChange={(v) => setCta("ctaPrimary", { ...primary, label: v })}
            />
            <LabeledInput
              label={`${t("ctaPrimary")} — ${t("href")}`}
              value={primary.href}
              onChange={(v) => setCta("ctaPrimary", { ...primary, href: v })}
            />
            <LabeledInput
              label={`${t("ctaSecondary")} — ${t("label")}`}
              value={secondary.label}
              onChange={(v) =>
                setCta("ctaSecondary", { ...secondary, label: v })
              }
            />
            <LabeledInput
              label={`${t("ctaSecondary")} — ${t("href")}`}
              value={secondary.href}
              onChange={(v) =>
                setCta("ctaSecondary", { ...secondary, href: v })
              }
            />
          </div>
        </div>
      );
    }

    case "stats":
      return (
        <ArrayEditor
          items={section.items}
          onChange={(items) => onChange({ ...section, items })}
          makeEmpty={() => ({ label: "", value: "" })}
          addLabel={ts("addItem")}
          render={(item, update) => (
            <div className="grid grid-cols-2 gap-2">
              <LabeledInput
                label={t("label")}
                value={item.label}
                onChange={(v) => update({ label: v })}
              />
              <LabeledInput
                label={t("value")}
                value={item.value}
                onChange={(v) => update({ value: v })}
              />
            </div>
          )}
        />
      );

    case "process": {
      const set = (patch: Partial<typeof section>) =>
        onChange({ ...section, ...patch });
      return (
        <div className="space-y-3">
          <LabeledInput
            label={t("title")}
            value={section.title ?? ""}
            onChange={(v) => set({ title: v })}
          />
          <ArrayEditor
            items={section.steps}
            onChange={(steps) => set({ steps })}
            makeEmpty={() => ({ title: "", description: "" })}
            addLabel={ts("addItem")}
            render={(item, update) => (
              <div className="space-y-2">
                <LabeledInput
                  label={t("title")}
                  value={item.title}
                  onChange={(v) => update({ title: v })}
                />
                <LabeledTextarea
                  label={t("description")}
                  value={item.description}
                  onChange={(v) => update({ description: v })}
                />
              </div>
            )}
          />
        </div>
      );
    }

    case "infoTabs": {
      const set = (patch: Partial<typeof section>) =>
        onChange({ ...section, ...patch });
      return (
        <div className="space-y-3">
          <LabeledInput
            label={t("title")}
            value={section.title ?? ""}
            onChange={(v) => set({ title: v })}
          />
          <ArrayEditor
            items={section.tabs}
            onChange={(tabs) => set({ tabs })}
            makeEmpty={() => ({ id: "", label: "", body: "" })}
            addLabel={ts("addItem")}
            render={(item, update) => (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <LabeledInput
                    label={t("tabId")}
                    value={item.id}
                    onChange={(v) => update({ id: v })}
                  />
                  <LabeledInput
                    label={t("tabLabel")}
                    value={item.label}
                    onChange={(v) => update({ label: v })}
                  />
                </div>
                <LabeledTextarea
                  label={t("body")}
                  value={item.body}
                  onChange={(v) => update({ body: v })}
                />
              </div>
            )}
          />
        </div>
      );
    }

    case "about": {
      const set = (patch: Partial<typeof section>) =>
        onChange({ ...section, ...patch });
      return (
        <div className="space-y-3">
          <LabeledInput
            label={t("title")}
            value={section.title}
            onChange={(v) => set({ title: v })}
          />
          <LabeledTextarea
            label={t("body")}
            value={section.body}
            onChange={(v) => set({ body: v })}
          />
          <LabeledInput
            label={t("image")}
            value={section.image ?? ""}
            onChange={(v) => set({ image: v })}
          />
        </div>
      );
    }

    case "testimonials": {
      const set = (patch: Partial<typeof section>) =>
        onChange({ ...section, ...patch });
      return (
        <div className="space-y-3">
          <LabeledInput
            label={t("title")}
            value={section.title ?? ""}
            onChange={(v) => set({ title: v })}
          />
          <ArrayEditor
            items={section.items}
            onChange={(items) => set({ items })}
            makeEmpty={() => ({ name: "", role: "", quote: "", avatarUrl: "" })}
            addLabel={ts("addItem")}
            render={(item, update) => (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <LabeledInput
                    label={t("name")}
                    value={item.name}
                    onChange={(v) => update({ name: v })}
                  />
                  <LabeledInput
                    label={t("role")}
                    value={item.role ?? ""}
                    onChange={(v) => update({ role: v })}
                  />
                </div>
                <LabeledTextarea
                  label={t("quote")}
                  value={item.quote}
                  onChange={(v) => update({ quote: v })}
                />
                <LabeledInput
                  label={t("avatarUrl")}
                  value={item.avatarUrl ?? ""}
                  onChange={(v) => update({ avatarUrl: v })}
                />
              </div>
            )}
          />
        </div>
      );
    }

    case "faq": {
      const set = (patch: Partial<typeof section>) =>
        onChange({ ...section, ...patch });
      return (
        <div className="space-y-3">
          <LabeledInput
            label={t("title")}
            value={section.title ?? ""}
            onChange={(v) => set({ title: v })}
          />
          <ArrayEditor
            items={section.items}
            onChange={(items) => set({ items })}
            makeEmpty={() => ({ question: "", answer: "" })}
            addLabel={ts("addItem")}
            render={(item, update) => (
              <div className="space-y-2">
                <LabeledInput
                  label={t("question")}
                  value={item.question}
                  onChange={(v) => update({ question: v })}
                />
                <LabeledTextarea
                  label={t("answer")}
                  value={item.answer}
                  onChange={(v) => update({ answer: v })}
                />
              </div>
            )}
          />
        </div>
      );
    }

    case "footer": {
      const set = (patch: Partial<typeof section>) =>
        onChange({ ...section, ...patch });
      return (
        <div className="space-y-3">
          <LabeledInput
            label={t("copyright")}
            value={section.copyright ?? ""}
            onChange={(v) => set({ copyright: v })}
          />
          <ArrayEditor
            items={section.columns ?? []}
            onChange={(columns) => set({ columns })}
            makeEmpty={() => ({ title: "", links: [] })}
            addLabel={ts("addItem")}
            render={(column, update) => (
              <div className="space-y-2">
                <LabeledInput
                  label={t("columnTitle")}
                  value={column.title}
                  onChange={(v) => update({ title: v })}
                />
                <ArrayEditor
                  items={column.links}
                  onChange={(links) => update({ links })}
                  makeEmpty={() => ({ label: "", href: "" })}
                  addLabel={ts("addItem")}
                  render={(link, updateLink) => (
                    <div className="grid grid-cols-2 gap-2">
                      <LabeledInput
                        label={t("label")}
                        value={link.label}
                        onChange={(v) => updateLink({ label: v })}
                      />
                      <LabeledInput
                        label={t("href")}
                        value={link.href}
                        onChange={(v) => updateLink({ href: v })}
                      />
                    </div>
                  )}
                />
              </div>
            )}
          />
        </div>
      );
    }

    default:
      return (
        <p className="text-sm text-muted-foreground">
          {ts("unsupported", {
            type: (section as { type: string }).type,
          })}
        </p>
      );
  }
}

/** A blank section of the given type, used by the "add section" control. */
export function emptySection(type: LandingSectionType): LandingSection {
  switch (type) {
    case "hero":
      return { type: "hero", headline: "" };
    case "stats":
      return { type: "stats", items: [] };
    case "process":
      return { type: "process", steps: [] };
    case "infoTabs":
      return { type: "infoTabs", tabs: [] };
    case "about":
      return { type: "about", title: "", body: "" };
    case "testimonials":
      return { type: "testimonials", items: [] };
    case "faq":
      return { type: "faq", items: [] };
    case "footer":
      return { type: "footer" };
  }
}
