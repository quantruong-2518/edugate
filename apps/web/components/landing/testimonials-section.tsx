import type { TestimonialsSection } from "@shared/landing";
import { Card, CardContent } from "@ui/components/card";

export function TestimonialsSection({
  section,
}: {
  section: TestimonialsSection;
}) {
  return (
    <section className="bg-muted/40">
      <div className="mx-auto max-w-5xl px-6 py-16">
        {section.title && (
          <h2 className="mb-10 text-center text-3xl font-semibold tracking-tight">
            {section.title}
          </h2>
        )}
        <div className="grid gap-6 sm:grid-cols-2">
          {section.items.map((item) => (
            <Card key={item.name}>
              <CardContent className="pt-6">
                <blockquote className="text-pretty leading-relaxed">
                  “{item.quote}”
                </blockquote>
                <div className="mt-4 text-sm font-medium">{item.name}</div>
                {item.role && (
                  <div className="text-sm text-muted-foreground">
                    {item.role}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
