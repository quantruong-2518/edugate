import { CredentialForm } from "../_components/credential-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return <CredentialForm variant="reset" token={token ?? ""} />;
}
