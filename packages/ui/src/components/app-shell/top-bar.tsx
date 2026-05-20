"use client";

import { useState } from "react";
import {
  Check,
  ChevronDown,
  Globe,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  UserRound,
} from "lucide-react";

import { Button } from "@ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import { cn } from "@ui/lib/utils";

import type { AppShellTenantOption, AppShellUser } from "./types";

export type TopBarProps = {
  brandLabel: string;
  brandShortLabel: string;
  currentTenantCode: string;
  tenants?: readonly AppShellTenantOption[];
  user: AppShellUser;
  /** Open the full nav drawer (mobile). */
  onOpenDrawer: () => void;
  /** Toggle the desktop sidebar collapse. */
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
};

function userInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase() || "?";
}

function TenantSwitcher({
  currentCode,
  tenants,
}: {
  currentCode: string;
  tenants: readonly AppShellTenantOption[];
}) {
  const current = tenants.find((t) => t.code === currentCode);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5">
          <span className="max-w-[10rem] truncate font-medium">
            {current?.shortName ?? current?.name ?? currentCode}
          </span>
          <ChevronDown className="size-4 opacity-60" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Chuyển trường</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {tenants.map((t) => (
          <DropdownMenuItem
            key={t.code}
            onSelect={() => {
              // Pha 1 mock: hop to the path-based tenant URL. Pha 2 will
              // hit a /switch-tenant endpoint that re-issues the JWT.
              window.location.assign(`/t/${t.code}`);
            }}
            className="flex items-center gap-2"
          >
            <span className="flex-1 truncate">{t.name}</span>
            {t.code === currentCode && (
              <Check className="size-4 text-primary" aria-hidden />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function LocaleSwitcher() {
  // Placeholder UI — task 14 wires next-intl + the routing layer. Selecting
  // a locale here is a no-op for now.
  const [locale, setLocale] = useState<"vi" | "en">("vi");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Chọn ngôn ngữ"
          className="relative"
        >
          <Globe className="size-4" />
          <span className="absolute -bottom-0.5 -right-0.5 rounded bg-muted px-1 text-[9px] font-semibold uppercase">
            {locale}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => setLocale("vi")}>
          Tiếng Việt {locale === "vi" && <Check className="ml-auto size-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setLocale("en")}>
          English {locale === "en" && <Check className="ml-auto size-4" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserMenu({ user }: { user: AppShellUser }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Mở menu người dùng"
          className="rounded-full"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {userInitials(user.name)}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate text-sm font-medium">{user.name}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <UserRound className="mr-2 size-4" /> Hồ sơ của tôi
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="mr-2 size-4" /> Cài đặt
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 size-4" /> Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function TopBar({
  brandLabel,
  brandShortLabel,
  currentTenantCode,
  tenants,
  user,
  onOpenDrawer,
  onToggleSidebar,
  sidebarCollapsed,
}: TopBarProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-14 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/80",
      )}
    >
      {/* Mobile: open full nav drawer */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onOpenDrawer}
        aria-label="Mở menu"
      >
        <Menu className="size-5" />
      </Button>

      {/* Desktop: toggle sidebar collapse */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="hidden md:inline-flex"
        onClick={onToggleSidebar}
        aria-label={sidebarCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
      >
        {sidebarCollapsed ? (
          <PanelLeftOpen className="size-5" />
        ) : (
          <PanelLeftClose className="size-5" />
        )}
      </Button>

      <div className="flex min-w-0 items-center gap-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
          {brandShortLabel.slice(0, 3).toUpperCase()}
        </span>
        <span className="hidden truncate text-sm font-semibold sm:inline">
          {brandLabel}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-1">
        {tenants && tenants.length > 1 && (
          <TenantSwitcher currentCode={currentTenantCode} tenants={tenants} />
        )}
        <LocaleSwitcher />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
