"use client";

import {
  type AbilityContext,
  type Action,
  type ResourceSubject,
  type Role,
} from "@shared/auth";
import { useState } from "react";

import { Can } from "@/components/auth/can";
import { RequirePermission } from "@/components/auth/require-permission";
import { AbilityProvider } from "@/lib/auth/ability-provider";

import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ui/components/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/components/select";

const ROLES: readonly Role[] = [
  "APPLICANT",
  "REVIEWER",
  "ADMISSION_ADMIN",
  "TENANT_ADMIN",
  "SUPER_ADMIN",
];

// Coarse resource-level probes (what `<Can a=...>` and menu builders use).
const COARSE: readonly { action: Action; resource: ResourceSubject["resource"] }[] = [
  { action: "read", resource: "application" },
  { action: "approve", resource: "application" },
  { action: "export", resource: "application" },
  { action: "create", resource: "campaign" },
  { action: "update", resource: "tenant_config" },
  { action: "create", resource: "tenant_user" },
  { action: "read", resource: "employee" },
];

export function AbilityDemo() {
  const [role, setRole] = useState<Role>("ADMISSION_ADMIN");

  // SUPER_ADMIN is cross-tenant; everyone else is scoped to cva-edu. HRMS is
  // not in enabledModules → every `*:employee` check resolves false regardless
  // of role (module toggle).
  const context: AbilityContext = {
    userId: "u-1",
    tenantId: "cva-edu",
    roles: [role],
    enabledModules: ["admission", "platform"],
  };

  // An APPLICANT-owned application in DRAFT — exercises `own` scope + the
  // state condition on `update`.
  const ownDraft: ResourceSubject = {
    resource: "application",
    ownerId: "u-1",
    tenantId: "cva-edu",
    state: "DRAFT",
  };
  const ownApproved: ResourceSubject = { ...ownDraft, state: "APPROVED" };
  const othersApp: ResourceSubject = {
    resource: "application",
    ownerId: "u-2",
    tenantId: "cva-edu",
    state: "DRAFT",
  };

  return (
    <AbilityProvider context={context}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Ability — đổi vai trò xem quyền thay đổi</CardTitle>
            <CardDescription>
              Coarse check qua <code>&lt;Can a=&quot;...&quot;&gt;</code>. HRMS
              không bật module nên <code>read:employee</code> luôn ẩn dù vai trò
              nào (module toggle).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm">Vai trò:</span>
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-2">
              {COARSE.map(({ action, resource }) => (
                <Can
                  key={`${action}:${resource}`}
                  I={action}
                  a={resource}
                  fallback={
                    <Badge variant="outline" className="opacity-40 line-through">
                      {action}:{resource}
                    </Badge>
                  }
                >
                  <Badge>
                    {action}:{resource}
                  </Badge>
                </Can>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Instance-level scope + điều kiện state</CardTitle>
            <CardDescription>
              APPLICANT chỉ sửa được hồ sơ của mình ở DRAFT/NEEDS_INFO. Cùng
              hành động trên hồ sơ APPROVED hoặc của người khác sẽ bị chặn.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <Can I="update" this={ownDraft} fallback={<span>✗ sửa hồ sơ của mình (DRAFT)</span>}>
              <span>✓ sửa hồ sơ của mình (DRAFT)</span>
            </Can>
            <Can I="update" this={ownApproved} fallback={<span>✗ sửa hồ sơ của mình (APPROVED)</span>}>
              <span>✓ sửa hồ sơ của mình (APPROVED)</span>
            </Can>
            <Can I="update" this={othersApp} fallback={<span>✗ sửa hồ sơ người khác (DRAFT)</span>}>
              <span>✓ sửa hồ sơ người khác (DRAFT)</span>
            </Can>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>RequirePermission — cổng route</CardTitle>
            <CardDescription>
              Render 403 nếu vai trò hiện tại không có <code>create:tenant_user</code>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RequirePermission action="create" resource="tenant_user">
              <Button>Mời người dùng mới</Button>
            </RequirePermission>
          </CardContent>
        </Card>
      </div>
    </AbilityProvider>
  );
}
