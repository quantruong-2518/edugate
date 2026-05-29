import type { FormSchema } from "@shared/form";

/**
 * Per-campaign admission form schema. Pha 1 returns a static demo per tenant;
 * task 15 swaps the body for a real fetch keeping this signature. Form config
 * is plain data (not i18n), so it is safe to read from RSC or client.
 */

const BASE_FORM_SCHEMA: FormSchema = {
  sections: [
    {
      title: "Thông tin học sinh",
      fields: [
        {
          type: "studentLookup",
          name: "student",
          label: "Mã học sinh (do Bộ GD&ĐT cấp)",
          required: true,
          placeholder: "VD: 79012345678",
          description:
            "Nhập mã định danh học sinh.",
        },
      ],
    },
    {
      title: "Hồ sơ tuyển sinh",
      fields: [
        {
          type: "file",
          name: "transcript",
          label: "Hồ sơ học bạ (PDF/ảnh)",
          required: true,
          accept: ".pdf,.jpg,.jpeg,.png",
        },
        {
          type: "text",
          name: "note",
          label: "Ghi chú thêm",
          multiline: true,
          maxLength: 500,
          description: "Không bắt buộc.",
        },
      ],
    },
  ],
};

const ENGLISH_SCORE_FIELD: FormSchema["sections"][number]["fields"][number] = {
  type: "scoring",
  name: "englishScore",
  label: "Điểm tiếng Anh (thang 10)",
  colSpan: 1,
  min: 0,
  max: 10,
  step: 0.1,
};

const STUDENT_PHOTO_FIELD: FormSchema["sections"][number]["fields"][number] = {
  type: "file",
  name: "studentPhoto",
  label: "Ảnh thẻ thí sinh",
  required: true,
  accept: ".jpg,.jpeg,.png",
  description: "Ảnh chân dung rõ nét, nền đơn sắc (định dạng JPG/PNG).",
};

/**
 * Nguyễn Gia Thiều: free-text student code (no MOET lookup), student ID
 * photo, optional note. Per the school: validation against the MOET
 * registry happens offline during admission review, not at submit time.
 */
const NGT_FORM_SCHEMA: FormSchema = {
  sections: [
    {
      title: "Thông tin học sinh",
      fields: [
        {
          type: "text",
          name: "studentCode",
          label: "Mã học sinh (do Bộ GD&ĐT cấp)",
          required: true,
          placeholder: "VD: 79012345678",
          description: "Nhập mã định danh học sinh.",
          colSpan: 1,
        },
        {
          type: "date",
          name: "dob",
          label: "Ngày sinh",
          required: true,
          colSpan: 1,
        },
        {
          type: "text",
          name: "residence",
          label: "Địa chỉ thường trú",
          required: true,
          multiline: true,
          maxLength: 300,
          placeholder: "Số nhà, tổ/thôn, phường/xã, quận/huyện, tỉnh/thành",
        },
        STUDENT_PHOTO_FIELD,
        {
          type: "text",
          name: "note",
          label: "Ghi chú thêm",
          multiline: true,
          maxLength: 500,
          description: "Không bắt buộc.",
        },
      ],
    },
  ],
};

export async function getApplicationFormSchema(
  tenantCode: string,
): Promise<FormSchema> {
  // tran-dai-nghia is a specialized school — it collects an extra English score.
  if (tenantCode === "tran-dai-nghia") {
    return {
      sections: BASE_FORM_SCHEMA.sections.map((section) =>
        section.title === "Hồ sơ tuyển sinh"
          ? { ...section, fields: [...section.fields, ENGLISH_SCORE_FIELD] }
          : section,
      ),
    };
  }
  if (tenantCode === "nguyen-gia-thieu") {
    return NGT_FORM_SCHEMA;
  }
  return BASE_FORM_SCHEMA;
}
