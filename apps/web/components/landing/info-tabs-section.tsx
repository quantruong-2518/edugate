import type { InfoTabsSection } from "@shared/landing";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@ui/components/tabs";

export function InfoTabsSection({ section }: { section: InfoTabsSection }) {
  const firstTab = section.tabs[0];
  if (!firstTab) return null;

  return (
    <section className="bg-muted/40">
      <div className="mx-auto max-w-3xl px-6 py-16">
        {section.title && (
          <h2 className="mb-8 text-center text-3xl font-semibold tracking-tight">
            {section.title}
          </h2>
        )}
        <Tabs defaultValue={firstTab.id} className="gap-4">
          <TabsList className="mx-auto">
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
              className="rounded-lg border bg-card p-6 text-sm leading-relaxed text-muted-foreground"
            >
              {tab.body}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}
