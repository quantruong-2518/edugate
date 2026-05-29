"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";

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

/**
 * Admin shell — desktop web only (no responsive/mobile layout, see ADR-013
 * scope note). A persistent sidebar + top bar; the sidebar collapses to an
 * icon rail as a desktop convenience.
 */
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
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
