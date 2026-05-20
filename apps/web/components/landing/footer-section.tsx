import type { Route } from "next";
import Link from "next/link";

import type { FooterSection } from "@shared/landing";

export function FooterSection({ section }: { section: FooterSection }) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-card">
      <div className="mx-auto max-w-5xl px-6 py-12">
        {section.columns && section.columns.length > 0 && (
          <div className="grid gap-8 sm:grid-cols-3">
            {section.columns.map((column) => (
              <div key={column.title}>
                <h3 className="text-sm font-semibold">{column.title}</h3>
                <ul className="mt-3 space-y-2">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href as Route}
                        className="text-sm text-muted-foreground hover:text-foreground"
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
          <p className="mt-8 text-sm text-muted-foreground">
            © {year} {section.copyright}
          </p>
        )}
      </div>
    </footer>
  );
}
