"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@ui/components/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@ui/components/form";
import { Input } from "@ui/components/input";

import { login } from "@/lib/api/auth";
import { loginSchema, type LoginValues } from "@/lib/auth/schemas";

import { AuthCard } from "./auth-card";

export function LoginForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const schema = useMemo(() => loginSchema(t), [t]);
  const form = useForm<LoginValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
  });
  const mutation = useMutation({ mutationFn: login });

  const onSubmit = form.handleSubmit(async (values) => {
    const res = await mutation.mutateAsync(values);
    if (res.ok) {
      // Pha 1: no real session — cosmetic redirect. Better-Auth owns the
      // session/JWT in pha 2.
      toast.success(t("login.successToast"));
      router.push("/admin");
    }
  });

  return (
    <AuthCard title={t("login.title")} description={t("login.description")}>
      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("login.email")}</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("login.password")}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="current-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {t("login.submit")}
          </Button>
          <div className="text-center">
            <Link
              href={"/forgot-password" as Route}
              className="text-sm text-muted-foreground underline underline-offset-4"
            >
              {t("login.forgotLink")}
            </Link>
          </div>
        </form>
      </Form>
    </AuthCard>
  );
}
