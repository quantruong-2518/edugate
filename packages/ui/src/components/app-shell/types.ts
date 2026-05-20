import type { LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  Icon: LucideIcon;
  /**
   * Pinned items appear in the mobile bottom nav. Keep pinned items <= 4
   * for mobile readability — everything else stays in the sidebar / drawer.
   */
  pinned?: boolean;
};

export type AppShellUser = {
  name: string;
  email: string;
  avatarUrl?: string | null;
};

export type AppShellTenantOption = {
  code: string;
  name: string;
  shortName: string;
};
