import { GraduationCap, MapPin } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { CONTACT_HREF, DEMO_PATH } from "./constants";

export async function MarketingFooter() {
  const t = await getTranslations("marketing.footer");
  const year = new Date().getFullYear();

  const columns = [
    {
      title: t("product"),
      links: [
        { label: t("links.features"), href: "#features" },
        { label: t("links.modules"), href: "#modules" },
        { label: t("links.demo"), href: DEMO_PATH },
        { label: t("links.login"), href: "/login" },
      ],
    },
    {
      title: t("company"),
      links: [
        { label: t("links.about"), href: "#" },
        { label: t("links.contact"), href: CONTACT_HREF },
      ],
    },
    {
      title: t("legal"),
      links: [
        { label: t("links.privacy"), href: "#" },
        { label: t("links.terms"), href: "#" },
      ],
    },
  ];

  return (
    <footer className="border-t border-border/40 bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-10 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2 font-semibold">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <GraduationCap className="size-5" />
              </span>
              EduGate
            </div>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              {t("tagline")}
            </p>
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="size-3.5" />
              {t("dataResidency")}
            </p>
          </div>
          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold">{column.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-12 border-t border-border/30 pt-6 text-sm text-muted-foreground">
          © {year} {t("copyright")}
        </p>
      </div>
    </footer>
  );
}
