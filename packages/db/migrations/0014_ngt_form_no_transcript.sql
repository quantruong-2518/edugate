-- 0014 — drop the transcript (học bạ) field from NGT's form_template.
-- The school confirmed they only collect the student's ID photo, not the
-- transcript. Rewrites the published `lop6-2026` v1 schema in place so all
-- in-flight drafts stay tied to the same template id/version.
--
-- Same shape as apps/web/lib/api/forms.ts NGT_FORM_SCHEMA — keep them in
-- sync if either changes.

UPDATE form_templates
   SET schema = '{
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
