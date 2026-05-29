/**
 * Custom domains a school owns (CNAME/A → platform), mapped to tenant code.
 *
 * Kept separate from `fixtures.ts` so the edge middleware imports only this
 * small map, not the full branding/theme payload. Map keys are exact,
 * lowercase hostnames — add the `www.` variant explicitly if the school
 * serves it.
 *
 * Pha 1: static mock. Pha 2: replace with a cached `tenant_domains` lookup
 * (domain, tenant_id, verified) — only `verified=true` rows resolve, the
 * lookup is cached (KV/edge), never a per-request DB query. See ADR-012.
 */
export const CUSTOM_DOMAIN_TENANTS: Readonly<Record<string, string>> = {
  // Demo: cva-edu reachable on its own purchased domain in addition to the
  // canonical subdomain cva-edu.<root>.
  "tuyensinh-cva.vn": "cva-edu",
  "www.tuyensinh-cva.vn": "cva-edu",
};
