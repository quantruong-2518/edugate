import type {
  Applicant,
  Application,
  ApplicationHistoryEntry,
} from "@shared/admission";
import { APPLICATION_STATE_CODES, type ApplicationState } from "@shared/admission";

/**
 * Deterministic, seeded generator of realistic admission applications per
 * tenant. Seeded off the tenant code so the dataset is stable across reloads
 * (no localStorage, no random per-render). Pha 2 deletes this — the seam in
 * `admission.ts` swaps to real `GET /applications` and these fixtures vanish.
 *
 * Everything here is pure (no IO, no Date.now in the seed path) so the same
 * tenant always yields the same rows; "today/this-week" analytics anchor off a
 * fixed REFERENCE_DATE so the demo numbers don't drift.
 */

/** Anchor date for the demo so "today" / "this week" stats are stable. */
export const REFERENCE_DATE = new Date("2026-05-26T09:00:00+07:00");

/** Campaign window the submissions are spread across (45 days up to now). */
const CAMPAIGN_DAYS = 45;

// --- Deterministic PRNG (mulberry32) ----------------------------------------

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rng = () => number;

function pick<T>(rng: Rng, items: readonly T[]): T {
  // items is never empty at call sites; bang is safe under noUncheckedIndexedAccess.
  return items[Math.floor(rng() * items.length)]!;
}

function intBetween(rng: Rng, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

// --- Vietnamese name corpus --------------------------------------------------

const FAMILY_NAMES = [
  "Nguyễn",
  "Trần",
  "Lê",
  "Phạm",
  "Hoàng",
  "Huỳnh",
  "Phan",
  "Vũ",
  "Võ",
  "Đặng",
  "Bùi",
  "Đỗ",
  "Hồ",
  "Ngô",
  "Dương",
  "Lý",
] as const;

const MIDDLE_NAMES_MALE = ["Văn", "Hữu", "Đức", "Minh", "Quang", "Bá", "Công", "Xuân"] as const;
const MIDDLE_NAMES_FEMALE = ["Thị", "Ngọc", "Thúy", "Thu", "Kim", "Phương", "Hồng", "Mai"] as const;

const GIVEN_NAMES_MALE = [
  "An",
  "Bình",
  "Cường",
  "Dũng",
  "Đạt",
  "Hải",
  "Hùng",
  "Khoa",
  "Long",
  "Minh",
  "Nam",
  "Phong",
  "Quân",
  "Sơn",
  "Tài",
  "Thành",
  "Tuấn",
  "Việt",
] as const;

const GIVEN_NAMES_FEMALE = [
  "Anh",
  "Châu",
  "Dung",
  "Hà",
  "Hân",
  "Lan",
  "Linh",
  "Mai",
  "My",
  "Ngân",
  "Như",
  "Quỳnh",
  "Thảo",
  "Trang",
  "Trinh",
  "Vy",
  "Yến",
] as const;

type Gender = "male" | "female";

function makeName(rng: Rng, gender: Gender): string {
  const family = pick(rng, FAMILY_NAMES);
  const middle = pick(rng, gender === "male" ? MIDDLE_NAMES_MALE : MIDDLE_NAMES_FEMALE);
  const given = pick(rng, gender === "male" ? GIVEN_NAMES_MALE : GIVEN_NAMES_FEMALE);
  return `${family} ${middle} ${given}`;
}

function makeParentName(rng: Rng): { name: string; relationship: Applicant["relationship"] } {
  const isFather = rng() < 0.5;
  const gender: Gender = isFather ? "male" : "female";
  return {
    name: makeName(rng, gender),
    relationship: isFather ? "father" : "mother",
  };
}

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "");
}

function makePhone(rng: Rng): string {
  const prefixes = ["09", "03", "07", "08", "05"] as const;
  let rest = "";
  for (let i = 0; i < 8; i += 1) rest += String(intBetween(rng, 0, 9));
  return `${pick(rng, prefixes)}${rest}`;
}

// --- State weighting ---------------------------------------------------------

/**
 * Realistic intake distribution: most applications are fresh (SUBMITTED) or in
 * review, fewer have a resolution, very few are terminal/cancelled. Weights are
 * relative; they need not sum to 1.
 */
const STATE_WEIGHTS: Readonly<Record<ApplicationState, number>> = {
  DRAFT: 0,
  SUBMITTED: 32,
  UNDER_REVIEW: 24,
  NEEDS_INFO: 10,
  APPROVED: 14,
  REJECTED: 6,
  CONFIRMED: 7,
  ENROLLED: 4,
  CANCELLED: 2,
  EXPIRED: 1,
};

const WEIGHTED_STATES: readonly ApplicationState[] = APPLICATION_STATE_CODES.flatMap(
  (code) => Array.from({ length: STATE_WEIGHTS[code] }, () => code),
);

function pickState(rng: Rng): ApplicationState {
  return pick(rng, WEIGHTED_STATES);
}

// --- History reconstruction --------------------------------------------------

/**
 * Plausible state path leading up to the current state, so the timeline reads
 * like a real workflow. Each entry gets a timestamp between createdAt and now.
 */
const STATE_PATH: Readonly<Record<ApplicationState, readonly ApplicationState[]>> = {
  DRAFT: ["DRAFT"],
  SUBMITTED: ["SUBMITTED"],
  UNDER_REVIEW: ["SUBMITTED", "UNDER_REVIEW"],
  NEEDS_INFO: ["SUBMITTED", "UNDER_REVIEW", "NEEDS_INFO"],
  APPROVED: ["SUBMITTED", "UNDER_REVIEW", "APPROVED"],
  REJECTED: ["SUBMITTED", "UNDER_REVIEW", "REJECTED"],
  CONFIRMED: ["SUBMITTED", "UNDER_REVIEW", "APPROVED", "CONFIRMED"],
  ENROLLED: ["SUBMITTED", "UNDER_REVIEW", "APPROVED", "CONFIRMED", "ENROLLED"],
  CANCELLED: ["SUBMITTED", "CANCELLED"],
  EXPIRED: ["SUBMITTED", "UNDER_REVIEW", "EXPIRED"],
};

// Only one priority option remains in the form; mock still uses a 25% hit rate.
const PRIORITY_CATEGORIES = ["policy_family"] as const;

const SPECIAL_ACHIEVEMENTS = [
  "Giải Nhì môn Toán cấp quận năm học 2024-2025.",
  "Giải Ba Tiếng Anh cấp thành phố; Học sinh giỏi 4 năm liền.",
  "Học sinh tiêu biểu cấp trường; Giải Nhất Toán cấp trường.",
  "Đạt danh hiệu Cháu ngoan Bác Hồ 3 năm liên tiếp.",
  "Giải Khuyến khích Khoa học kỹ thuật cấp quận.",
] as const;

const PARENT_WISHES = [
  "Gia đình mong muốn cho con học lớp chọn, được thầy cô quan tâm sát sao.",
  "Phụ huynh mong con được xếp lớp gần nhà để thuận tiện đưa đón.",
  "Gia đình hi vọng nhà trường tạo điều kiện cho con phát triển năng khiếu âm nhạc.",
  "Ba mẹ mong con được học cùng bạn bè cũ từ tiểu học.",
  "Phụ huynh mong được nhà trường hỗ trợ tư vấn tâm lý học sinh.",
] as const;

const REJECT_REASONS = [
  "Hồ sơ không đạt điểm chuẩn đầu vào.",
  "Thiếu giấy tờ bắt buộc sau thời hạn bổ sung.",
  "Không thuộc tuyến tuyển sinh của trường.",
] as const;

const NEEDS_INFO_REASONS = [
  "Vui lòng bổ sung bản sao học bạ có công chứng.",
  "Ảnh học bạ bị mờ, đề nghị tải lại bản rõ nét.",
  "Thiếu giấy khai sinh, vui lòng bổ sung.",
] as const;

function buildHistory(
  rng: Rng,
  state: ApplicationState,
  createdAt: Date,
): ApplicationHistoryEntry[] {
  const path = STATE_PATH[state];
  const spanMs = REFERENCE_DATE.getTime() - createdAt.getTime();
  const step = path.length > 1 ? spanMs / path.length : 0;
  return path.map((s, i) => {
    const at = new Date(createdAt.getTime() + step * i + intBetween(rng, 0, 6) * 3600_000);
    const entry: ApplicationHistoryEntry = {
      state: s,
      at: (at.getTime() > REFERENCE_DATE.getTime() ? REFERENCE_DATE : at).toISOString(),
    };
    if (s === "REJECTED") entry.note = pick(rng, REJECT_REASONS);
    if (s === "NEEDS_INFO") entry.note = pick(rng, NEEDS_INFO_REASONS);
    return entry;
  });
}

// NV1 weighted higher — most applicants list a school as their first choice.
const ADMISSION_PRIORITIES = ["nv1", "nv1", "nv2", "nv3"] as const;

// --- Form data ---------------------------------------------------------------

// Weighted performance levels matching the form's gradeTable options.
const GRADE_LEVELS = [
  "excellent", "excellent",
  "good", "good", "good", "good",
  "average", "average",
  "below_average",
] as const;

type FormVariant = { isThpt: boolean; hasPhoto: boolean; hasStudentCode: boolean };

function randomPriorities(rng: Rng): string[] {
  // 30% chance of belonging to 1–2 priority categories.
  const out: string[] = [];
  if (rng() < 0.3) {
    out.push(pick(rng, PRIORITY_CATEGORIES));
    if (rng() < 0.3) {
      const second = pick(rng, PRIORITY_CATEGORIES);
      if (!out.includes(second)) out.push(second);
    }
  }
  return out;
}

function buildFormData(
  rng: Rng,
  studentName: string,
  gender: Gender,
  variant: FormVariant,
): Record<string, unknown> {
  const priorityCategory = randomPriorities(rng);
  const slug = slugifyName(studentName);
  const month = String(intBetween(rng, 1, 12)).padStart(2, "0");
  const day = String(intBetween(rng, 1, 28)).padStart(2, "0");

  if (variant.isThpt) {
    // Lớp 10 intake: ~15 y/o, THCS grades 6–9 + entrance-exam subject scores.
    const birthYear = intBetween(rng, 2010, 2011);
    const grade6 = round1(intBetween(rng, 65, 100) / 10);
    const grade7 = round1(intBetween(rng, 65, 100) / 10);
    const grade8 = round1(intBetween(rng, 68, 100) / 10);
    const grade9 = round1(intBetween(rng, 68, 100) / 10);
    const data: Record<string, unknown> = {
      studentName,
      dateOfBirth: `${birthYear}-${month}-${day}`,
      gender,
      priorityCategory,
      grade6,
      grade7,
      grade8,
      grade9,
      gpa: round1((grade6 + grade7 + grade8 + grade9) / 4),
      // Entrance-exam scores spread lower than school GPA.
      examMath: round1(intBetween(rng, 45, 95) / 10),
      examLiterature: round1(intBetween(rng, 45, 90) / 10),
      examEnglish: round1(intBetween(rng, 40, 98) / 10),
      admissionPriority: pick(rng, ADMISSION_PRIORITIES),
      transcript: `hoc-ba-thcs-${slug}.pdf`,
      graduationCert: `gcn-tot-nghiep-${slug}.pdf`,
    };
    if (rng() < 0.25) data.specialAchievements = pick(rng, SPECIAL_ACHIEVEMENTS);
    if (rng() < 0.35) data.parentWishes = pick(rng, PARENT_WISHES);
    return data;
  }

  // Lớp 6 intake (THCS): ~11 y/o, academic results as performance levels.
  const birthYear = intBetween(rng, 2013, 2014);
  const academicResults: Record<string, string> = {
    grade1: pick(rng, GRADE_LEVELS),
    grade2: pick(rng, GRADE_LEVELS),
    grade3: pick(rng, GRADE_LEVELS),
    grade4: pick(rng, GRADE_LEVELS),
    grade5: pick(rng, GRADE_LEVELS),
  };
  let studentCode = "";
  for (let i = 0; i < 11; i += 1) studentCode += String(intBetween(rng, 0, 9));
  const data: Record<string, unknown> = {
    studentName,
    dateOfBirth: `${birthYear}-${month}-${day}`,
    gender,
    priorityCategory,
    studentCode,
    academicResults,
    studentPhoto: `anh-the-${slug}.jpg`,
  };
  if (rng() < 0.2) {
    data.hasSpecialAchievements = ["yes"];
    data.specialAchievements = pick(rng, SPECIAL_ACHIEVEMENTS);
  }
  if (rng() < 0.35) data.parentWishes = pick(rng, PARENT_WISHES);
  return data;
}

// --- Code generation (deterministic, unlike generateApplicationCode) ---------

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function makeCode(rng: Rng, tenantCode: string, year: string): string {
  const prefix = tenantCode.replace(/[^a-z0-9]/gi, "").slice(0, 3).toUpperCase() || "EDU";
  let suffix = "";
  for (let i = 0; i < 6; i += 1) suffix += CODE_ALPHABET[Math.floor(rng() * CODE_ALPHABET.length)]!;
  return `${prefix}-${year}-${suffix}`;
}

// --- Public generator --------------------------------------------------------

const ROW_COUNT_MIN = 64;
const ROW_COUNT_RANGE = 56; // → 64..120 rows

/**
 * Generate the full deterministic dataset for a tenant. Sorted newest-first by
 * createdAt. Same tenant code always returns the same rows.
 */
export function generateApplications(tenantCode: string): Application[] {
  const rng = mulberry32(hashSeed(tenantCode || "default"));
  const count = ROW_COUNT_MIN + Math.floor(rng() * ROW_COUNT_RANGE);
  // Trần Đại Nghĩa is a THPT (lớp 10 intake); nguyen-gia-thieu also takes a photo.
  const isThpt = tenantCode === "tran-dai-nghia";
  const variant: FormVariant = {
    isThpt,
    // All THCS tenants now have photo + studentCode in their form schema.
    hasPhoto: !isThpt,
    hasStudentCode: !isThpt,
  };
  const year = String(REFERENCE_DATE.getFullYear()).slice(2);
  const seen = new Set<string>();

  const apps: Application[] = [];
  for (let i = 0; i < count; i += 1) {
    const gender: Gender = rng() < 0.52 ? "male" : "female";
    const studentName = makeName(rng, gender);
    const parent = makeParentName(rng);

    // Spread createdAt across the campaign window, slightly front-loaded so the
    // submissions-over-time curve has a realistic ramp.
    const daysAgo = Math.floor(Math.pow(rng(), 0.8) * CAMPAIGN_DAYS);
    const createdAt = new Date(
      REFERENCE_DATE.getTime() -
        daysAgo * 86_400_000 -
        intBetween(rng, 0, 23) * 3600_000 -
        intBetween(rng, 0, 59) * 60_000,
    );

    const state = pickState(rng);
    const history = buildHistory(rng, state, createdAt);
    const lastEntry = history[history.length - 1]!;

    let code = makeCode(rng, tenantCode, year);
    while (seen.has(code)) code = makeCode(rng, tenantCode, year);
    seen.add(code);

    const applicant: Applicant = {
      fullName: parent.name,
      email: `${slugifyName(parent.name)}${intBetween(rng, 1, 99)}@gmail.com`,
      phone: makePhone(rng),
      relationship: parent.relationship,
    };

    apps.push({
      code,
      tenantCode: tenantCode || "default",
      campaignId: "2026",
      state,
      applicant,
      formData: buildFormData(rng, studentName, gender, variant),
      history,
      createdAt: createdAt.toISOString(),
      updatedAt: lastEntry.at,
    });
  }

  apps.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return apps;
}
