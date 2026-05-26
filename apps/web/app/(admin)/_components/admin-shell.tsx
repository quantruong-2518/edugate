"use client";

import {
  FileText,
  LayoutDashboard,
  Megaphone,
  ScrollText,
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

import { NotificationsBell } from "@/components/admin/notifications-bell";
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
  {
    href: "/admin/audit-log",
    label: "Nhật ký hoạt động",
    Icon: ScrollText,
  },
  { href: "/admin/settings", label: "Cài đặt", Icon: Settings },
];

// Pha 1 mock — pha 2 will derive from the authenticated session. Email mirrors
// the demo login (tuyensinh.nht@edu.vn) loosely so the shell feels like the
// logged-in identity; it stays a mock.
const MOCK_USER: AppShellUser = {
  name: "Cán bộ Tuyển sinh",
  email: "tuyensinh.nht@edu.vn",
};

/** Tenant the admin demo defaults to when no tenant resolves from the URL. */
const DEFAULT_ADMIN_TENANT = "nguyen-huy-tuong";

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
  const tenantCode =
    branding.code && branding.code !== "default"
      ? branding.code
      : DEFAULT_ADMIN_TENANT;
  return (
    <AppShell
      branding={branding}
      user={MOCK_USER}
      navItems={ADMIN_NAV}
      tenants={MOCK_TENANTS}
      localeSwitcher={<LocaleSwitcher />}
      notifications={<NotificationsBell tenantCode={tenantCode} />}
    >
      {children}
    </AppShell>
  );
}
