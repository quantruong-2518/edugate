import { FileQuestion } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { Button } from "@ui/components/button";
import { EmptyState } from "@ui/components/empty-state";

export default async function NotFound() {
  const t = await getTranslations("errors.notFound");
  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <EmptyState
        icon={FileQuestion}
        title={t("title")}
        description={t("description")}
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/">{t("home")}</Link>
          </Button>
        }
      />
    </main>
  );
}
