"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@ui/components/sheet";

import { BottomNav } from "./bottom-nav";
import { NavLink } from "./nav-link";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import type { AppShellTenantOption, AppShellUser, NavItem } from "./types";

const COLLAPSE_KEY = "app-shell:sidebar-collapsed";

export type AppShellProps = {
  branding: {
    code: string;
    name: string;
    shortName: string;
  };
  user: AppShellUser;
  navItems: readonly NavItem[];
  tenants?: readonly AppShellTenantOption[];
  /** Locale switcher slot, forwarded to the top bar. */
  localeSwitcher?: ReactNode;
  /** Notifications slot (e.g. a bell button), forwarded to the top bar. */
  notifications?: ReactNode;
  children: ReactNode;
};

export function AppShell({
  branding,
  user,
  navItems,
  tenants,
  localeSwitcher,
  notifications,
  children,
}: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Hydrate persisted collapse state. Accepting the brief flash on first
  // paint keeps the layout SSR-static; pha 2 may move this to a cookie.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(COLLAPSE_KEY);
      if (stored === "1") setCollapsed(true);
    } catch {
      // localStorage blocked (private mode, etc.) — fall through to default.
    }
  }, []);

  const toggleSidebar = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  return (
    <div className="min-h-dvh bg-background">
      <TopBar
        brandLabel={branding.name}
        brandShortLabel={branding.shortName}
        currentTenantCode={branding.code}
        tenants={tenants}
        user={user}
        onOpenDrawer={() => setDrawerOpen(true)}
        onToggleSidebar={toggleSidebar}
        sidebarCollapsed={collapsed}
        localeSwitcher={localeSwitcher}
        notifications={notifications}
      />

      <div className="flex">
        <Sidebar
          navItems={navItems}
          collapsed={collapsed}
          onToggle={toggleSidebar}
        />
        <main className="min-w-0 flex-1 pb-20 md:pb-0">{children}</main>
      </div>

      <BottomNav
        navItems={navItems}
        onOpenMore={() => setDrawerOpen(true)}
      />

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="border-b p-4 text-left">
            <SheetTitle className="truncate">{branding.name}</SheetTitle>
            <SheetDescription className="truncate">
              {user.name}
            </SheetDescription>
          </SheetHeader>
          <nav className="space-y-1 p-2">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                Icon={item.Icon}
                variant="drawer"
                onNavigate={() => setDrawerOpen(false)}
              />
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
