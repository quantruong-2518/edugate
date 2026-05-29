import type { LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  Icon: LucideIcon;
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
