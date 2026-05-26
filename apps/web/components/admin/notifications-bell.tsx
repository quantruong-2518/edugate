"use client";

import { useState } from "react";
import {
  Bell,
  CalendarClock,
  CheckCheck,
  FileClock,
  FilePlus2,
  RefreshCcw,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import type { AppNotification, NotificationKind } from "@/lib/api";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/lib/api/queries";
import { Button } from "@ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import { Separator } from "@ui/components/separator";
import { Skeleton } from "@ui/components/skeleton";
import { cn } from "@ui/lib/utils";

const KIND_ICON: Record<NotificationKind, LucideIcon> = {
  new_application: FilePlus2,
  needs_review: FileClock,
  deadline: CalendarClock,
  status_change: RefreshCcw,
};

const RELATIVE = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function NotificationRow({
  item,
  onRead,
}: {
  item: AppNotification;
  onRead: (id: string) => void;
}) {
  // KIND_ICON is exhaustive over NotificationKind; bang is safe.
  const Icon = KIND_ICON[item.kind]!;
  return (
    <button
      type="button"
      onClick={() => onRead(item.id)}
      className={cn(
        "flex w-full items-start gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-accent",
        !item.read && "bg-primary/5",
      )}
    >
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{item.title}</span>
          {!item.read && (
            <span
              className="size-2 shrink-0 rounded-full bg-primary"
              aria-hidden
            />
          )}
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {item.description}
        </span>
        <span className="mt-0.5 block text-[11px] text-muted-foreground/80">
          {RELATIVE.format(new Date(item.at))}
        </span>
      </span>
    </button>
  );
}

export function NotificationsBell({ tenantCode }: { tenantCode: string }) {
  const t = useTranslations("admin.notifications");
  const [open, setOpen] = useState(false);
  const { data, isPending } = useNotifications(tenantCode);
  const markRead = useMarkNotificationRead(tenantCode);
  const markAll = useMarkAllNotificationsRead(tenantCode);

  const unread = data?.filter((n) => !n.read).length ?? 0;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full"
          aria-label={t("open")}
        >
          <Bell className="size-5" />
          {unread > 0 && (
            <span
              className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-4 text-primary-foreground"
              aria-label={t("unread", { count: unread })}
            >
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-sm font-semibold">{t("title")}</span>
          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs"
              onClick={() => markAll.mutate()}
              disabled={markAll.isPending}
            >
              <CheckCheck className="size-3.5" />
              {t("markAllRead")}
            </Button>
          )}
        </div>
        <Separator />
        <div className="max-h-96 overflow-y-auto p-1">
          {isPending &&
            Array.from({ length: 3 }).map((_, i) => (
              <div key={`skeleton-${i}`} className="flex gap-3 px-2 py-2">
                <Skeleton className="size-8 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            ))}
          {!isPending && data && data.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              {t("empty")}
            </p>
          )}
          {!isPending &&
            data?.map((item) => (
              <NotificationRow
                key={item.id}
                item={item}
                onRead={(id) => markRead.mutate(id)}
              />
            ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
