-- 0019 — add the required `residence` (address) field to NGT's lop6-2026
-- form so the dedup key can include address → cuts the false-positive rate
-- of name+DOB collisions to ~zero. Keep this JSON in lockstep with
-- NGT_FORM_SCHEMA in apps/web/lib/api/forms.ts.

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
             "name": "residence",
             "label": "Địa chỉ thường trú",
             "type": "address",
             "required": true,
             "description": "Chọn Tỉnh/Thành → Quận/Huyện → Phường/Xã."
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
