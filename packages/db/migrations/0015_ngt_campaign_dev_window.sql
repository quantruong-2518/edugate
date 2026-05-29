-- 0015 — open NGT's intake-2026 campaign for dev / staging smoke tests.
-- Migration 0013 seeded `opens_at = 2026-06-05` to match the real school
-- schedule from the docx. That's correct for production but blocks any
-- smoke test that runs before 2026-06-05 with NO_OPEN_CAMPAIGN.
--
-- Idempotent: only widens the window if today is before the original
-- opens_at, so production (running after 2026-06-05) is a no-op. We never
-- *narrow* the window, so re-running after the original opens_at also
-- leaves the row alone.

UPDATE admission_campaigns
   SET opens_at = '2026-05-01 00:00:00+07'
 WHERE code = 'intake-2026'
   AND tenant_id = (SELECT id FROM tenants WHERE code = 'nguyen-gia-thieu')
   AND opens_at > now();
