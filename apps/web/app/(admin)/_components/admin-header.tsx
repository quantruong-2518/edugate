"use client";

import { useEffect, useState, type FormEvent } from "react";
import { LogOut, Search } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { cn } from "@ui/lib/utils";

/**
 * Admin header — a single fixed row (no sidebar). Left: brand mark + section
 * nav. Right: a global application search + sign out. Desktop-only admin
 * surface (ADR-013), neutral palette via the `.admin-neutral` wrapper.
 */
export function AdminHeader({
  brandShort,
  onSignOut,
}: {
  brandShort: string;
  onSignOut?: () => void;
}) {
  const t = useTranslations("admin.header");
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  // Stay in sync when the `q` param changes elsewhere (e.g. cleared on the
  // applications page) so the field never drifts from the active filter.
  useEffect(() => {
    setQ(searchParams.get("q") ?? "");
  }, [searchParams]);

  const nav: { href: Route; label: string; active: boolean }[] = [
    {
      href: "/admin" as Route,
      label: t("nav.dashboard"),
      active: pathname === "/admin",
    },
    {
      href: "/admin/applications" as Route,
      label: t("nav.applications"),
      active: pathname.startsWith("/admin/applications"),
    },
  ];

  function submitSearch(e: FormEvent) {
    e.preventDefault();
    const query = q.trim();
    router.push(
      (query
        ? `/admin/applications?q=${encodeURIComponent(query)}`
        : "/admin/applications") as Route,
    );
  }

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4">
      <div className="flex items-center gap-1">
        <span className="mr-2 flex size-8 shrink-0 select-none items-center justify-center rounded-md bg-[var(--brand-mark)] text-xs font-semibold text-[var(--brand-mark-foreground)]">
          {brandShort.slice(0, 3).toUpperCase()}
        </span>
        <nav className="flex items-center gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                item.active
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <form onSubmit={submitSearch} className="relative">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("search")}
            className="h-9 w-48 pl-8 lg:w-64"
          />
        </form>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onSignOut}
          className="text-muted-foreground hover:text-foreground"
        >
          <LogOut className="mr-1.5 size-4" aria-hidden />
          {t("signOut")}
        </Button>
      </div>
    </header>
  );
}
