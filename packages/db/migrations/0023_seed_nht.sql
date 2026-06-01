-- 0023 — seed Trường THCS Nguyễn Huy Tưởng (NHT).
-- Same shape as 0013_seed_ngt + 0022_seed_nvh: idempotent insert of the
-- tenant row, an empty tenant_configs, a placeholder form_template, and an
-- open intake-2026 campaign. FE renders the form from
-- apps/web/lib/api/form-schemas/nguyen-huy-tuong.ts.

INSERT INTO tenants (code, name, short_name, theme, modules)
VALUES (
  'nguyen-huy-tuong',
  'Trường THCS Nguyễn Huy Tưởng, Đông Anh, Hà Nội',
  'NHT',
  '{"light":{"primary":"oklch(0.58 0.118 178)","ring":"oklch(0.58 0.118 178)"},
    "dark": {"primary":"oklch(0.78 0.14 178)","ring":"oklch(0.78 0.14 178)"}}'::jsonb,
  ARRAY['admission','platform']::TEXT[]
)
ON CONFLICT (code) DO NOTHING;

INSERT INTO tenant_configs (tenant_id, landing)
SELECT id, '{"sections":[]}'::jsonb FROM tenants WHERE code = 'nguyen-huy-tuong'
ON CONFLICT (tenant_id) DO NOTHING;

INSERT INTO form_templates (tenant_id, code, version, status, schema, published_at)
SELECT
  t.id, 'lop6-2026', 1, 'published',
  '{"sections":[]}'::jsonb,
  now()
FROM tenants t
WHERE t.code = 'nguyen-huy-tuong'
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
WHERE t.code = 'nguyen-huy-tuong'
ON CONFLICT (tenant_id, code) DO NOTHING;
