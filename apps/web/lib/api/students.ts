import type { StudentLookupValue } from "@shared/form";

/**
 * Student-code lookup seam (pha 1 mock). The parent enters the MOET-issued
 * student code; this resolves the matching student record. Pha 2 swaps the body
 * for a real `GET /students/:code` call (likely proxied to the MOET registry),
 * keeping the signature. Any well-formed code (8–12 digits) resolves to a
 * deterministic mock record so the demo is self-serve; a handful of fixed codes
 * return curated data.
 */

export type StudentRecord = Required<
  Pick<StudentLookupValue, "code" | "name" | "dob" | "gender">
>;

const MOCK_LATENCY_MS = 600;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_LATENCY_MS));
}

const CODE_RE = /^\d{8,12}$/;

const FIRST = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Vũ", "Đặng", "Bùi"];
const MIDDLE_M = ["Văn", "Đức", "Minh", "Quốc", "Hữu", "Bá"];
const MIDDLE_F = ["Thị", "Ngọc", "Thu", "Phương", "Khánh", "Mai"];
const LAST_M = ["An", "Bình", "Dũng", "Khoa", "Nam", "Sơn", "Tuấn", "Việt"];
const LAST_F = ["Anh", "Chi", "Hà", "Hương", "Linh", "Ngân", "Trang", "Vy"];

/** Curated records for memorable demo codes. */
const FIXTURES: Record<string, StudentRecord> = {
  "79012345678": {
    code: "79012345678",
    name: "Nguyễn Minh Khoa",
    dob: "2014-09-12",
    gender: "male",
  },
  "01987654321": {
    code: "01987654321",
    name: "Trần Ngọc Linh",
    dob: "2014-03-25",
    gender: "female",
  },
};

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick<T>(arr: readonly T[], n: number): T {
  return arr[n % arr.length] as T;
}

function generate(code: string): StudentRecord {
  const h = hash(code);
  const isFemale = h % 2 === 0;
  const name = [
    pick(FIRST, h),
    pick(isFemale ? MIDDLE_F : MIDDLE_M, h >> 3),
    pick(isFemale ? LAST_F : LAST_M, h >> 6),
  ].join(" ");
  // A primary-school leaver: born ~2014, day/month derived from the code.
  const month = ((h >> 9) % 12) + 1;
  const day = ((h >> 13) % 28) + 1;
  const dob = `2014-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return { code, name, dob, gender: isFemale ? "female" : "male" };
}

export async function lookupStudent(
  rawCode: string,
): Promise<StudentRecord | null> {
  const code = rawCode.trim();
  if (!CODE_RE.test(code)) return delay(null);
  return delay(FIXTURES[code] ?? generate(code));
}
