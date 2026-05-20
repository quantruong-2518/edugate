import type { FaqSection } from "@shared/landing";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@ui/components/accordion";

export function FaqSection({ section }: { section: FaqSection }) {
  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      {section.title && (
        <h2 className="mb-8 text-center text-3xl font-semibold tracking-tight">
          {section.title}
        </h2>
      )}
      <Accordion type="single" collapsible className="w-full">
        {section.items.map((item, index) => (
          <AccordionItem key={item.question} value={`item-${index}`}>
            <AccordionTrigger>{item.question}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
