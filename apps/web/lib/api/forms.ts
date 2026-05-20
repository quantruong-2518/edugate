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
          type: "text",
          name: "studentName",
          label: "Họ và tên học sinh",
          required: true,
          placeholder: "Nguyễn Văn A",
        },
        {
          type: "date",
          name: "dateOfBirth",
          label: "Ngày sinh",
          required: true,
          colSpan: 1,
        },
        {
          type: "select",
          name: "gender",
          label: "Giới tính",
          required: true,
          colSpan: 1,
          placeholder: "Chọn giới tính",
          options: [
            { value: "male", label: "Nam" },
            { value: "female", label: "Nữ" },
            { value: "other", label: "Khác" },
          ],
        },
        {
          type: "select",
          name: "hasSibling",
          label: "Có anh/chị đang học tại trường?",
          required: true,
          placeholder: "Chọn",
          options: [
            { value: "yes", label: "Có" },
            { value: "no", label: "Không" },
          ],
        },
        {
          type: "text",
          name: "siblingName",
          label: "Họ tên anh/chị đang học",
          required: true,
          visibleWhen: { field: "hasSibling", op: "eq", value: "yes" },
        },
      ],
    },
    {
      title: "Học lực & hồ sơ",
      fields: [
        {
          type: "scoring",
          name: "gpa",
          label: "Điểm trung bình (thang 10)",
          required: true,
          colSpan: 1,
          min: 0,
          max: 10,
          step: 0.1,
        },
        {
          type: "file",
          name: "transcript",
          label: "Học bạ (PDF/ảnh)",
          required: true,
          colSpan: 1,
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

export async function getApplicationFormSchema(
  tenantCode: string,
): Promise<FormSchema> {
  // tran-dai-nghia is a specialized school — it collects an extra English score.
  if (tenantCode === "tran-dai-nghia") {
    return {
      sections: BASE_FORM_SCHEMA.sections.map((section) =>
        section.title === "Học lực & hồ sơ"
          ? { ...section, fields: [...section.fields, ENGLISH_SCORE_FIELD] }
          : section,
      ),
    };
  }
  return BASE_FORM_SCHEMA;
}
