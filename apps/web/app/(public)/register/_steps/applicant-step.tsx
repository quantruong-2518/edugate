"use client";

import { useTranslations } from "next-intl";
import type { Control, FieldValues } from "react-hook-form";

import type { ApplicantRelationship } from "@shared/admission";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@ui/components/form";
import { Input } from "@ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/components/select";

export function ApplicantStep({
  control,
  relationships,
  showStudentName,
}: {
  control: Control<FieldValues>;
  relationships: ReadonlyArray<ApplicantRelationship>;
  showStudentName: boolean;
}) {
  const t = useTranslations("apply.applicant");

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {showStudentName && (
          <FormField
            control={control}
            name="studentFullName"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>
                  {t("studentFullName")}
                  <span className="text-destructive"> *</span>
                </FormLabel>
                <FormControl>
                  <Input
                    autoComplete="off"
                    placeholder={t("studentFullNamePlaceholder")}
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          control={control}
          name="fullName"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>{t("fullName")}<span className="text-destructive"> *</span></FormLabel>
              <FormControl>
                <Input autoComplete="name" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("email")}<span className="text-destructive"> *</span></FormLabel>
              <FormControl>
                <Input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder={t("emailPlaceholder")}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground">{t("emailHint")}</p>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("phone")}<span className="text-destructive"> *</span></FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder={t("phonePlaceholder")}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground">{t("phoneHint")}</p>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="relationship"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>{t("relationship")}<span className="text-destructive"> *</span></FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value ? String(field.value) : ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("relationshipPlaceholder")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {relationships.map((r) => (
                    <SelectItem key={r} value={r}>
                      {t(`relationships.${r}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
