/**
 * Name of the admin session cookie. Plain module (not a server action file) so
 * both the sign-in/out actions and the layout's cookie read can share it.
 *
 * Pha 1: value = the verified tenant slug (mock). Pha 2: value = an opaque
 * session token returned by the verify endpoint.
 */
export const ADMIN_COOKIE = "edugate_admin";
