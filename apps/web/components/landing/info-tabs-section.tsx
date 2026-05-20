import type { InfoTabsSection } from "@shared/landing";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";

import { Reveal } from "./reveal";

export function InfoTabsSection({ section }: { section: InfoTabsSection }) {
  const firstTab = section.tabs[0];
  if (!firstTab) return null;

  return (
    <section className="relative isolate overflow-hidden px-6 py-24">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 size-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px]" />
      <Reveal className="mx-auto max-w-3xl">
        {section.title && (
          <h2 className="mb-10 text-center text-3xl font-semibold tracking-tight sm:text-4xl">
            {section.title}
          </h2>
        )}
        <Tabs defaultValue={firstTab.id} className="gap-5">
          <TabsList className="mx-auto bg-card/70 shadow-sm ring-1 ring-border/40 backdrop-blur">
            {section.tabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {section.tabs.map((tab) => (
            <TabsContent
              key={tab.id}
              value={tab.id}
              className="rounded-3xl bg-card/70 p-8 text-[15px] leading-relaxed text-muted-foreground shadow-sm ring-1 ring-border/40 backdrop-blur"
            >
              {tab.body}
            </TabsContent>
          ))}
        </Tabs>
      </Reveal>
    </section>
  );
}
