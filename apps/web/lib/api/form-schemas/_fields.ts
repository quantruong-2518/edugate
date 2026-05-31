import type { FormSchema, GradeTableRow, SelectOption } from "@shared/form";

/**
 * Shared building blocks for the per-tenant form configs in this folder.
 * Keeping field constructors here lets each tenant file stay a thin, declarative
 * `satisfies FormSchema` object that composes reusable pieces instead of copy-
 * pasting field literals (the drift that previously left NGT's form incomplete).
 */

export type FormField = FormSchema["sections"][number]["fields"][number];

/** Compact constructor for a 0–10 average/exam score field (THPT form). */
export const scoring = (name: string, label: string): FormField => ({
  type: "scoring",
  name,
  label,
  colSpan: 1,
  min: 0,
  max: 10,
  step: 0.1,
});

/** Portrait ID-photo upload slot, shared by the lớp-6 forms. */
export const STUDENT_PHOTO_FIELD: FormField = {
  type: "file",
  name: "studentPhoto",
  label: "Ảnh thẻ thí sinh",
  required: true,
  accept: ".jpg,.jpeg,.png",
  photoPreview: true,
  description: "Ảnh chân dung rõ nét, nền đơn sắc.",
};

/** Single-option checkbox: con em gia đình thương binh, liệt sỹ. */
export const PRIORITY_CATEGORY_FIELD: FormField = {
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

/** Lớp 1–5, one gradeTable row per primary-school year. */
export const PRIMARY_GRADE_ROWS: GradeTableRow[] = [
  { name: "grade1", label: "Lớp 1" },
  { name: "grade2", label: "Lớp 2" },
  { name: "grade3", label: "Lớp 3" },
  { name: "grade4", label: "Lớp 4" },
  { name: "grade5", label: "Lớp 5" },
];

/** Generic academic ratings (older học lực rubric). */
export const ACADEMIC_RATING_OPTIONS: SelectOption[] = [
  { value: "excellent", label: "Xuất sắc" },
  { value: "good", label: "Giỏi" },
  { value: "average", label: "Khá" },
  { value: "below_average", label: "Trung bình" },
];

/**
 * Thông tư 27 primary-school evaluation levels — the official way lớp 1–5
 * results are reported (no numeric average), used by THCS lớp-6 intake forms.
 */
export const TT27_RATING_OPTIONS: SelectOption[] = [
  { value: "excellent", label: "Hoàn thành xuất sắc" },
  { value: "good", label: "Hoàn thành tốt" },
  { value: "completed", label: "Hoàn thành" },
  { value: "not_completed", label: "Chưa hoàn thành" },
];

/** Per-year academic-results table (radio per row). */
export const academicResultsField = (
  label: string,
  options: SelectOption[],
): FormField => ({
  type: "gradeTable",
  name: "academicResults",
  label,
  required: false,
  rows: PRIMARY_GRADE_ROWS,
  options,
});

/** Optional "special achievement" checkbox + conditional description pair. */
export const SPECIAL_ACHIEVEMENTS_FIELDS: FormField[] = [
  {
    type: "checkbox",
    name: "hasSpecialAchievements",
    label: "Thành tích đặc biệt",
    options: [
      { value: "yes", label: "Học sinh có giải thưởng hoặc danh hiệu đặc biệt" },
    ],
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
];

/** Free-text aspirations field (optional, all forms). */
export const PARENT_WISHES_FIELD: FormField = {
  type: "text",
  name: "parentWishes",
  label: "Nguyện vọng và tâm tư",
  multiline: true,
  maxLength: 500,
  description: "Không bắt buộc.",
};
