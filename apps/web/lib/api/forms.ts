import type { FormSchema } from "@shared/form";

/**
 * Per-campaign admission form schema. Pha 1 returns a static demo per tenant;
 * task 15 swaps the body for a real fetch keeping this signature. Form config
 * is plain data (not i18n), so it is safe to read from RSC or client.
 */

type FormField = FormSchema["sections"][number]["fields"][number];

/** Compact constructor for a 0–10 average/exam score field (THPT form). */
const scoring = (name: string, label: string): FormField => ({
  type: "scoring",
  name,
  label,
  colSpan: 1,
  min: 0,
  max: 10,
  step: 0.1,
});

/** Single-option checkbox: con em gia đình thương binh, liệt sỹ. */
const PRIORITY_CATEGORY_FIELD: FormField = {
  type: "checkbox",
  name: "priorityCategory",
  label: "Đối tượng ưu tiên",
  description: "Để trống nếu không thuộc diện ưu tiên.",
  options: [
    {
      value: "policy_family",
      label: "Con em gia đình thương binh, liệt sỹ, người có công",
    },
  ],
};

/** Academic results per grade year (radio: Xuất sắc / Giỏi / Khá / Trung bình). */
const ACADEMIC_RESULTS_FIELD: FormField = {
  type: "gradeTable",
  name: "academicResults",
  label: "Thành tích học tập",
  required: false,
  rows: [
    { name: "grade1", label: "Lớp 1" },
    { name: "grade2", label: "Lớp 2" },
    { name: "grade3", label: "Lớp 3" },
    { name: "grade4", label: "Lớp 4" },
    { name: "grade5", label: "Lớp 5" },
  ],
  options: [
    { value: "excellent", label: "Xuất sắc" },
    { value: "good", label: "Giỏi" },
    { value: "average", label: "Khá" },
    { value: "below_average", label: "Trung bình" },
  ],
};

const BASE_FORM_SCHEMA: FormSchema = {
  sections: [
    {
      layout: "photo-profile",
      fields: [
        {
          type: "file",
          name: "studentPhoto",
          label: "Ảnh thẻ thí sinh",
          required: true,
          accept: ".jpg,.jpeg,.png",
          photoPreview: true,
          description: "Ảnh chân dung rõ nét, nền đơn sắc.",
        },
        {
          type: "text",
          name: "studentName",
          label: "Họ và tên học sinh",
          required: true,
          placeholder: "VD: Nguyễn Văn An",
        },
        {
          type: "text",
          name: "studentCode",
          label: "Mã học sinh",
          required: true,
          placeholder: "VD: 79012345678",
          description: "Mã định danh do Bộ GD&ĐT cấp.",
        },
        {
          type: "date",
          name: "dateOfBirth",
          label: "Ngày sinh",
          required: true,
        },
        {
          type: "select",
          name: "gender",
          label: "Giới tính",
          required: true,
          placeholder: "Chọn giới tính",
          options: [
            { value: "male", label: "Nam" },
            { value: "female", label: "Nữ" },
          ],
        },
        PRIORITY_CATEGORY_FIELD,
      ],
    },
    {
      fields: [
        ACADEMIC_RESULTS_FIELD,
        {
          type: "checkbox",
          name: "hasSpecialAchievements",
          label: "Thành tích đặc biệt",
          options: [{ value: "yes", label: "Học sinh có giải thưởng hoặc danh hiệu đặc biệt" }],
        },
        {
          type: "text",
          name: "specialAchievements",
          label: "Mô tả thành tích",
          multiline: true,
          maxLength: 500,
          placeholder: "VD: Giải Nhì môn Toán cấp quận năm học 2024-2025",
          visibleWhen: { field: "hasSpecialAchievements", op: "nonEmpty" },
        },
      ],
    },
    {
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
  photoPreview: true,
  description: "Ảnh chân dung rõ nét, nền đơn sắc.",
};

/**
 * Nguyễn Gia Thiều: free-text student code (no MOET lookup), student ID
 * photo, optional note. Per the school: validation against the MOET
 * registry happens offline during admission review, not at submit time.
 *
 * Field key `dateOfBirth` aligns with the admin view's dedicated display
 * column and mock data generator; `gender` is required by the school.
 */
const NGT_FORM_SCHEMA: FormSchema = {
  notice:
    "Nhà trường **chỉ nhận đăng ký từ học sinh đang cư trú tại Thành phố Hà Nội**. " +
    "Nếu đến ngày nộp hồ sơ chính thức phát hiện thông tin cư trú không đúng quy định, " +
    "gia đình **tự chịu hoàn toàn trách nhiệm** về mọi hậu quả phát sinh. " +
    "Xin trân trọng cảm ơn.",
  sections: [
    {
      layout: "photo-profile",
      fields: [
        STUDENT_PHOTO_FIELD,
        {
          type: "text",
          name: "studentName",
          label: "Họ và tên học sinh",
          required: true,
          placeholder: "VD: Nguyễn Văn An",
        },
        {
          type: "text",
          name: "studentCode",
          label: "Mã học sinh",
          required: true,
          placeholder: "VD: 79012345678",
          description: "Mã định danh do Bộ GD&ĐT cấp.",
        },
        {
          type: "date",
          name: "dateOfBirth",
          label: "Ngày tháng năm sinh",
          required: true,
        },
        {
          type: "select",
          name: "gender",
          label: "Giới tính",
          required: true,
          placeholder: "Chọn giới tính",
          options: [
            { value: "male", label: "Nam" },
            { value: "female", label: "Nữ" },
          ],
        },
      ],
    },
  ],
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
    return NGT_FORM_SCHEMA;
  }
  return BASE_FORM_SCHEMA;
}
