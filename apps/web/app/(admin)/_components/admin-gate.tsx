"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { GraduationCap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

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

import { signInAdmin } from "../_actions/admin-access";

/**
 * Admin sign-in gate (desktop, see [[feedback-admin-desktop-only]]). Two
 * credentials: the tenant slug (pre-filled from the resolved host when
 * available) and the access code issued to the school. Verifies via the
 * `signInAdmin` server action, then refreshes so the layout swaps the gate
 * for the shell.
 */
export function AdminGate({ defaultSlug }: { defaultSlug: string }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  const schema = z.object({
    slug: z.string().trim().min(1, t("validation.slugRequired")),
    code: z.string().trim().min(1, t("validation.codeRequired")),
  });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { slug: defaultSlug, code: "" },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    setFailed(false);
    const result = await signInAdmin(values.slug, values.code);
    if (result.ok) {
      router.refresh();
      return;
    }
    setFailed(true);
    form.resetField("code");
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="size-6" aria-hidden />
          </span>
          <div className="space-y-1.5">
            <h1 className="text-lg font-semibold tracking-tight">
              {t("gate.title")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("gate.description")}
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("gate.slug")}</FormLabel>
                  <FormControl>
                    <Input
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      placeholder={t("gate.slugPlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("gate.code")}</FormLabel>
                  <FormControl>
                    <Input
                      autoCapitalize="characters"
                      autoComplete="off"
                      spellCheck={false}
                      placeholder={t("gate.codePlaceholder")}
                      className="font-mono uppercase tracking-[0.25em]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {failed && (
              <p className="text-sm text-destructive" role="alert">
                {t("gate.error")}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {t("gate.submit")}
            </Button>
          </form>
        </Form>

        <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
          {t("gate.hint")}
        </p>
      </div>
    </div>
  );
}
