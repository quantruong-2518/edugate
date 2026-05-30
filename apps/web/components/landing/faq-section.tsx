import type { FaqSection } from "@shared/landing";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@ui/components/accordion";

export function FaqSection({ section }: { section: FaqSection }) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      {section.title && (
        <h2 className="mb-8 text-center text-3xl font-semibold tracking-tight sm:mb-10 sm:text-4xl">
          {section.title}
        </h2>
      )}
      <Accordion type="single" collapsible className="w-full space-y-3">
        {section.items.map((item, index) => (
          <AccordionItem
            key={item.question}
            value={`item-${index}`}
            className="rounded-2xl border border-border bg-card px-5 transition-colors hover:border-primary/40"
          >
            <AccordionTrigger className="text-left font-medium hover:no-underline">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="leading-relaxed text-muted-foreground">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
