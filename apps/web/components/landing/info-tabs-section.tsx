import {
  Calendar,
  FileText,
  GraduationCap,
  Info,
  MapPin,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { InfoTabIcon, InfoTabsSection } from "@shared/landing";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";

import { HighlightedText } from "./highlight-text";
import { PhotoIdPlaceholder } from "./photo-id-placeholder";

type InfoTab = InfoTabsSection["tabs"][number];

const ICONS: Record<InfoTabIcon, LucideIcon> = {
  users: Users,
  calendar: Calendar,
  fileText: FileText,
  mapPin: MapPin,
  graduationCap: GraduationCap,
  info: Info,
};

function hasPhotoContent(body: string | undefined) {
  return !!body && body.toLowerCase().includes("ảnh thẻ");
}

/** Vertical timeline (lộ trình) for tabs that supply dated `steps`. */
function TabTimeline({ steps }: { steps: NonNullable<InfoTab["steps"]> }) {
  return (
    <ol className="relative mt-4 space-y-5 border-l border-border pl-6">
      {steps.map((step) => (
        <li key={`${step.date ?? ""}-${step.text}`} className="relative">
          <span
            aria-hidden
            className="absolute -left-[33px] top-1.5 size-3 rounded-full bg-primary ring-4 ring-card"
          />
          {step.date && (
            <p className="text-sm font-semibold text-primary">
              <HighlightedText text={step.date} />
            </p>
          )}
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            <HighlightedText text={step.text} />
          </p>
        </li>
      ))}
    </ol>
  );
}

/** A tab's content: a timeline when `steps` is set, else a body paragraph. */
function TabContent({
  tab,
  bodyClassName,
}: {
  tab: InfoTab;
  bodyClassName?: string;
}) {
  if (tab.steps?.length) return <TabTimeline steps={tab.steps} />;
  if (!tab.body) return null;
  return (
    <>
      <p
        className={`text-[15px] leading-relaxed text-muted-foreground${
          bodyClassName ? ` ${bodyClassName}` : ""
        }`}
      >
        <HighlightedText text={tab.body} />
      </p>
      {hasPhotoContent(tab.body) && <PhotoIdPlaceholder />}
    </>
  );
}

export function InfoTabsSection({ section }: { section: InfoTabsSection }) {
  const firstTab = section.tabs[0];
  if (!firstTab) return null;

  const layout = section.layout ?? "tabs";
  const maxWidth = layout === "cards" ? "max-w-6xl" : "max-w-3xl";

  return (
    <section className="bg-muted/50 px-4 py-16 sm:px-6 sm:py-24">
      <div className={`mx-auto ${maxWidth}`}>
        {section.title && (
          <h2 className="mb-8 text-center text-3xl font-semibold tracking-tight sm:mb-12 sm:text-4xl">
            {section.title}
          </h2>
        )}

        {layout === "cards" ? (
          <div className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0">
            {section.tabs.map((tab) => {
              const Icon = tab.icon ? ICONS[tab.icon] : Info;
              return (
                <div
                  key={tab.id}
                  className="flex min-w-[82%] snap-center flex-col rounded-3xl bg-gradient-to-br from-card to-muted/40 p-6 shadow-sm sm:min-w-0 sm:p-7"
                >
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold tracking-tight">
                    {tab.label}
                  </h3>
                  {tab.highlight && (
                    <p className="mt-1 font-semibold text-primary">
                      <HighlightedText text={tab.highlight} />
                    </p>
                  )}
                  <TabContent tab={tab} bodyClassName="mt-2" />
                </div>
              );
            })}
          </div>
        ) : layout === "list" ? (
          <ul className="divide-y divide-border/60 overflow-hidden rounded-3xl bg-gradient-to-br from-card to-muted/30 shadow-sm">
            {section.tabs.map((tab) => {
              const Icon = tab.icon ? ICONS[tab.icon] : Info;
              return (
                <li key={tab.id} className="flex gap-4 p-6 sm:gap-5 sm:p-7">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
                      {tab.label}
                    </h3>
                    {tab.highlight && (
                      <p className="font-semibold text-primary">
                        <HighlightedText text={tab.highlight} />
                      </p>
                    )}
                    <TabContent tab={tab} />
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <Tabs defaultValue={firstTab.id} className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
            {/* Mobile: an equal-width segmented control — each tab shares the row
                (no overflow), icon stacked above a small wrapping label. Desktop:
                a vertical sidebar with icon + label inline. */}
            <TabsList className="flex h-auto w-full flex-row gap-1 rounded-2xl bg-muted/60 p-1.5 sm:w-52 sm:shrink-0 sm:flex-col">
              {section.tabs.map((tab) => {
                const Icon = tab.icon ? ICONS[tab.icon] : Info;
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 whitespace-normal rounded-xl px-1.5 py-2 text-center text-xs font-medium leading-tight data-[state=active]:text-primary sm:w-full sm:flex-none sm:flex-row sm:items-center sm:justify-start sm:gap-3 sm:whitespace-nowrap sm:px-4 sm:py-3 sm:text-left sm:text-sm"
                  >
                    <Icon className="size-4 shrink-0" aria-hidden />
                    {tab.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
            <div className="min-w-0 flex-1">
              {section.tabs.map((tab) => (
                <TabsContent
                  key={tab.id}
                  value={tab.id}
                  className="mt-0 rounded-2xl border border-border/50 bg-card p-6 sm:p-8"
                >
                  {tab.highlight && (
                    <p className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                      <HighlightedText text={tab.highlight} />
                    </p>
                  )}
                  <TabContent
                    tab={tab}
                    bodyClassName={tab.highlight ? "mt-2" : undefined}
                  />
                </TabsContent>
              ))}
            </div>
          </Tabs>
        )}
      </div>
    </section>
  );
}
