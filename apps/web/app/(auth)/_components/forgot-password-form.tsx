"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { MailCheck } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@ui/components/button";
import { EmptyState } from "@ui/components/empty-state";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@ui/components/form";
import { Input } from "@ui/components/input";

import { requestPasswordReset } from "@/lib/api/auth";
import { forgotSchema, type ForgotValues } from "@/lib/auth/schemas";

import { AuthCard } from "./auth-card";

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const [sent, setSent] = useState(false);
  const schema = useMemo(() => forgotSchema(t), [t]);
  const form = useForm<ForgotValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
    mode: "onTouched",
  });
  const mutation = useMutation({ mutationFn: requestPasswordReset });

  const onSubmit = form.handleSubmit(async (values) => {
    await mutation.mutateAsync(values);
    setSent(true);
  });

  if (sent) {
    return (
      <AuthCard title={t("forgot.title")}>
        <EmptyState
          icon={MailCheck}
          iconClassName="text-primary"
          title={t("forgot.sentTitle")}
          description={t("forgot.sentDescription")}
          action={
            <Button asChild variant="outline" size="sm">
              <Link href={"/login" as Route}>{t("forgot.backToLogin")}</Link>
            </Button>
          }
        />
      </AuthCard>
    );
  }

  return (
    <AuthCard title={t("forgot.title")} description={t("forgot.description")}>
      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("forgot.email")}</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {t("forgot.submit")}
          </Button>
          <div className="text-center">
            <Link
              href={"/login" as Route}
              className="text-sm text-muted-foreground underline underline-offset-4"
            >
              {t("forgot.backToLogin")}
            </Link>
          </div>
        </form>
      </Form>
    </AuthCard>
  );
}
