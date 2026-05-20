"use client";

import {
  FileText,
  LayoutDashboard,
  Megaphone,
  Settings,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";

import {
  AppShell,
  type AppShellTenantOption,
  type AppShellUser,
  type NavItem,
} from "@ui/components/app-shell";

import { LocaleSwitcher } from "@/components/i18n/locale-switcher";

// `"use client"` at the top of this module turns the lucide icon imports
// into client references — that's how we can ship the NavItem array
// (containing component refs) across the RSC→client boundary from the
// (admin)/layout RSC.

const ADMIN_NAV: readonly NavItem[] = [
  {
    href: "/admin",
    label: "Bảng điều khiển",
    Icon: LayoutDashboard,
    pinned: true,
  },
  {
    href: "/admin/applications",
    label: "Hồ sơ",
    Icon: FileText,
    pinned: true,
  },
  { href: "/admin/users", label: "Người dùng", Icon: Users, pinned: true },
  {
    href: "/admin/campaigns",
    label: "Đợt tuyển sinh",
    Icon: Megaphone,
  },
  { href: "/admin/settings", label: "Cài đặt", Icon: Settings },
];

// Pha 1 mock — pha 2 will derive from the authenticated session.
const MOCK_USER: AppShellUser = {
  name: "Nguyễn Quản Trị",
  email: "admin@cva-edu.local",
};

const MOCK_TENANTS: readonly AppShellTenantOption[] = [
  {
    code: "cva-edu",
    name: "Trường Tiểu học & THCS Cầu Vàng",
    shortName: "CVA",
  },
  {
    code: "tran-dai-nghia",
    name: "Trường THPT Trần Đại Nghĩa",
    shortName: "TĐN",
  },
  {
    code: "nguyen-huy-tuong",
    name: "Trường THCS Nguyễn Huy Tưởng — Đông Anh",
    shortName: "NHT",
  },
];

export function AdminShell({
  branding,
  children,
}: {
  branding: { code: string; name: string; shortName: string };
  children: ReactNode;
}) {
  return (
    <AppShell
      branding={branding}
      user={MOCK_USER}
      navItems={ADMIN_NAV}
      tenants={MOCK_TENANTS}
      localeSwitcher={<LocaleSwitcher />}
    >
      {children}
    </AppShell>
  );
}
