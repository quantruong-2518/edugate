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

const ICONS: Record<InfoTabIcon, LucideIcon> = {
  users: Users,
  calendar: Calendar,
  fileText: FileText,
  mapPin: MapPin,
  graduationCap: GraduationCap,
  info: Info,
};

export function InfoTabsSection({ section }: { section: InfoTabsSection }) {
  const firstTab = section.tabs[0];
  if (!firstTab) return null;

  const layout = section.layout ?? "tabs";

  return (
    <section className="px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-3xl">
        {section.title && (
          <h2 className="mb-8 text-center text-3xl font-semibold tracking-tight sm:mb-10 sm:text-4xl">
            {section.title}
          </h2>
        )}
        {layout === "list" ? (
          <ul className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card">
            {section.tabs.map((tab) => {
              const Icon = tab.icon ? ICONS[tab.icon] : Info;
              return (
                <li key={tab.id} className="flex gap-4 p-6 sm:gap-5 sm:p-7">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
                      {tab.label}
                    </h3>
                    <p className="text-[15px] leading-relaxed text-muted-foreground">
                      {tab.body}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <Tabs defaultValue={firstTab.id} className="gap-5">
            <TabsList className="mx-auto h-auto w-full max-w-md flex-wrap border border-border bg-card sm:w-fit sm:flex-nowrap">
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
                className="rounded-3xl border border-border bg-card p-6 text-[15px] leading-relaxed text-muted-foreground sm:p-8"
              >
                {tab.body}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </section>
  );
}
