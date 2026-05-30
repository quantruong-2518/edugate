import type { Route } from "next";
import Link from "next/link";

import type { FooterSection } from "@shared/landing";

export async function FooterSection({ section }: { section: FooterSection }) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/50 bg-gradient-to-b from-muted/30 to-muted/60">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between md:gap-16">
          {section.columns && section.columns.length > 0 && (
            <div className="grid grid-cols-2 gap-8 sm:gap-x-16">
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
        </div>

        {/* Bottom bar: copyright and product attribution on opposite ends. */}
        <div className="mt-10 flex flex-col gap-2 border-t border-border/50 pt-6 sm:mt-12 sm:flex-row sm:items-center sm:justify-between">
          {section.copyright && (
            <p className="text-sm text-muted-foreground">
              © {year} {section.copyright}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            Một sản phẩm của{" "}
            <a
              href="https://senera.vn"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-pink-400 via-rose-300 to-sky-400 bg-clip-text font-semibold text-transparent transition-opacity hover:opacity-80"
            >
              Senera
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
