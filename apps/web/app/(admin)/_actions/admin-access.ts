"use server";

import { cookies } from "next/headers";

import { isValidTenantCode } from "@shared/tenant";

import { ADMIN_ACCESS_CODES } from "@/lib/tenants/admin-access";
import { ADMIN_COOKIE } from "./session-cookie";

export type AdminSignInResult = { ok: true } | { ok: false; error: "invalid" };

/** Admin session lifetime (seconds). */
const MAX_AGE = 60 * 60 * 8; // 8h

/**
 * Verify a tenant slug + access code, then open an admin session.
 *
 * Pha 1: compare against the mock fixture. Pha 2 (P2.6): POST to the verify
 * endpoint, receive an opaque session token, and store that instead of the
 * slug — the cookie handling below stays as-is.
 */
export async function signInAdmin(
  slugRaw: string,
  codeRaw: string,
): Promise<AdminSignInResult> {
  const slug = slugRaw.trim().toLowerCase();
  const code = codeRaw.trim().toUpperCase();

  if (!isValidTenantCode(slug) || ADMIN_ACCESS_CODES[slug] !== code) {
    return { ok: false, error: "invalid" };
  }

  const jar = await cookies();
  jar.set(ADMIN_COOKIE, slug, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });

  return { ok: true };
}

/** Close the admin session. */
export async function signOutAdmin(): Promise<void> {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
}
