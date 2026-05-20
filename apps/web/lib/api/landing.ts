import type { LandingConfig, LandingSection } from "@shared/landing";

/**
 * Per-tenant landing page configuration. Pha 1 returns static fixtures; task 15
 * swaps the body for a real fetch keeping this signature. Section content is
 * data (editable per tenant via task 17), so it is plain VI text here — not
 * next-intl keys. Render order follows the array order.
 */

const CVA_CONFIG: LandingConfig = {
  sections: [
    {
      type: "hero",
      eyebrow: "Tuyển sinh năm học 2026 - 2027",
      headline: "Đăng ký tuyển sinh trực tuyến",
      subheadline:
        "Nộp hồ sơ và theo dõi kết quả mọi lúc, mọi nơi — không cần đến trường.",
      ctaPrimary: { label: "Đăng ký ngay", href: "/register" },
      ctaSecondary: { label: "Tra cứu hồ sơ", href: "/track" },
    },
    {
      type: "stats",
      items: [
        { label: "Hồ sơ đã nộp", value: "1.240+" },
        { label: "Tỷ lệ trúng tuyển", value: "92%" },
        { label: "Năm kinh nghiệm", value: "25" },
      ],
    },
    {
      type: "process",
      title: "Quy trình 5 bước",
      steps: [
        { title: "Khai thông tin", description: "Điền thông tin người khai." },
        { title: "Điền hồ sơ", description: "Hoàn tất biểu mẫu tuyển sinh." },
        { title: "Xác thực email", description: "Nhập mã OTP gửi tới email." },
        { title: "Nộp hồ sơ", description: "Nhận mã hồ sơ để tra cứu." },
        { title: "Theo dõi", description: "Cập nhật trạng thái duyệt hồ sơ." },
      ],
    },
    {
      type: "infoTabs",
      title: "Thông tin tuyển sinh",
      tabs: [
        {
          id: "eligibility",
          label: "Đối tượng",
          body: "Học sinh hoàn thành chương trình tiểu học trên địa bàn.",
        },
        {
          id: "schedule",
          label: "Lịch tuyển sinh",
          body: "Nhận hồ sơ từ 01/06 đến 30/06/2026.",
        },
        {
          id: "documents",
          label: "Hồ sơ cần nộp",
          body: "Học bạ, giấy khai sinh, ảnh thẻ và đơn đăng ký.",
        },
      ],
    },
    {
      type: "about",
      title: "Về nhà trường",
      body: "Trường Tiểu học & THCS Cầu Vàng là môi trường giáo dục hiện đại, chú trọng phát triển toàn diện cho học sinh.",
    },
    {
      type: "testimonials",
      title: "Phụ huynh nói gì",
      items: [
        {
          name: "Chị Nguyễn Lan",
          role: "Phụ huynh lớp 6",
          quote: "Quy trình nộp hồ sơ rất nhanh gọn và rõ ràng.",
        },
        {
          name: "Anh Trần Minh",
          role: "Phụ huynh lớp 6",
          quote: "Tôi theo dõi được trạng thái hồ sơ theo thời gian thực.",
        },
      ],
    },
    {
      type: "faq",
      title: "Câu hỏi thường gặp",
      items: [
        {
          question: "Tôi có thể sửa hồ sơ sau khi nộp không?",
          answer: "Khi hồ sơ ở trạng thái cần bổ sung, bạn có thể cập nhật.",
        },
        {
          question: "Mất mã hồ sơ thì làm sao?",
          answer: "Mã hồ sơ được gửi qua email đã xác thực khi nộp.",
        },
      ],
    },
    {
      type: "footer",
      columns: [
        {
          title: "Liên hệ",
          links: [
            { label: "Hotline: 1900 1234", href: "tel:19001234" },
            { label: "Email: tuyensinh@cva-edu.vn", href: "mailto:tuyensinh@cva-edu.vn" },
          ],
        },
      ],
      copyright: "Trường Tiểu học & THCS Cầu Vàng",
    },
  ],
};

// Different section order + a deliberately unknown type to exercise the
// renderer's skip-and-warn fallback (forward-compat with pha 2 configs that
// may carry a section type this FE build does not know yet).
const TDN_CONFIG: LandingConfig = {
  sections: [
    {
      type: "hero",
      eyebrow: "Kỳ tuyển sinh lớp 10",
      headline: "Trường THPT Trần Đại Nghĩa",
      subheadline: "Nuôi dưỡng tài năng, chắp cánh tương lai.",
      ctaPrimary: { label: "Đăng ký ngay", href: "/register" },
    },
    {
      type: "about",
      title: "Giới thiệu",
      body: "Trường THPT Trần Đại Nghĩa nổi tiếng với chất lượng đào tạo mũi nhọn và môi trường học thuật năng động.",
    },
    {
      // Unknown to this FE build — renderer must skip + warn, not crash.
      type: "gallery",
      images: [],
    } as unknown as LandingSection,
    {
      type: "process",
      title: "Các bước đăng ký",
      steps: [
        { title: "Khai thông tin", description: "Thông tin thí sinh." },
        { title: "Điền hồ sơ", description: "Biểu mẫu tuyển sinh lớp 10." },
        { title: "Xác thực", description: "Xác thực email." },
        { title: "Nộp", description: "Nhận mã hồ sơ." },
        { title: "Theo dõi", description: "Theo dõi kết quả." },
      ],
    },
    {
      type: "faq",
      items: [
        {
          question: "Trường có lớp chuyên không?",
          answer: "Có, trường tuyển sinh nhiều lớp chuyên.",
        },
      ],
    },
    {
      type: "footer",
      copyright: "Trường THPT Trần Đại Nghĩa",
    },
  ],
};

const TENANT_CONFIGS: Readonly<Record<string, LandingConfig>> = {
  "cva-edu": CVA_CONFIG,
  "tran-dai-nghia": TDN_CONFIG,
};

const DEFAULT_CONFIG: LandingConfig = {
  sections: [
    {
      type: "hero",
      headline: "EduGate",
      subheadline: "Nền tảng tuyển sinh đa tenant.",
      ctaPrimary: { label: "Đăng ký ngay", href: "/register" },
    },
  ],
};

export async function getLandingConfig(
  tenantCode: string | null,
): Promise<LandingConfig> {
  if (tenantCode && tenantCode in TENANT_CONFIGS) {
    return TENANT_CONFIGS[tenantCode] as LandingConfig;
  }
  return DEFAULT_CONFIG;
}
