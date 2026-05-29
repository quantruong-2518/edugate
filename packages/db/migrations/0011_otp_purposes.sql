-- 0011 — expand otp_codes.purpose CHECK constraint.
--
-- We reuse the otp_codes table for two related artifacts:
--   • purpose='application'         — the 6-digit code emailed to a parent
--   • purpose='application_submit'  — the opaque 32-byte token minted on
--                                      successful verify, redeemed by
--                                      POST /v1/applications (single-use,
--                                      30-min TTL, tied to email + ip).
--
-- Separate columns (token_hash + verified_at) would be cleaner but the row
-- shape is identical and storing two purposes in one table keeps the OTP
-- retention worker (Day 6+) a single sweeper.

ALTER TABLE otp_codes DROP CONSTRAINT IF EXISTS otp_codes_purpose_check;
ALTER TABLE otp_codes
  ADD CONSTRAINT otp_codes_purpose_check
  CHECK (purpose IN ('application', 'application_submit'));
