import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@ui/components/card";

import { getTenantBranding, getTenantCode } from "@/lib/tenants/branding";

export default async function LandingPage() {
  const code = await getTenantCode();
  const branding = await getTenantBranding(code);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="space-y-3">
        <Badge variant="secondary">Pha 1 · Frontend</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">{branding.name}</h1>
        <p className="text-sm text-muted-foreground">
          Tenant code: <code>{code ?? "(không tenant — root site)"}</code>. Trang
          chủ đầy đủ ở task 11.
        </p>
      </div>

      <Card className="mt-10">
        <CardHeader>
          <CardTitle>Smoke test theme tenant</CardTitle>
          <CardDescription>
            Nút <code>Default</code> dùng token <code>--primary</code> — đổi
            tenant phải đổi màu nút.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">
            Radius hiện tại: <code>{branding.theme.radius}</code>. Token màu
            inject qua <code>&lt;style id=&quot;tenant-theme&quot;&gt;</code> từ
            RSC root layout.
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
