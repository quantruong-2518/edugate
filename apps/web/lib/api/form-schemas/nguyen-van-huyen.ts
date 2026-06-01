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
 * Nguyễn Văn Huyên (THCS, lớp 6 intake — Sơn Đồng, Hà Nội). Same applicant
 * profile as the other lớp-6 forms; the school admits per Hanoi's catchment
 * map so the student code is free-text and reconciled against the MOET
 * registry offline during review.
 */
export const NVH_FORM_SCHEMA = {
  notice:
    "Nhà trường tuyển sinh theo **phân tuyến của thành phố Hà Nội**. " +
    "Phụ huynh vui lòng kê khai trung thực; nếu thông tin cư trú không đúng quy định, " +
    "gia đình **tự chịu trách nhiệm** về mọi hậu quả phát sinh. Xin trân trọng cảm ơn.",
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
