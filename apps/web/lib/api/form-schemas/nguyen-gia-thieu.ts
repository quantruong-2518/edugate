import type { FormSchema } from "@shared/form";

import {
  PARENT_WISHES_FIELD,
  PRIORITY_CATEGORY_FIELD,
  STUDENT_PHOTO_FIELD,
  TT27_RATING_OPTIONS,
  academicResultsField,
} from "./_fields";

/**
 * NGT-specific special-achievement pair. Mirrors the shared
 * `SPECIAL_ACHIEVEMENTS_FIELDS` but extends the checkbox label to spell out
 * what counts as a "danh hiệu đặc biệt" — only awards from officially
 * sanctioned competitions (Phường / Quận / Sở / Bộ) per NGT's review guide.
 * Kept inline so other tenants keep the shorter shared copy.
 */
const NGT_SPECIAL_ACHIEVEMENTS_FIELDS = [
  {
    type: "checkbox" as const,
    name: "hasSpecialAchievements",
    label: "Thành tích đặc biệt",
    options: [
      {
        value: "yes",
        label:
          "Học sinh có giải thưởng hoặc danh hiệu đặc biệt (cuộc thi chính thống của Phường, Quận, Sở, Bộ)",
      },
    ],
  },
  {
    type: "text" as const,
    name: "specialAchievements",
    label: "Mô tả thành tích",
    multiline: true,
    maxLength: 500,
    placeholder: "VD: Giải Nhì môn Toán cấp quận năm học 2024-2025",
    visibleWhen: { field: "hasSpecialAchievements", op: "nonEmpty" as const },
  },
];

/**
 * Nguyễn Gia Thiều (THCS, lớp 6 intake). Full applicant profile: ID photo +
 * student identity, primary-school results per year (Thông tư 27 levels — no
 * numeric average at tiểu học), special achievements, and aspirations. Student
 * code is free-text: the school validates it against the MOET registry offline
 * during admission review, not at submit time.
 */
export const NGT_FORM_SCHEMA = {
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
        PRIORITY_CATEGORY_FIELD,
      ],
    },
    {
      title: "Kết quả học tập tiểu học",
      description: "Đánh giá học lực từng năm theo Thông tư 27.",
      fields: [
        academicResultsField("Học lực các năm (lớp 1–5)", TT27_RATING_OPTIONS),
        ...NGT_SPECIAL_ACHIEVEMENTS_FIELDS,
      ],
    },
    {
      fields: [PARENT_WISHES_FIELD],
    },
  ],
} satisfies FormSchema;
