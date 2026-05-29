-- 0009 — DEV-ONLY seed. Idempotent (ON CONFLICT DO NOTHING). Production
-- bootstrap is a separate one-shot script with env-driven credentials.
--
-- Fixtures:
--   • Tenant cva-edu (Chu Văn An) — admission + platform modules
--   • Tenant tran-dai-nghia (Trần Đại Nghĩa) — for 2-tenant RLS smoke test
--   • 1 SUPER_ADMIN (alice@edugate.vn) — cross-tenant
--   • 1 ADMISSION_ADMIN in cva-edu (huy@cva-edu.vn)
--   • 1 published form_template version 1 per tenant
--   • 1 open admission_campaign per tenant for intake-2026

INSERT INTO tenants (code, name, short_name, theme, modules)
VALUES
  ('cva-edu',         'Trường THCS Chu Văn An',        'CVA',
   '{"light":{"primary":"oklch(0.55 0.20 250)","ring":"oklch(0.55 0.20 250)"},
     "dark": {"primary":"oklch(0.70 0.18 250)","ring":"oklch(0.70 0.18 250)"}}'::jsonb,
   ARRAY['admission','platform']::TEXT[]),
  ('tran-dai-nghia', 'Trường THCS Trần Đại Nghĩa',     'TDN',
   '{"light":{"primary":"oklch(0.50 0.21 25)", "ring":"oklch(0.50 0.21 25)"},
     "dark": {"primary":"oklch(0.70 0.17 25)", "ring":"oklch(0.70 0.17 25)"}}'::jsonb,
   ARRAY['admission','platform']::TEXT[])
ON CONFLICT (code) DO NOTHING;

INSERT INTO tenant_configs (tenant_id, landing)
SELECT id, '{"sections":[]}'::jsonb FROM tenants
ON CONFLICT (tenant_id) DO NOTHING;

INSERT INTO users (email, display_name, status, password_hash)
VALUES
  ('alice@edugate.vn',  'Alice (Super Admin)',  'active', NULL),
  ('huy@cva-edu.vn',    'Huy (Admission CVA)',  'active', NULL),
  ('mai@tdn-edu.vn',    'Mai (Admission TDN)',  'active', NULL)
ON CONFLICT DO NOTHING;

-- Memberships. SUPER_ADMIN is modeled as a tenant_users row in every tenant
-- with role SUPER_ADMIN (cross-tenant access still goes via /v1/platform/*).
INSERT INTO tenant_users (tenant_id, user_id, roles, status, activated_at)
SELECT t.id, u.id, ARRAY['SUPER_ADMIN']::TEXT[], 'active', now()
FROM tenants t, users u
WHERE u.email = 'alice@edugate.vn'
ON CONFLICT DO NOTHING;

INSERT INTO tenant_users (tenant_id, user_id, roles, status, activated_at)
SELECT t.id, u.id, ARRAY['ADMISSION_ADMIN']::TEXT[], 'active', now()
FROM tenants t, users u
WHERE t.code = 'cva-edu' AND u.email = 'huy@cva-edu.vn'
ON CONFLICT DO NOTHING;

INSERT INTO tenant_users (tenant_id, user_id, roles, status, activated_at)
SELECT t.id, u.id, ARRAY['ADMISSION_ADMIN']::TEXT[], 'active', now()
FROM tenants t, users u
WHERE t.code = 'tran-dai-nghia' AND u.email = 'mai@tdn-edu.vn'
ON CONFLICT DO NOTHING;

-- A trivial form template per tenant (production tenants edit via the form
-- editor; seed is just enough for a Day 4 submit to land somewhere).
INSERT INTO form_templates (tenant_id, code, version, status, schema, published_at)
SELECT
  t.id, 'lop6-2026', 1, 'published',
  '{"sections":[{"title":"Thông tin học sinh","fields":[
      {"name":"studentName","label":"Họ và tên học sinh","type":"text","required":true},
      {"name":"dob","label":"Ngày sinh","type":"date","required":true},
      {"name":"gpa","label":"Điểm tổng kết lớp 5","type":"number","min":0,"max":10,"required":true}
   ]}]}'::jsonb,
  now()
FROM tenants t
ON CONFLICT DO NOTHING;

-- An open campaign per tenant for the 2026 intake.
INSERT INTO admission_campaigns
  (tenant_id, code, name, opens_at, closes_at, form_template_id, status)
SELECT
  t.id, 'intake-2026', 'Tuyển sinh lớp 6 năm 2026',
  '2026-04-01 00:00:00+07', '2026-06-30 23:59:59+07',
  ft.id, 'open'
FROM tenants t
JOIN form_templates ft ON ft.tenant_id = t.id AND ft.code = 'lop6-2026' AND ft.version = 1
ON CONFLICT (tenant_id, code) DO NOTHING;
