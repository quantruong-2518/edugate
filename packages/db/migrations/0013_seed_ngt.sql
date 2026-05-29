-- 0013 — seed Trường THCS Nguyễn Gia Thiều (NGT).
-- Idempotent (ON CONFLICT DO NOTHING) so re-runs are safe and so envs that
-- already inserted NGT by hand are not disturbed.
--
-- What goes in:
--   • tenant row (code `nguyen-gia-thieu`, amber brand theme)
--   • empty tenant_configs row (landing is FE-side in pha 1; editor lands pha 2)
--   • form_template `lop6-2026` v1 — schema mirrors apps/web/lib/api/forms.ts
--     for this tenant (studentLookup + transcript + studentPhoto + note)
--   • admission_campaign `intake-2026` — open window from the school's docx
--     (05/06/2026 → 08/06/2026 Vietnam time)

INSERT INTO tenants (code, name, short_name, theme, modules)
VALUES (
  'nguyen-gia-thieu',
  'Trường THCS Nguyễn Gia Thiều — Long Biên, Hà Nội',
  'NGT',
  '{"light":{"primary":"oklch(0.555 0.163 48.998)","ring":"oklch(0.555 0.163 48.998)"},
    "dark": {"primary":"oklch(0.828 0.189 84.429)","ring":"oklch(0.828 0.189 84.429)"}}'::jsonb,
  ARRAY['admission','platform']::TEXT[]
)
ON CONFLICT (code) DO NOTHING;

INSERT INTO tenant_configs (tenant_id, landing)
SELECT id, '{"sections":[]}'::jsonb FROM tenants WHERE code = 'nguyen-gia-thieu'
ON CONFLICT (tenant_id) DO NOTHING;

INSERT INTO form_templates (tenant_id, code, version, status, schema, published_at)
SELECT
  t.id, 'lop6-2026', 1, 'published',
  '{
    "sections": [
      {
        "title": "Thông tin học sinh",
        "fields": [
          {
            "name": "student",
            "label": "Mã học sinh (do Bộ GD&ĐT cấp)",
            "type": "studentLookup",
            "required": true,
            "placeholder": "VD: 79012345678",
            "description": "Nhập mã định danh học sinh."
          },
          {
            "name": "studentPhoto",
            "label": "Ảnh thẻ thí sinh",
            "type": "file",
            "required": true,
            "accept": ".jpg,.jpeg,.png",
            "description": "Ảnh chân dung rõ nét, nền đơn sắc (định dạng JPG/PNG)."
          }
        ]
      },
      {
        "title": "Hồ sơ tuyển sinh",
        "fields": [
          {
            "name": "transcript",
            "label": "Hồ sơ học bạ (PDF/ảnh)",
            "type": "file",
            "required": true,
            "accept": ".pdf,.jpg,.jpeg,.png"
          },
          {
            "name": "note",
            "label": "Ghi chú thêm",
            "type": "text",
            "multiline": true,
            "maxLength": 500,
            "description": "Không bắt buộc."
          }
        ]
      }
    ]
  }'::jsonb,
  now()
FROM tenants t
WHERE t.code = 'nguyen-gia-thieu'
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
WHERE t.code = 'nguyen-gia-thieu'
ON CONFLICT (tenant_id, code) DO NOTHING;
