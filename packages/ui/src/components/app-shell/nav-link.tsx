"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import type { LucideIcon } from "lucide-react";

import { cn } from "@ui/lib/utils";

type Variant = "sidebar" | "drawer" | "bottom";

export type NavLinkProps = {
  href: string;
  label: string;
  Icon: LucideIcon;
  variant?: Variant;
  collapsed?: boolean;
  onNavigate?: () => void;
};

function isActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  // Exact match only for index routes — otherwise /admin would always match.
  if (href === "/" || href.endsWith("/")) return pathname === href;
  return pathname.startsWith(`${href}/`);
}

export function NavLink({
  href,
  label,
  Icon,
  variant = "sidebar",
  collapsed = false,
  onNavigate,
}: NavLinkProps) {
  const pathname = usePathname();
  const active = isActive(pathname, href);

  if (variant === "bottom") {
    return (
      <Link
        href={href as Route}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-medium",
          active
            ? "text-primary"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Icon className="size-5" aria-hidden />
        <span className="truncate">{label}</span>
      </Link>
    );
  }

  return (
    <Link
      href={href as Route}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      title={collapsed ? label : undefined}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        collapsed && variant === "sidebar" && "justify-center px-2",
        active
          ? "bg-primary/10 text-primary"
          : "text-foreground/70 hover:bg-accent hover:text-accent-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      {(!collapsed || variant !== "sidebar") && (
        <span className="truncate">{label}</span>
      )}
    </Link>
  );
}
