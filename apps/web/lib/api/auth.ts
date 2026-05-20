/**
 * Auth API seam. Pha 1 = mocks (no real backend); pha 2 swaps these bodies for
 * Better-Auth calls while keeping the signatures. Like the admission seam, this
 * is the single swap point — forms depend only on the exported functions.
 *
 * Pha 1 behaviour is cosmetic: `login` accepts any well-formed credentials and
 * the token flows treat any non-empty token as valid. No session is persisted
 * (Better-Auth owns that in pha 2); the login form simply redirects to /admin.
 */

const MOCK_LATENCY_MS = 250;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) =>
    setTimeout(() => resolve(value), MOCK_LATENCY_MS),
  );
}

export type LoginInput = { email: string; password: string };
export type LoginResult = { ok: boolean };

export type RequestPasswordResetInput = { email: string };
export type RequestPasswordResetResult = { sent: true };

export type CredentialInput = { token: string; password: string };
export type CredentialResult = { ok: boolean };

export async function login(_input: LoginInput): Promise<LoginResult> {
  // Mock: any schema-valid credentials succeed. Pha 2 validates against the
  // tenant's user store and returns the session/JWT.
  return delay({ ok: true });
}

export async function requestPasswordReset(
  _input: RequestPasswordResetInput,
): Promise<RequestPasswordResetResult> {
  // Mock: always "sent" — never reveal whether an email exists (anti-enum).
  return delay({ sent: true });
}

export async function resetPassword(
  input: CredentialInput,
): Promise<CredentialResult> {
  return delay({ ok: input.token.trim().length > 0 });
}

export async function setPassword(
  input: CredentialInput,
): Promise<CredentialResult> {
  return delay({ ok: input.token.trim().length > 0 });
}

export async function activateAccount(
  input: CredentialInput,
): Promise<CredentialResult> {
  return delay({ ok: input.token.trim().length > 0 });
}
