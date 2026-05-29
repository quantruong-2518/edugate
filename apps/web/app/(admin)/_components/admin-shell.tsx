"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { signOutAdmin } from "../_actions/admin-access";
import { AdminHeader } from "./admin-header";

/** Tenant the admin demo defaults to when no tenant resolves from the URL. */
const DEFAULT_ADMIN_TENANT = "nguyen-huy-tuong";

export function AdminShell({
  branding,
  children,
}: {
  branding: { code: string; name: string; shortName: string };
  children: ReactNode;
}) {
  const router = useRouter();
  const brandShort =
    branding.shortName ||
    (branding.code && branding.code !== "default"
      ? branding.code
      : DEFAULT_ADMIN_TENANT);

  async function handleSignOut() {
    await signOutAdmin();
    router.refresh();
  }

  return (
    <div className="min-h-dvh bg-background">
      <AdminHeader brandShort={brandShort} onSignOut={handleSignOut} />
      <main className="min-w-0 pt-14">{children}</main>
    </div>
  );
}
