-- 0016 — switch NGT's `student` field from studentLookup (MOET registry
-- resolver) to a plain `text` named `studentCode`. School confirmed they
-- verify codes manually during admission review, not at submit time.
--
-- Rewrites the published `lop6-2026` v1 schema in place so existing drafts
-- stay attached to the same template id/version. Keep this JSON in lockstep
-- with NGT_FORM_SCHEMA in apps/web/lib/api/forms.ts.

UPDATE form_templates
   SET schema = '{
     "sections": [
       {
         "title": "Thông tin học sinh",
         "fields": [
           {
             "name": "studentCode",
             "label": "Mã học sinh (do Bộ GD&ĐT cấp)",
             "type": "text",
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
       updated_at = now()
 WHERE code = 'lop6-2026'
   AND version = 1
   AND tenant_id = (SELECT id FROM tenants WHERE code = 'nguyen-gia-thieu');
