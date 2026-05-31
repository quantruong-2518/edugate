import type { FormSchema } from "@shared/form";

import {
  ACADEMIC_RATING_OPTIONS,
  PARENT_WISHES_FIELD,
  PRIORITY_CATEGORY_FIELD,
  SPECIAL_ACHIEVEMENTS_FIELDS,
  STUDENT_PHOTO_FIELD,
  academicResultsField,
} from "./_fields";

/**
 * Fallback lớp-6 admission form, served to any tenant without a dedicated
 * config. Kept as the baseline shape new schools start from.
 */
export const DEFAULT_FORM_SCHEMA = {
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
        academicResultsField("Thành tích học tập", ACADEMIC_RATING_OPTIONS),
        ...SPECIAL_ACHIEVEMENTS_FIELDS,
      ],
    },
    {
      fields: [PARENT_WISHES_FIELD],
    },
  ],
} satisfies FormSchema;
