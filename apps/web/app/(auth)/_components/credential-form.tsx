"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, LinkIcon } from "lucide-react";
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

import {
  activateAccount,
  resetPassword,
  setPassword,
  type CredentialInput,
  type CredentialResult,
} from "@/lib/api/auth";
import { credentialSchema, type CredentialValues } from "@/lib/auth/schemas";

import { AuthCard } from "./auth-card";

export type CredentialVariant = "reset" | "set" | "activate";

// Reset / set-password / activate share the same UI (token + new password +
// confirm). Only the copy and the endpoint differ, so they collapse into one
// component keyed by `variant`.
const ENDPOINTS: Record<
  CredentialVariant,
  (input: CredentialInput) => Promise<CredentialResult>
> = {
  reset: resetPassword,
  set: setPassword,
  activate: activateAccount,
};

export function CredentialForm({
  variant,
  token,
}: {
  variant: CredentialVariant;
  /** Read server-side from `?token=` and passed down — avoids a useSearchParams
   * SSR flash where the invalid-link branch renders before hydration. */
  token: string;
}) {
  const t = useTranslations("auth");
  const [done, setDone] = useState(false);

  const schema = useMemo(() => credentialSchema(t), [t]);
  const form = useForm<CredentialValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onTouched",
  });
  const mutation = useMutation({ mutationFn: ENDPOINTS[variant] });

  const onSubmit = form.handleSubmit(async (values) => {
    const res = await mutation.mutateAsync({ token, password: values.password });
    if (res.ok) setDone(true);
  });

  const toLogin = (
    <Button asChild variant="outline" size="sm">
      <Link href={"/login" as Route}>{t("credential.toLogin")}</Link>
    </Button>
  );

  // Missing token → dead link.
  if (!token) {
    return (
      <AuthCard title={t(`credential.${variant}.title`)}>
        <EmptyState
          icon={LinkIcon}
          iconClassName="text-destructive"
          title={t("credential.invalidToken.title")}
          description={t("credential.invalidToken.description")}
          action={toLogin}
        />
      </AuthCard>
    );
  }

  if (done) {
    return (
      <AuthCard title={t(`credential.${variant}.title`)}>
        <EmptyState
          icon={CheckCircle2}
          iconClassName="text-primary"
          title={t(`credential.${variant}.successTitle`)}
          description={t(`credential.${variant}.successDescription`)}
          action={toLogin}
        />
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={t(`credential.${variant}.title`)}
      description={t(`credential.${variant}.description`)}
    >
      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("credential.password")}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("credential.confirmPassword")}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {t(`credential.${variant}.submit`)}
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
}
