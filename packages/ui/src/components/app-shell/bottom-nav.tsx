"use client";

import { Menu } from "lucide-react";

import { cn } from "@ui/lib/utils";

import { NavLink } from "./nav-link";
import type { NavItem } from "./types";

export type BottomNavProps = {
  navItems: readonly NavItem[];
  onOpenMore: () => void;
};

export function BottomNav({ navItems, onOpenMore }: BottomNavProps) {
  const pinned = navItems.filter((item) => item.pinned).slice(0, 4);

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 flex h-16 items-stretch border-t bg-card md:hidden",
      )}
      aria-label="Bottom navigation"
    >
      {pinned.map((item) => (
        <NavLink
          key={item.href}
          href={item.href}
          label={item.label}
          Icon={item.Icon}
          variant="bottom"
        />
      ))}
      <button
        type="button"
        onClick={onOpenMore}
        className="flex flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-medium text-muted-foreground hover:text-foreground"
        aria-label="Mở menu đầy đủ"
      >
        <Menu className="size-5" aria-hidden />
        <span>Thêm</span>
      </button>
    </nav>
  );
}
