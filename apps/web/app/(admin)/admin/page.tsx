import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ui/components/card";

import { AbilityDemo } from "@/app/(admin)/_components/ability-demo";
import { StateMachineDemo } from "@/app/(admin)/_components/state-machine-demo";
import { getTenantBranding, getTenantCode } from "@/lib/tenants/branding";

export default async function AdminHomePage() {
  const code = await getTenantCode();
  const branding = await getTenantBranding(code);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-10">
      <div className="space-y-2">
        <Badge variant="secondary">Bảng điều khiển</Badge>
        <h1 className="text-2xl font-semibold tracking-tight">
          {branding.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          Tenant code: <code>{code ?? "(default)"}</code>
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: "Hồ sơ đang xử lý", value: "128" },
          { label: "Hồ sơ hoàn tất", value: "542" },
          { label: "Đợt tuyển sinh", value: "3" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-3xl">{stat.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Smoke test AppShell</CardTitle>
          <CardDescription>
            ≥ 768px: sidebar trái + top bar. &lt; 768px: bottom nav + hamburger
            mở drawer. Nút <code>Default</code> dưới đây ăn theo theme tenant.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
        </CardContent>
      </Card>

      <div className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">
          Smoke test state machine (task 8)
        </h2>
        <StateMachineDemo />
      </div>

      <div className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">
          Smoke test ability layer (task 9)
        </h2>
        <AbilityDemo />
      </div>
    </div>
  );
}
