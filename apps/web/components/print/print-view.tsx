"use client";

import { useEffect } from "react";
import type { Route } from "next";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { useTranslations } from "next-intl";

import type { TenantBranding } from "@shared/branding";
import type { FormSchema } from "@shared/form";
import { Button } from "@ui/components/button";
import { EmptyState } from "@ui/components/empty-state";
import { Skeleton } from "@ui/components/skeleton";

import { useApplication } from "@/lib/api/queries";

import { ApplicationDocument } from "./application-document";
import { ReceiptDocument } from "./receipt-document";

export type PrintDoc = "profile" | "receipt";

/**
 * Client wrapper for the printable document. Reads the application from the
 * mock store (localStorage, client-only — see task 12), then opens the browser
 * print dialog automatically once data is ready. The toolbar is `print:hidden`
 * so it never lands in the output.
 */
export function PrintView({
  code,
  doc,
  branding,
  formSchema,
}: {
  code: string;
  doc: PrintDoc;
  branding: TenantBranding;
  formSchema: FormSchema;
}) {
  const t = useTranslations("print");
  const { data: application, isPending } = useApplication(code);

  useEffect(() => {
    if (isPending || !application) return;
    // Small delay lets fonts/logo settle before the print snapshot.
    const id = setTimeout(() => window.print(), 500);
    return () => clearTimeout(id);
  }, [isPending, application]);

  return (
    <div className="min-h-screen bg-neutral-100 print:bg-white">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-background/90 px-4 py-3 backdrop-blur print:hidden">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/track/${code}` as Route}>
            <ArrowLeft className="size-4" aria-hidden />
            {t("actions.back")}
          </Link>
        </Button>
        {application && (
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="size-4" aria-hidden />
            {t("actions.print")}
          </Button>
        )}
      </div>

      {isPending && (
        <div className="mx-auto my-8 w-full max-w-[210mm] space-y-4 bg-white p-10 shadow-sm">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {!isPending && !application && (
        <EmptyState
          icon={Printer}
          title={t("notFound", { code })}
          className="py-20"
        />
      )}

      {application &&
        (doc === "receipt" ? (
          <ReceiptDocument application={application} branding={branding} />
        ) : (
          <ApplicationDocument
            application={application}
            branding={branding}
            formSchema={formSchema}
          />
        ))}
    </div>
  );
}
