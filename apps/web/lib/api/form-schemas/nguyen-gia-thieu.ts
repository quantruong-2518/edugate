import type { FormSchema } from "@shared/form";

import {
  PARENT_WISHES_FIELD,
  PRIORITY_CATEGORY_FIELD,
  SPECIAL_ACHIEVEMENTS_FIELDS,
  STUDENT_PHOTO_FIELD,
  TT27_RATING_OPTIONS,
  academicResultsField,
} from "./_fields";

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
        ...SPECIAL_ACHIEVEMENTS_FIELDS,
      ],
    },
    {
      fields: [PARENT_WISHES_FIELD],
    },
  ],
} satisfies FormSchema;
