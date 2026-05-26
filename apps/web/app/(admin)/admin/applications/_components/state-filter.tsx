"use client";

import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  APPLICATION_STATES,
  APPLICATION_STATE_CODES,
  type ApplicationState,
} from "@shared/admission";
import { Button } from "@ui/components/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";

export function StateFilter({
  selected,
  onChange,
}: {
  selected: readonly ApplicationState[];
  onChange: (next: ApplicationState[]) => void;
}) {
  const t = useTranslations("admin.applications.filters");

  function toggle(state: ApplicationState, checked: boolean) {
    if (checked) onChange([...selected, state]);
    else onChange(selected.filter((s) => s !== state));
  }

  const label =
    selected.length === 0
      ? t("stateAll")
      : t("stateCount", { count: selected.length });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between sm:w-52">
          <span className="truncate">{label}</span>
          <ChevronDown className="size-4 opacity-60" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>{t("state")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {APPLICATION_STATE_CODES.map((code) => {
          const meta = APPLICATION_STATES[code]!;
          return (
            <DropdownMenuCheckboxItem
              key={code}
              checked={selected.includes(code)}
              onCheckedChange={(checked) => toggle(code, checked === true)}
              onSelect={(e) => e.preventDefault()}
            >
              {meta.label}
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
