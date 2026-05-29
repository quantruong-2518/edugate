-- 0018 — add the required `dob` (Ngày sinh) field to NGT's lop6-2026 form.
-- Needed by the new dedup key formula (studentFullName + DOB). Same shape as
-- NGT_FORM_SCHEMA in apps/web/lib/api/forms.ts — keep them in lockstep.

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
             "description": "Nhập mã định danh học sinh.",
             "colSpan": 1
           },
           {
             "name": "dob",
             "label": "Ngày sinh",
             "type": "date",
             "required": true,
             "colSpan": 1
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
