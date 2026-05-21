import {
  Activity,
  ArrowRight,
  BookOpen,
  Building2,
  ClipboardList,
  GraduationCap,
  HeartHandshake,
  Languages,
  ListChecks,
  Palette,
  Receipt,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Reveal } from "@/components/landing/reveal";
import { TENANT_FIXTURES } from "@/lib/tenants/fixtures";
import { Button } from "@ui/components/button";
import { cn } from "@ui/lib/utils";

import { CONTACT_HREF, DEMO_PATH } from "./constants";

export async function Hero() {
  const t = await getTranslations("marketing.hero");

  return (
    <section className="relative isolate overflow-hidden">
      <div className="pointer-events-none absolute -left-24 top-0 -z-10 size-72 rounded-full bg-primary/25 blur-[100px]" />
      <div className="pointer-events-none absolute -right-20 top-10 -z-10 size-80 rounded-full bg-primary/15 blur-[110px]" />
      <div className="mx-auto flex max-w-4xl flex-col items-center px-4 py-20 text-center sm:px-6 sm:py-28 lg:py-36">
        <Reveal>
          <p className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary ring-1 ring-primary/15">
            <span className="size-1.5 rounded-full bg-primary" />
            {t("eyebrow")}
          </p>
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-6xl">
            {t("headline")}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
            {t("subheadline")}
          </p>
        </Reveal>
        <Reveal delay={120} className="mt-10 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="group gap-2 shadow-lg shadow-primary/20">
            <a href={CONTACT_HREF}>
              {t("ctaPrimary")}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href={DEMO_PATH as Route}>{t("ctaSecondary")}</Link>
          </Button>
        </Reveal>
      </div>
    </section>
  );
}

export async function Proof() {
  const t = await getTranslations("marketing.proof");
  const schools = Object.values(TENANT_FIXTURES);

  return (
    <section className="px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <p className="text-center text-sm font-medium uppercase tracking-wide text-muted-foreground">
            {t("title")}
          </p>
        </Reveal>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {schools.map((school, index) => (
            <Reveal key={school.code} delay={index * 80}>
              <Link
                href={`/t/${school.code}` as Route}
                className="group flex h-full items-center gap-3 rounded-2xl bg-card/70 p-4 ring-1 ring-border/40 backdrop-blur transition-all hover:-translate-y-0.5 hover:ring-primary/30"
              >
                <span
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
                  // Each school's own brand colour — a live demonstration of the
                  // per-tenant theming the platform sells.
                  style={{
                    backgroundColor: school.theme.light.primary,
                    color: school.theme.light.primaryForeground,
                  }}
                >
                  {school.shortName.slice(0, 3)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">
                    {school.name}
                  </span>
                  <span className="block text-xs text-muted-foreground transition-colors group-hover:text-primary">
                    {t("viewDemo")} →
                  </span>
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const FEATURE_ITEMS: readonly { key: string; Icon: LucideIcon }[] = [
  { key: "multiTenant", Icon: Building2 },
  { key: "security", Icon: ShieldCheck },
  { key: "formBuilder", Icon: ClipboardList },
  { key: "theming", Icon: Palette },
  { key: "tracking", Icon: Activity },
  { key: "i18n", Icon: Languages },
];

export async function Features() {
  const t = await getTranslations("marketing.features");

  return (
    <section id="features" className="scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {t("title")}
            </h2>
            <p className="mt-4 text-pretty text-muted-foreground">
              {t("subtitle")}
            </p>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURE_ITEMS.map(({ key, Icon }, index) => (
            <Reveal key={key} delay={index * 70}>
              <div className="h-full rounded-3xl bg-card/70 p-6 ring-1 ring-border/40 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:ring-primary/30">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 font-semibold">{t(`items.${key}.title`)}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {t(`items.${key}.desc`)}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const MODULE_ITEMS: readonly { key: string; Icon: LucideIcon; live: boolean }[] =
  [
    { key: "admission", Icon: GraduationCap, live: true },
    { key: "hrms", Icon: Users, live: false },
    { key: "fee", Icon: Receipt, live: false },
    { key: "lms", Icon: BookOpen, live: false },
    { key: "survey", Icon: ListChecks, live: false },
    { key: "crm", Icon: HeartHandshake, live: false },
  ];

export async function Modules() {
  const t = await getTranslations("marketing.modules");

  return (
    <section
      id="modules"
      className="scroll-mt-20 bg-muted/30 px-4 py-16 sm:px-6 sm:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {t("title")}
            </h2>
            <p className="mt-4 text-pretty text-muted-foreground">
              {t("subtitle")}
            </p>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {MODULE_ITEMS.map(({ key, Icon, live }, index) => (
            <Reveal key={key} delay={index * 70}>
              <div className="h-full rounded-3xl bg-card/70 p-6 ring-1 ring-border/40 backdrop-blur">
                <div className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium",
                      live
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {live ? t("live") : t("comingSoon")}
                  </span>
                </div>
                <h3 className="mt-4 font-semibold">{t(`items.${key}.name`)}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {t(`items.${key}.desc`)}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const STEP_KEYS = ["one", "two", "three"] as const;

export async function Steps() {
  const t = await getTranslations("marketing.steps");

  return (
    <section className="px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {t("title")}
            </h2>
            <p className="mt-4 text-pretty text-muted-foreground">
              {t("subtitle")}
            </p>
          </div>
        </Reveal>
        <ol className="mt-12 grid gap-5 sm:grid-cols-3">
          {STEP_KEYS.map((key, index) => (
            <Reveal key={key} delay={index * 80}>
              <li className="h-full rounded-3xl bg-card/70 p-6 ring-1 ring-border/40 backdrop-blur">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-base font-bold text-primary-foreground shadow-md shadow-primary/20">
                  {index + 1}
                </span>
                <h3 className="mt-4 font-semibold">{t(`items.${key}.title`)}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {t(`items.${key}.desc`)}
                </p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

export async function Cta() {
  const t = await getTranslations("marketing.cta");

  return (
    <section id="cta" className="px-4 py-16 sm:px-6 sm:py-24">
      <Reveal className="mx-auto max-w-5xl">
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-primary px-6 py-16 text-center text-primary-foreground sm:px-12 sm:py-20">
          <div className="pointer-events-none absolute -right-10 -top-10 -z-10 size-60 rounded-full bg-primary-foreground/10 blur-3xl" />
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-primary-foreground/80">
            {t("subtitle")}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="secondary">
              <a href={CONTACT_HREF}>{t("primary")}</a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link href={"/login" as Route}>{t("secondary")}</Link>
            </Button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
