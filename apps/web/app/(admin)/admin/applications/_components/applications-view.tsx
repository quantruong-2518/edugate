"use client";

import { useEffect, useMemo, useState } from "react";
import { FileX2, Search, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";

import {
  type Application,
  type ApplicationState,
  type Transition,
} from "@shared/admission";
import type { FormSchema } from "@shared/form";
import { StateBadge } from "@ui/components/admission";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { EmptyState } from "@ui/components/empty-state";
import { ErrorState } from "@ui/components/error-state";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ui/components/table";
import { Skeleton } from "@ui/components/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/components/select";

import { studentNameOf } from "@/lib/api";
import { admissionKeys, useApplications } from "@/lib/api/queries";

import { ApplicationDetailSheet } from "./application-detail-sheet";
import { StateFilter } from "./state-filter";

const DATE_FORMATTER = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const PAGE_SIZES = [10, 20, 50] as const;

function studentDobOf(app: Application): string {
  const dob = app.formData["dateOfBirth"];
  if (typeof dob !== "string" || !dob) return "-";
  const d = new Date(dob);
  if (isNaN(d.getTime())) return dob;
  return DATE_FORMATTER.format(d);
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-muted/50 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export function ApplicationsView({
  tenantCode,
  formSchema,
}: {
  tenantCode: string;
  formSchema: FormSchema | null;
}) {
  const t = useTranslations("admin.applications");
  const tFilters = useTranslations("admin.applications.filters");

  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";

  const [searchInput, setSearchInput] = useState(urlQuery);
  const [search, setSearch] = useState(urlQuery);
  const [states, setStates] = useState<ApplicationState[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const [selected, setSelected] = useState<Application | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    setSearchInput(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [states, dateFrom, dateTo, pageSize]);

  const input = useMemo(
    () => ({
      tenantCode,
      search: search.trim() || undefined,
      states: states.length > 0 ? states : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      sort: "name:asc" as const,
      page,
      pageSize,
    }),
    [tenantCode, search, states, dateFrom, dateTo, page, pageSize],
  );

  const { data, isPending, isError, refetch, isPlaceholderData } =
    useApplications(input);

  const baseline = useApplications({ tenantCode, page: 1, pageSize: 9999 });
  const baselineCounts = useMemo(() => {
    const items = baseline.data?.items ?? [];
    return {
      total: baseline.data?.total ?? 0,
      submitted: items.filter((a) => a.state === "SUBMITTED").length,
      underReview: items.filter((a) => a.state === "UNDER_REVIEW").length,
      needsInfo: items.filter((a) => a.state === "NEEDS_INFO").length,
      approved: items.filter((a) => a.state === "APPROVED").length,
    };
  }, [baseline.data]);

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const rangeFrom = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeTo = Math.min(page * pageSize, total);

  const hasActiveFilters =
    search.trim() !== "" ||
    states.length > 0 ||
    dateFrom !== "" ||
    dateTo !== "";

  function clearAll() {
    setSearchInput("");
    setSearch("");
    setStates([]);
    setDateFrom("");
    setDateTo("");
  }

  function openDetail(app: Application) {
    setSelected(app);
    setSheetOpen(true);
  }

  function handleTransition(
    app: Application,
    transition: Transition,
    reason: string | null,
  ) {
    const now = new Date().toISOString();
    const updated: Application = {
      ...app,
      state: transition.to,
      updatedAt: now,
      history: [
        ...app.history,
        { state: transition.to, at: now, ...(reason ? { note: reason } : {}) },
      ],
    };
    setSelected(updated);
    queryClient.setQueriesData<{ items: Application[] }>(
      { queryKey: admissionKeys.all },
      (prev) => {
        if (!prev || !Array.isArray(prev.items)) return prev;
        if (!prev.items.some((a) => a.code === app.code)) return prev;
        return {
          ...prev,
          items: prev.items.map((a) => (a.code === app.code ? updated : a)),
        };
      },
    );
  }

  return (
    <div className="space-y-5">
      {/* Quick stats */}
      <div className="grid grid-cols-5 gap-2">
        <StatPill label={t("stats.total")} value={baselineCounts.total} />
        <StatPill label={t("stats.submitted")} value={baselineCounts.submitted} />
        <StatPill label={t("stats.underReview")} value={baselineCounts.underReview} />
        <StatPill label={t("stats.needsInfo")} value={baselineCounts.needsInfo} />
        <StatPill label={t("stats.approved")} value={baselineCounts.approved} />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t("searchPlaceholder")}
              aria-label={t("search")}
              className="pl-9"
            />
          </div>
          <StateFilter selected={states} onChange={setStates} />
          <div className="flex items-center gap-1.5">
            <Label htmlFor="date-from" className="shrink-0 text-xs text-muted-foreground">
              {tFilters("dateFrom")}
            </Label>
            <Input
              id="date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-36"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Label htmlFor="date-to" className="shrink-0 text-xs text-muted-foreground">
              {tFilters("dateTo")}
            </Label>
            <Input
              id="date-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-36"
            />
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground">
              {tFilters("active")}:
            </span>
            {states.map((s) => (
              <FilterChip
                key={s}
                label={<StateBadge state={s} className="ring-0" />}
                onClear={() => setStates(states.filter((x) => x !== s))}
              />
            ))}
            {dateFrom && (
              <FilterChip
                label={`${tFilters("dateFrom")}: ${dateFrom}`}
                onClear={() => setDateFrom("")}
              />
            )}
            {dateTo && (
              <FilterChip
                label={`${tFilters("dateTo")}: ${dateTo}`}
                onClear={() => setDateTo("")}
              />
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={clearAll}
            >
              {tFilters("clearAll")}
            </Button>
          </div>
        )}
      </div>

      {/* Results */}
      {isError ? (
        <ErrorState
          title={t("error.title")}
          description={t("error.description")}
          onRetry={() => void refetch()}
          className="py-12"
        />
      ) : !isPending && total === 0 ? (
        <EmptyState
          icon={FileX2}
          title={t("empty.title")}
          description={t("empty.description")}
          className="py-12"
          action={
            hasActiveFilters ? (
              <Button variant="outline" size="sm" onClick={clearAll}>
                {tFilters("clearAll")}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div
            className={`overflow-x-auto rounded-lg border ${isPlaceholderData ? "opacity-60" : ""}`}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">{t("columns.code")}</TableHead>
                  <TableHead>{t("columns.student")}</TableHead>
                  <TableHead className="w-28">{t("columns.dob")}</TableHead>
                  <TableHead className="w-36">{t("columns.state")}</TableHead>
                  <TableHead>{t("columns.applicant")}</TableHead>
                  <TableHead className="w-28 whitespace-nowrap">
                    {t("columns.submittedAt")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPending &&
                  Array.from({ length: pageSize > 10 ? 10 : pageSize }).map(
                    (_, i) => (
                      <TableRow key={`skeleton-${i}`}>
                        {Array.from({ length: 6 }).map((__, j) => (
                          <TableCell key={`skeleton-${i}-${j}`}>
                            <Skeleton className="h-4 w-20" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ),
                  )}
                {!isPending &&
                  data?.items.map((app) => (
                    <TableRow
                      key={app.code}
                      className="cursor-pointer"
                      onClick={() => openDetail(app)}
                    >
                      <TableCell className="text-xs font-medium tabular-nums tracking-tight">
                        {app.code}
                      </TableCell>
                      <TableCell className="font-medium">
                        {studentNameOf(app)}
                      </TableCell>
                      <TableCell className="tabular-nums text-muted-foreground">
                        {studentDobOf(app)}
                      </TableCell>
                      <TableCell>
                        <StateBadge state={app.state} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {app.applicant.fullName}
                      </TableCell>
                      <TableCell className="tabular-nums text-muted-foreground">
                        {DATE_FORMATTER.format(new Date(app.createdAt))}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">
                {t("pagination.pageSize")}
              </span>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => setPageSize(Number(v))}
              >
                <SelectTrigger className="h-8 w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZES.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">
                {t("pagination.range", { from: rangeFrom, to: rangeTo, total })}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || isPending}
                >
                  {t("pagination.prev")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || isPending}
                >
                  {t("pagination.next")}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      <ApplicationDetailSheet
        application={selected}
        formSchema={formSchema}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onTransition={handleTransition}
      />
    </div>
  );
}

function FilterChip({
  label,
  onClear,
}: {
  label: React.ReactNode;
  onClear: () => void;
}) {
  return (
    <Badge variant="secondary" className="gap-1 py-1 pr-1 font-normal">
      <span className="flex items-center">{label}</span>
      <button
        type="button"
        onClick={onClear}
        className="rounded-full p-0.5 hover:bg-foreground/10"
        aria-label="Clear filter"
      >
        <X className="size-3" />
      </button>
    </Badge>
  );
}
