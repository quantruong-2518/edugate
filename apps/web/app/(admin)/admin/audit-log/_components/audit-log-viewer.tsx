"use client";

import { useEffect, useMemo, useState } from "react";
import { ScrollText } from "lucide-react";
import { useTranslations } from "next-intl";

import { AUDIT_ACTIONS, type AuditAction } from "@shared/audit";
import { Badge } from "@ui/components/badge";
import { EmptyState } from "@ui/components/empty-state";
import { ErrorState } from "@ui/components/error-state";
import { Input } from "@ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/components/select";
import { Skeleton } from "@ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ui/components/table";
import { cn } from "@ui/lib/utils";

import { useAuditLog } from "@/lib/api/queries";

// Hardcoded palette per action — audit actions are cross-tenant semantics, so
// they don't flow through tenant tokens (same reasoning as the state-tone map).
const ACTION_BADGE: Record<AuditAction, string> = {
  create:
    "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-950 dark:text-blue-300",
  update:
    "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950 dark:text-amber-300",
  settings_update:
    "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950 dark:text-amber-300",
  delete:
    "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-950 dark:text-red-300",
  approve:
    "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-950 dark:text-green-300",
  reject:
    "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-950 dark:text-red-300",
  login:
    "bg-slate-100 text-slate-700 ring-slate-600/20 dark:bg-slate-800 dark:text-slate-300",
  export:
    "bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-950 dark:text-violet-300",
  state_change:
    "bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-950 dark:text-orange-300",
};

const DATE_FORMATTER = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function AuditLogViewer({ tenantCode }: { tenantCode: string }) {
  const t = useTranslations("admin.audit");
  const tErrors = useTranslations("errors");

  const [action, setAction] = useState<AuditAction | "all">("all");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(id);
  }, [q]);

  const filters = useMemo(
    () => ({
      action: action === "all" ? undefined : action,
      q: debouncedQ.trim() || undefined,
    }),
    [action, debouncedQ],
  );

  const { data, isPending, isError, refetch } = useAuditLog(tenantCode, filters);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("search")}
          className="sm:max-w-xs"
          aria-label={t("search")}
        />
        <Select
          value={action}
          onValueChange={(v) => setAction(v as AuditAction | "all")}
        >
          <SelectTrigger
            className="w-full sm:w-56"
            aria-label={t("filterAction")}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allActions")}</SelectItem>
            {AUDIT_ACTIONS.map((a) => (
              <SelectItem key={a} value={a}>
                {t(`actions.${a}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">
                {t("columns.time")}
              </TableHead>
              <TableHead>{t("columns.actor")}</TableHead>
              <TableHead>{t("columns.action")}</TableHead>
              <TableHead>{t("columns.target")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {Array.from({ length: 4 }).map((__, j) => (
                    <TableCell key={`skeleton-${i}-${j}`}>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {!isPending &&
              !isError &&
              data?.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {DATE_FORMATTER.format(new Date(entry.at))}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{entry.actor.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {t(`roles.${entry.actor.role}`)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn("ring-1 ring-inset", ACTION_BADGE[entry.action])}
                    >
                      {t(`actions.${entry.action}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {entry.targetLabel ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>

        {isError && (
          <ErrorState
            title={tErrors("generic.title")}
            description={tErrors("generic.description")}
            retryLabel={tErrors("retry")}
            onRetry={() => void refetch()}
            className="py-10"
          />
        )}
        {!isPending && !isError && data && data.length === 0 && (
          <EmptyState
            icon={ScrollText}
            title={t("empty.title")}
            description={t("empty.description")}
            className="py-10"
          />
        )}
      </div>

      <p className="text-xs text-muted-foreground">{t("note")}</p>
    </div>
  );
}
