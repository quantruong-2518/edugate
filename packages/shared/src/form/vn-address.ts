/**
 * Compact Vietnamese administrative dataset for the `address` form field
 * (province → district → ward cascading select). Pha 1 mock-grade: a curated
 * subset that covers the districts our demo tenants live in (Hoài Đức, Long
 * Biên, Đông Anh) plus a few major cities. Pha 2 swaps this for the full GSO
 * dataset fetched from the API; the `AddressValue` shape stays identical.
 */

export type VnWard = string;
export type VnDistrict = { name: string; wards: VnWard[] };
export type VnProvince = { name: string; districts: VnDistrict[] };

export const VN_PROVINCES: readonly VnProvince[] = [
  {
    name: "Hà Nội",
    districts: [
      {
        name: "Hoài Đức",
        wards: ["An Khánh", "Đức Thượng", "Kim Chung", "La Phù", "Sơn Đồng"],
      },
      {
        name: "Long Biên",
        wards: ["Bồ Đề", "Đức Giang", "Ngọc Lâm", "Sài Đồng", "Việt Hưng"],
      },
      {
        name: "Đông Anh",
        wards: ["Đông Hội", "Kim Chung", "Nguyên Khê", "Uy Nỗ", "Vân Nội"],
      },
      {
        name: "Cầu Giấy",
        wards: ["Dịch Vọng", "Mai Dịch", "Nghĩa Đô", "Quan Hoa", "Yên Hòa"],
      },
      {
        name: "Đống Đa",
        wards: ["Cát Linh", "Khâm Thiên", "Láng Hạ", "Ô Chợ Dừa", "Văn Miếu"],
      },
    ],
  },
  {
    name: "TP. Hồ Chí Minh",
    districts: [
      {
        name: "Quận 1",
        wards: ["Bến Nghé", "Bến Thành", "Cầu Kho", "Đa Kao", "Phạm Ngũ Lão"],
      },
      {
        name: "Quận 3",
        wards: ["Phường 1", "Phường 9", "Phường 11", "Phường 14", "Võ Thị Sáu"],
      },
      {
        name: "Thủ Đức",
        wards: ["Hiệp Bình Chánh", "Linh Trung", "Tam Phú", "Trường Thọ"],
      },
    ],
  },
  {
    name: "Đà Nẵng",
    districts: [
      {
        name: "Hải Châu",
        wards: ["Hải Châu I", "Thanh Bình", "Thuận Phước"],
      },
      {
        name: "Thanh Khê",
        wards: ["An Khê", "Chính Gián", "Tân Chính"],
      },
    ],
  },
];

export const VN_PROVINCE_NAMES: readonly string[] = VN_PROVINCES.map(
  (p) => p.name,
);

export function vnDistrictsOf(province: string): readonly VnDistrict[] {
  return VN_PROVINCES.find((p) => p.name === province)?.districts ?? [];
}

export function vnWardsOf(
  province: string,
  district: string,
): readonly VnWard[] {
  return vnDistrictsOf(province).find((d) => d.name === district)?.wards ?? [];
}
