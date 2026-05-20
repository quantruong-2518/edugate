"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
  APPLICATION_STATE_CODES,
  type ApplicationRole,
  type ApplicationState,
  type Transition,
} from "@shared/admission";

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
import {
  StateActions,
  StateBadge,
  StateTimeline,
  type TimelineEntry,
} from "@ui/components/admission";

const ROLES: readonly ApplicationRole[] = [
  "APPLICANT",
  "REVIEWER",
  "ADMISSION_ADMIN",
];

const INITIAL_HISTORY: readonly TimelineEntry[] = [
  {
    state: "DRAFT",
    at: "2026-05-12T09:15:00+07:00",
    by: { name: "Trần Phụ Huynh", role: "APPLICANT" },
  },
  {
    state: "SUBMITTED",
    at: "2026-05-14T16:42:00+07:00",
    by: { name: "Trần Phụ Huynh", role: "APPLICANT" },
  },
  {
    state: "UNDER_REVIEW",
    at: "2026-05-15T08:05:00+07:00",
    by: { name: "Nguyễn Cán Bộ", role: "REVIEWER" },
  },
];

export function StateMachineDemo() {
  const [state, setState] = useState<ApplicationState>("UNDER_REVIEW");
  const [role, setRole] = useState<ApplicationRole>("REVIEWER");
  const [history, setHistory] = useState<TimelineEntry[]>([...INITIAL_HISTORY]);

  function handleTransition(t: Transition, reason: string | null) {
    setState(t.to);
    setHistory((prev) => [
      ...prev,
      {
        state: t.to,
        at: new Date().toISOString(),
        by: { name: "Demo User", role },
        reason,
      },
    ]);
    toast.success(`Đã chuyển sang ${t.to}`, {
      description: reason ?? undefined,
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>State badges — tất cả trạng thái</CardTitle>
          <CardDescription>
            Smoke test màu + icon. Mỗi tone hardcoded palette Tailwind (status,
            không qua tenant token).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {APPLICATION_STATE_CODES.map((s) => (
            <StateBadge key={s} state={s} />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>StateActions — đổi state + role để xem nút hợp lệ</CardTitle>
          <CardDescription>
            Reviewer ở UNDER_REVIEW thấy 3 nút (Duyệt / Từ chối / Yêu cầu bổ
            sung). Từ chối + Bổ sung mở dialog nhập lý do. Applicant ở DRAFT
            chỉ thấy Nộp + Hủy.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm">Trạng thái:</span>
            <Select
              value={state}
              onValueChange={(v) => setState(v as ApplicationState)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {APPLICATION_STATE_CODES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <span className="text-sm">Vai trò:</span>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as ApplicationRole)}
            >
              <SelectTrigger className="w-[200px]">
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
          <div className="flex items-center gap-3">
            <StateBadge state={state} />
            <span className="text-sm text-muted-foreground">— hành động:</span>
          </div>
          <StateActions
            state={state}
            role={role}
            onTransition={handleTransition}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>StateTimeline — lịch sử (oldest first)</CardTitle>
          <CardDescription>
            Mỗi action thành công đẩy thêm entry. Reason hiển thị dưới badge.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StateTimeline history={history} />
        </CardContent>
      </Card>
    </div>
  );
}
