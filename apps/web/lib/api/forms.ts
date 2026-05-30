import type { FormSchema } from "@shared/form";

/**
 * Per-campaign admission form schema. Pha 1 returns a static demo per tenant;
 * task 15 swaps the body for a real fetch keeping this signature. Form config
 * is plain data (not i18n), so it is safe to read from RSC or client.
 */

type FormField = FormSchema["sections"][number]["fields"][number];

/**
 * Shared priority-category checkbox. The option *values* are read back by the
 * admin detail view and seeded by the mock generator, so keep them stable when
 * editing labels. Priority applies at every level (THCS and THPT alike).
 */
const PRIORITY_CATEGORY_FIELD: FormField = {
  type: "checkbox",
  name: "priorityCategory",
  label: "Đối tượng ưu tiên",
  description:
    "Chọn tất cả diện phù hợp. Bỏ trống nếu không thuộc diện ưu tiên.",
  options: [
    { value: "remote_area", label: "Con em vùng sâu vùng xa, biên giới, hải đảo" },
    {
      value: "policy_family",
      label: "Con em gia đình thương binh, liệt sỹ, người có công",
    },
    { value: "ethnic_minority", label: "Học sinh người dân tộc thiểu số" },
    {
      value: "single_parent",
      label: "Con gia đình đơn thân/có hoàn cảnh đặc biệt",
    },
  ],
};

/** Compact constructor for a 0–10 average/exam score field. */
const scoring = (name: string, label: string): FormField => ({
  type: "scoring",
  name,
  label,
  colSpan: 1,
  min: 0,
  max: 10,
  step: 0.1,
});

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
          description: "Nhập mã định danh học sinh.",
        },
        PRIORITY_CATEGORY_FIELD,
      ],
    },
    {
      title: "Thành tích học tập",
      fields: [
        {
          type: "scoring",
          name: "grade1",
          label: "Lớp 1 – Điểm TB",
          colSpan: 1,
          min: 0,
          max: 10,
          step: 0.1,
        },
        {
          type: "scoring",
          name: "grade2",
          label: "Lớp 2 – Điểm TB",
          colSpan: 1,
          min: 0,
          max: 10,
          step: 0.1,
        },
        {
          type: "scoring",
          name: "grade3",
          label: "Lớp 3 – Điểm TB",
          colSpan: 1,
          min: 0,
          max: 10,
          step: 0.1,
        },
        {
          type: "scoring",
          name: "grade4",
          label: "Lớp 4 – Điểm TB",
          colSpan: 1,
          min: 0,
          max: 10,
          step: 0.1,
        },
        {
          type: "scoring",
          name: "grade5",
          label: "Lớp 5 – Điểm TB",
          colSpan: 1,
          min: 0,
          max: 10,
          step: 0.1,
        },
        {
          type: "text",
          name: "specialAchievements",
          label: "Thành tích đặc biệt",
          description:
            "Giải thưởng, danh hiệu học sinh giỏi, v.v. Để trống nếu không có.",
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
      ],
    },
    {
      title: "Nguyện vọng phụ huynh",
      fields: [
        {
          type: "text",
          name: "parentWishes",
          label: "Nguyện vọng và tâm tư",
          multiline: true,
          maxLength: 500,
          description: "Không bắt buộc.",
        },
      ],
    },
  ],
};

const STUDENT_PHOTO_FIELD: FormField = {
  type: "file",
  name: "studentPhoto",
  label: "Ảnh thẻ thí sinh",
  required: true,
  accept: ".jpg,.jpeg,.png",
  description: "Ảnh chân dung rõ nét, nền đơn sắc (định dạng JPG/PNG).",
};

/**
 * Lớp 10 admission (THPT) — a different intake from the lớp 6 base form: it
 * collects lower-secondary (THCS) grades, the entrance-exam subject scores, a
 * school-choice preference, and the THCS graduation certificate.
 */
const THPT_FORM_SCHEMA: FormSchema = {
  sections: [
    {
      title: "Thông tin học sinh",
      fields: [
        {
          type: "studentLookup",
          name: "student",
          label: "Mã định danh học sinh",
          required: true,
          placeholder: "VD: 01012345678",
          description: "Nhập mã định danh học sinh do Bộ GD&ĐT cấp.",
        },
        PRIORITY_CATEGORY_FIELD,
      ],
    },
    {
      title: "Kết quả học tập THCS",
      fields: [
        scoring("grade6", "Điểm TB lớp 6"),
        scoring("grade7", "Điểm TB lớp 7"),
        scoring("grade8", "Điểm TB lớp 8"),
        scoring("grade9", "Điểm TB lớp 9"),
        {
          type: "text",
          name: "specialAchievements",
          label: "Thành tích, giải thưởng",
          description:
            "Học sinh giỏi, giải thi cấp quận/thành phố, v.v. Để trống nếu không có.",
        },
      ],
    },
    {
      title: "Điểm thi tuyển sinh vào 10",
      fields: [
        scoring("examMath", "Toán"),
        scoring("examLiterature", "Ngữ văn"),
        scoring("examEnglish", "Ngoại ngữ"),
      ],
    },
    {
      title: "Nguyện vọng",
      fields: [
        {
          type: "select",
          name: "admissionPriority",
          label: "Nguyện vọng vào trường",
          required: true,
          placeholder: "Chọn nguyện vọng",
          options: [
            { value: "nv1", label: "Nguyện vọng 1" },
            { value: "nv2", label: "Nguyện vọng 2" },
            { value: "nv3", label: "Nguyện vọng 3" },
          ],
        },
        {
          type: "text",
          name: "parentWishes",
          label: "Nguyện vọng và tâm tư",
          multiline: true,
          maxLength: 500,
          description: "Không bắt buộc.",
        },
      ],
    },
    {
      title: "Hồ sơ tuyển sinh",
      fields: [
        {
          type: "file",
          name: "transcript",
          label: "Học bạ THCS (PDF/ảnh)",
          required: true,
          accept: ".pdf,.jpg,.jpeg,.png",
        },
        {
          type: "file",
          name: "graduationCert",
          label: "Giấy chứng nhận tốt nghiệp THCS",
          required: true,
          accept: ".pdf,.jpg,.jpeg,.png",
        },
      ],
    },
  ],
};

export async function getApplicationFormSchema(
  tenantCode: string,
): Promise<FormSchema> {
  // Trần Đại Nghĩa is a THPT — lớp 10 intake, a distinct form (THCS grades +
  // entrance-exam scores) rather than the lớp 6 base.
  if (tenantCode === "tran-dai-nghia") {
    return THPT_FORM_SCHEMA;
  }
  // nguyen-gia-thieu (THCS, lớp 6) also collects the student's ID photo.
  if (tenantCode === "nguyen-gia-thieu") {
    return {
      sections: BASE_FORM_SCHEMA.sections.map((section) =>
        section.title === "Thông tin học sinh"
          ? { ...section, fields: [...section.fields, STUDENT_PHOTO_FIELD] }
          : section,
      ),
    };
  }
  return BASE_FORM_SCHEMA;
}
