import type { FormSchema } from "@shared/form";

import { PARENT_WISHES_FIELD, PRIORITY_CATEGORY_FIELD, scoring } from "./_fields";

/**
 * Trần Đại Nghĩa is a THPT — lớp 10 intake, a distinct form from the lớp-6
 * base: lower-secondary (THCS) grades, the entrance-exam subject scores, a
 * school-choice preference, and the THCS graduation certificate.
 */
export const THPT_FORM_SCHEMA = {
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
        PARENT_WISHES_FIELD,
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
} satisfies FormSchema;
