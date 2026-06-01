-- 0022 — seed Trường THCS Nguyễn Văn Huyên (NVH).
-- Idempotent (ON CONFLICT DO NOTHING) so re-runs are safe and so envs that
-- already inserted NVH by hand are not disturbed.
--
-- What goes in:
--   • tenant row (code `nguyen-van-huyen`, jade brand theme — mirrors the FE
--     fixture in apps/web/lib/tenants/fixtures.ts)
--   • empty tenant_configs row (landing is FE-side in pha 1; editor lands pha 2)
--   • form_template `lop6-2026` v1 — placeholder JSON (BE does not validate
--     submit bodies against it yet, P2.4 defer). FE renders the form from
--     apps/web/lib/api/form-schemas/nguyen-van-huyen.ts.
--   • admission_campaign `intake-2026` — open window matching the other lớp-6
--     intakes seeded in 0013 (Vietnam time).

INSERT INTO tenants (code, name, short_name, theme, modules)
VALUES (
  'nguyen-van-huyen',
  'Trường THCS Nguyễn Văn Huyên, Sơn Đồng, Hà Nội',
  'NVH',
  '{"light":{"primary":"oklch(0.52 0.13 172)","ring":"oklch(0.52 0.13 172)"},
    "dark": {"primary":"oklch(0.74 0.13 174)","ring":"oklch(0.74 0.13 174)"}}'::jsonb,
  ARRAY['admission','platform']::TEXT[]
)
ON CONFLICT (code) DO NOTHING;

INSERT INTO tenant_configs (tenant_id, landing)
SELECT id, '{"sections":[]}'::jsonb FROM tenants WHERE code = 'nguyen-van-huyen'
ON CONFLICT (tenant_id) DO NOTHING;

INSERT INTO form_templates (tenant_id, code, version, status, schema, published_at)
SELECT
  t.id, 'lop6-2026', 1, 'published',
  '{"sections":[]}'::jsonb,
  now()
FROM tenants t
WHERE t.code = 'nguyen-van-huyen'
ON CONFLICT DO NOTHING;

INSERT INTO admission_campaigns
  (tenant_id, code, name, opens_at, closes_at, form_template_id, status)
SELECT
  t.id, 'intake-2026', 'Tuyển sinh lớp 6 năm học 2026 - 2027',
  '2026-06-05 00:00:00+07', '2026-06-08 23:59:59+07',
  ft.id, 'open'
FROM tenants t
JOIN form_templates ft
  ON ft.tenant_id = t.id AND ft.code = 'lop6-2026' AND ft.version = 1
WHERE t.code = 'nguyen-van-huyen'
ON CONFLICT (tenant_id, code) DO NOTHING;
