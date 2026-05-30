"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@ui/components/button";
import { Separator } from "@ui/components/separator";
import { cn } from "@ui/lib/utils";

import { NavLink } from "./nav-link";
import type { NavItem } from "./types";

export type SidebarProps = {
  navItems: readonly NavItem[];
  collapsed: boolean;
  onToggle: () => void;
};

export function Sidebar({ navItems, collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      data-collapsed={collapsed}
      className={cn(
        "sticky top-14 block h-[calc(100dvh-3.5rem)] shrink-0 border-r bg-card transition-[width] duration-200",
        collapsed ? "w-16" : "w-64",
      )}
      aria-label="Sidebar navigation"
    >
      <div className="flex h-full flex-col">
        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              Icon={item.Icon}
              collapsed={collapsed}
            />
          ))}
        </nav>
        <Separator />
        <div className="p-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className={cn("w-full", collapsed && "justify-center px-0")}
            aria-label={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="size-4" />
            ) : (
              <>
                <ChevronLeft className="size-4" />
                <span className="ml-2 text-xs">Thu gọn</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </aside>
  );
}
