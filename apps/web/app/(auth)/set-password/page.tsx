import { CredentialForm } from "../_components/credential-form";

export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return <CredentialForm variant="set" token={token ?? ""} />;
}
