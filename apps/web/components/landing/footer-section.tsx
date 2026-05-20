import type { Route } from "next";
import Link from "next/link";

import type { FooterSection } from "@shared/landing";

export function FooterSection({ section }: { section: FooterSection }) {
  const year = new Date().getFullYear();

  return (
    <footer className="relative isolate overflow-hidden bg-gradient-to-b from-muted/30 to-muted/60">
      <div className="pointer-events-none absolute -bottom-24 left-1/2 -z-10 size-96 -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        {section.columns && section.columns.length > 0 && (
          <div className="grid gap-8 sm:grid-cols-3 sm:gap-10">
            {section.columns.map((column) => (
              <div key={column.title}>
                <h3 className="text-sm font-semibold">{column.title}</h3>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href as Route}
                        className="text-sm text-muted-foreground transition-colors hover:text-primary"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
        {section.copyright && (
          <p className="mt-10 border-t border-border/30 pt-6 text-sm text-muted-foreground sm:mt-12">
            © {year} {section.copyright}
          </p>
        )}
      </div>
    </footer>
  );
}
