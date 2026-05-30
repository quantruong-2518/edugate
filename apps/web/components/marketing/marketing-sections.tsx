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
  MapPin,
  Palette,
  Receipt,
  ScrollText,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { TENANT_FIXTURES } from "@/lib/tenants/fixtures";
import { Button } from "@ui/components/button";
import { cn } from "@ui/lib/utils";

import { CONTACT_HREF, DEMO_PATH } from "./constants";

export async function Hero() {
  const t = await getTranslations("marketing.hero");

  return (
    <section className="relative isolate overflow-hidden">
      <div className="pointer-events-none absolute -left-24 top-0 -z-10 size-72 rounded-full bg-primary/20 blur-[110px]" />
      <div className="mx-auto flex max-w-4xl flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-20 lg:py-24">
        <p className="mb-6 rounded-full border border-border bg-background px-4 py-1.5 text-sm font-medium text-primary">
          {t("eyebrow")}
        </p>
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-6xl">
          {t("headline")}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
          {t("subheadline")}
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="group gap-2">
            <a href={CONTACT_HREF}>
              {t("ctaPrimary")}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href={DEMO_PATH as Route}>{t("ctaSecondary")}</Link>
          </Button>
        </div>
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
        <p className="text-center text-sm font-medium text-muted-foreground">
          {t("title")}
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {schools.map((school) => (
            <Link
              key={school.code}
              href={`/t/${school.code}` as Route}
              className="group flex h-full items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
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
          ))}
        </div>
      </div>
    </section>
  );
}

const TRUST_ITEMS: readonly { key: string; Icon: LucideIcon }[] = [
  { key: "residency", Icon: MapPin },
  { key: "isolation", Icon: ShieldCheck },
  { key: "audit", Icon: ScrollText },
];

export async function Trust() {
  const t = await getTranslations("marketing.trust");

  return (
    <section className="px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl rounded-[2rem] border border-border bg-card p-8 sm:p-12">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="lg:py-2">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {t("title")}
            </h2>
            <p className="mt-5 text-pretty leading-relaxed text-muted-foreground">
              {t("body")}
            </p>
          </div>
          <ul className="space-y-5">
            {TRUST_ITEMS.map(({ key, Icon }) => (
              <li key={key} className="flex gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div>
                  <h3 className="font-semibold">{t(`items.${key}.title`)}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {t(`items.${key}.desc`)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
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
      <div className="mx-auto max-w-4xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-pretty text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {FEATURE_ITEMS.map(({ key, Icon }) => (
            <div
              key={key}
              className="h-full rounded-3xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
            >
              <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-4 font-semibold">{t(`items.${key}.title`)}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {t(`items.${key}.desc`)}
              </p>
            </div>
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
      className="scroll-mt-20 bg-muted/40 px-4 py-16 sm:px-6 sm:py-24"
    >
      <div className="mx-auto max-w-4xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-pretty text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        {/* 2-col card grid, not a long <ul> divide-y: tasteskill bans the
            divide-y list pattern for lists over 5 items, and Modules has 6. */}
        <ul className="mt-10 grid gap-5 sm:grid-cols-2">
          {MODULE_ITEMS.map(({ key, Icon, live }) => (
            <li
              key={key}
              className="flex items-start gap-4 rounded-3xl border border-border bg-card p-5 sm:p-6"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <h3 className="font-semibold">{t(`items.${key}.name`)}</h3>
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
                <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                  {t(`items.${key}.desc`)}
                </p>
              </div>
            </li>
          ))}
        </ul>
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
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-pretty text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        {/* Horizontal connected timeline — a third distinct layout family. */}
        <div className="relative mt-14">
          <div
            className="absolute inset-x-0 top-7 hidden h-px bg-border sm:block"
            aria-hidden
          />
          <ol className="relative grid gap-10 sm:grid-cols-3 sm:gap-8">
            {STEP_KEYS.map((key, index) => (
              <li key={key} className="text-center">
                <span className="mx-auto flex size-14 items-center justify-center rounded-full border border-border bg-background text-lg font-bold text-primary">
                  {index + 1}
                </span>
                <h3 className="mt-4 font-semibold">{t(`items.${key}.title`)}</h3>
                <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-muted-foreground">
                  {t(`items.${key}.desc`)}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

export async function Cta() {
  const t = await getTranslations("marketing.cta");

  return (
    <section id="cta" className="px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-[2rem] bg-primary px-6 py-16 text-center text-primary-foreground sm:px-12 sm:py-20">
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
          </div>
        </div>
      </div>
    </section>
  );
}
