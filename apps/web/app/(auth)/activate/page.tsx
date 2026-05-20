import { CredentialForm } from "../_components/credential-form";

export default async function ActivatePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return <CredentialForm variant="activate" token={token ?? ""} />;
}
