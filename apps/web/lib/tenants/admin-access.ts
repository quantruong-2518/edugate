/**
 * Pha 1 mock admin access codes (tenant slug → 10-char code).
 *
 * Each school is issued a random 10-char code out-of-band; the super-admin
 * can reset it. Pha 2 (P2.6): a `tenant_access_codes` table storing a HASH of
 * the code + a verify endpoint + super-admin reset — this fixture and the
 * comparison in the sign-in action are the only swap points.
 *
 * DEV ONLY — real codes are never shipped in the client bundle. This module is
 * imported solely by the server action, so it stays server-side.
 *
 * Dev codes for testing the gate:
 *   cva-edu → CVA7K2P9QX | tran-dai-nghia → TDN4M8W3RZ
 *   nguyen-huy-tuong → NHT6B1L5VK | nguyen-van-huyen → NVH9C3T7DM
 *   nguyen-gia-thieu → NGT2F8H4QP
 */
export const ADMIN_ACCESS_CODES: Readonly<Record<string, string>> = {
  "cva-edu": "CVA7K2P9QX",
  "tran-dai-nghia": "TDN4M8W3RZ",
  "nguyen-huy-tuong": "NHT6B1L5VK",
  "nguyen-van-huyen": "NVH9C3T7DM",
  "nguyen-gia-thieu": "NGT2F8H4QP",
};
