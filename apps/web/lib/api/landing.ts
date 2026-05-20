import type { LandingConfig, LandingSection } from "@shared/landing";

/**
 * Per-tenant landing page configuration. Pha 1 returns static fixtures; task 15
 * swaps the body for a real fetch keeping this signature. Section content is
 * data (editable per tenant via task 17), so it is plain VI text here — not
 * next-intl keys. Render order follows the array order.
 *
 * Images are Unsplash URLs (mock content). Pha 2 tenants upload their own.
 */

/** Build a sized, optimised Unsplash URL from a photo id. */
function unsplash(id: string, w = 1600): string {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;
}

const CVA_CONFIG: LandingConfig = {
  sections: [
    {
      type: "hero",
      eyebrow: "Tuyển sinh năm học 2026 - 2027",
      headline: "Đăng ký tuyển sinh trực tuyến",
      subheadline:
        "Nộp hồ sơ và theo dõi kết quả mọi lúc, mọi nơi — không cần đến trường. Quy trình minh bạch, kết quả thời gian thực.",
      image: unsplash("1503676260728-1c00da094a0b"),
      ctaPrimary: { label: "Đăng ký ngay", href: "/register" },
      ctaSecondary: { label: "Tra cứu hồ sơ", href: "/track" },
    },
    {
      type: "stats",
      items: [
        { label: "Hồ sơ đã nộp", value: "1.240+" },
        { label: "Tỷ lệ trúng tuyển", value: "92%" },
        { label: "Năm kinh nghiệm", value: "25" },
        { label: "Phụ huynh hài lòng", value: "98%" },
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
          body: "Học sinh hoàn thành chương trình tiểu học trên địa bàn, có hộ khẩu hoặc tạm trú theo quy định của Sở Giáo dục.",
        },
        {
          id: "schedule",
          label: "Lịch tuyển sinh",
          body: "Nhận hồ sơ trực tuyến từ 01/06 đến 30/06/2026. Công bố kết quả dự kiến ngày 15/07/2026.",
        },
        {
          id: "documents",
          label: "Hồ sơ cần nộp",
          body: "Học bạ, giấy khai sinh, ảnh thẻ và đơn đăng ký. Tất cả nộp dưới dạng bản scan hoặc ảnh chụp rõ nét.",
        },
      ],
    },
    {
      type: "about",
      title: "Về nhà trường",
      body: "Trường Tiểu học & THCS Cầu Vàng là môi trường giáo dục hiện đại, chú trọng phát triển toàn diện cho học sinh. Với đội ngũ giáo viên tận tâm và cơ sở vật chất tiên tiến, chúng tôi đồng hành cùng mỗi học sinh trên hành trình khám phá tri thức.",
      image: unsplash("1562774053-701939374585", 1200),
    },
    {
      type: "testimonials",
      title: "Phụ huynh nói gì",
      items: [
        {
          name: "Chị Nguyễn Lan",
          role: "Phụ huynh lớp 6",
          quote:
            "Quy trình nộp hồ sơ rất nhanh gọn và rõ ràng. Tôi hoàn tất chỉ trong mười phút ngay tại nhà.",
          avatarUrl: unsplash("1494790108377-be9c29b29330", 200),
        },
        {
          name: "Anh Trần Minh",
          role: "Phụ huynh lớp 6",
          quote:
            "Tôi theo dõi được trạng thái hồ sơ theo thời gian thực, không còn phải gọi điện hỏi nhà trường.",
          avatarUrl: unsplash("1507003211169-0a1dd7228f2d", 200),
        },
        {
          name: "Chị Phạm Thu",
          role: "Phụ huynh lớp 6",
          quote:
            "Giao diện thân thiện, dễ dùng kể cả với người không rành công nghệ như tôi.",
          avatarUrl: unsplash("1438761681033-6461ffad8d80", 200),
        },
      ],
    },
    {
      type: "faq",
      title: "Câu hỏi thường gặp",
      items: [
        {
          question: "Tôi có thể sửa hồ sơ sau khi nộp không?",
          answer:
            "Khi hồ sơ ở trạng thái cần bổ sung, bạn có thể cập nhật và nộp lại trực tiếp trên hệ thống.",
        },
        {
          question: "Mất mã hồ sơ thì làm sao?",
          answer:
            "Mã hồ sơ được gửi qua email đã xác thực khi nộp. Bạn có thể tìm lại trong hộp thư của mình.",
        },
        {
          question: "Hồ sơ được duyệt trong bao lâu?",
          answer:
            "Thông thường hồ sơ được xét duyệt trong vòng 3-5 ngày làm việc kể từ khi nộp đầy đủ.",
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
            {
              label: "Email: tuyensinh@cva-edu.vn",
              href: "mailto:tuyensinh@cva-edu.vn",
            },
          ],
        },
        {
          title: "Tuyển sinh",
          links: [
            { label: "Đăng ký", href: "/register" },
            { label: "Tra cứu hồ sơ", href: "/track" },
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
      image: unsplash("1523240795612-9a054b0db644"),
      ctaPrimary: { label: "Đăng ký ngay", href: "/register" },
    },
    {
      type: "about",
      title: "Giới thiệu",
      body: "Trường THPT Trần Đại Nghĩa nổi tiếng với chất lượng đào tạo mũi nhọn và môi trường học thuật năng động.",
      image: unsplash("1541339907198-e08756dedf3f", 1200),
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

const NHT_CONFIG: LandingConfig = {
  sections: [
    {
      type: "hero",
      eyebrow: "Tuyển sinh lớp 6 — Năm học 2026 - 2027",
      headline: "THCS Nguyễn Huy Tưởng",
      subheadline:
        "Ngôi trường giàu truyền thống tại Đông Anh, Hà Nội — nơi ươm mầm tri thức và nuôi dưỡng nhân cách cho thế hệ tương lai.",
      image: unsplash("1509062522246-3755977927d7"),
      ctaPrimary: { label: "Đăng ký ngay", href: "/register" },
      ctaSecondary: { label: "Tra cứu hồ sơ", href: "/track" },
    },
    {
      type: "stats",
      items: [
        { label: "Học sinh toàn trường", value: "1.080" },
        { label: "Giáo viên đạt chuẩn", value: "100%" },
        { label: "Năm thành lập", value: "1996" },
        { label: "Học sinh giỏi cấp huyện", value: "320+" },
      ],
    },
    {
      type: "about",
      title: "Về Trường THCS Nguyễn Huy Tưởng",
      body: "Tọa lạc tại huyện Đông Anh, Hà Nội, Trường THCS Nguyễn Huy Tưởng tự hào với bề dày truyền thống dạy tốt - học tốt. Nhà trường không ngừng đổi mới phương pháp giảng dạy, chú trọng giáo dục đạo đức và phát triển năng lực toàn diện cho mỗi học sinh.",
      image: unsplash("1577896851231-70ef18881754", 1200),
    },
    {
      type: "process",
      title: "Quy trình đăng ký tuyển sinh",
      steps: [
        { title: "Khai thông tin", description: "Điền thông tin phụ huynh." },
        { title: "Điền hồ sơ", description: "Hoàn tất biểu mẫu lớp 6." },
        { title: "Xác thực email", description: "Nhập mã OTP gửi qua email." },
        { title: "Nộp hồ sơ", description: "Nhận mã hồ sơ để tra cứu." },
        { title: "Theo dõi", description: "Cập nhật kết quả xét tuyển." },
      ],
    },
    {
      type: "infoTabs",
      title: "Thông tin tuyển sinh",
      tabs: [
        {
          id: "eligibility",
          label: "Đối tượng",
          body: "Học sinh hoàn thành chương trình tiểu học, có hộ khẩu hoặc cư trú tại huyện Đông Anh và các khu vực lân cận theo phân tuyến.",
        },
        {
          id: "schedule",
          label: "Lịch tuyển sinh",
          body: "Nhận hồ sơ trực tuyến từ 01/07 đến 15/07/2026. Công bố danh sách trúng tuyển dự kiến ngày 25/07/2026.",
        },
        {
          id: "documents",
          label: "Hồ sơ cần nộp",
          body: "Giấy khai sinh, học bạ tiểu học, giấy chứng nhận hoàn thành chương trình tiểu học và ảnh thẻ 3x4.",
        },
      ],
    },
    {
      type: "testimonials",
      title: "Cảm nhận của phụ huynh",
      items: [
        {
          name: "Chị Đỗ Hương",
          role: "Phụ huynh lớp 6A",
          quote:
            "Thầy cô tận tâm, môi trường học tập kỷ luật mà vẫn ấm áp. Con tôi tiến bộ rõ rệt từng học kỳ.",
          avatarUrl: unsplash("1534528741775-53994a69daeb", 200),
        },
        {
          name: "Anh Lê Quang",
          role: "Phụ huynh lớp 7B",
          quote:
            "Việc đăng ký tuyển sinh online giúp gia đình ở xa như chúng tôi tiết kiệm rất nhiều thời gian.",
          avatarUrl: unsplash("1500648767791-00dcc994a43e", 200),
        },
      ],
    },
    {
      type: "faq",
      title: "Câu hỏi thường gặp",
      items: [
        {
          question: "Trường có nhận học sinh trái tuyến không?",
          answer:
            "Nhà trường ưu tiên học sinh đúng tuyến; chỉ tiêu trái tuyến (nếu có) sẽ được thông báo công khai theo từng năm.",
        },
        {
          question: "Có tổ chức khảo sát đầu vào không?",
          answer:
            "Tùy năm học, nhà trường có thể tổ chức khảo sát năng lực. Thông tin cụ thể sẽ gửi qua email đã đăng ký.",
        },
        {
          question: "Học phí và các khoản thu như thế nào?",
          answer:
            "Trường công lập thu theo quy định của thành phố Hà Nội; chi tiết được niêm yết tại trường và website.",
        },
      ],
    },
    {
      type: "footer",
      columns: [
        {
          title: "Liên hệ",
          links: [
            { label: "Địa chỉ: Đông Anh, Hà Nội", href: "#" },
            { label: "Hotline: 024 3883 0000", href: "tel:02438830000" },
            {
              label: "Email: c2nguyenhuytuong@hanoi.edu.vn",
              href: "mailto:c2nguyenhuytuong@hanoi.edu.vn",
            },
          ],
        },
        {
          title: "Tuyển sinh",
          links: [
            { label: "Đăng ký lớp 6", href: "/register" },
            { label: "Tra cứu hồ sơ", href: "/track" },
          ],
        },
      ],
      copyright: "Trường THCS Nguyễn Huy Tưởng — Đông Anh, Hà Nội",
    },
  ],
};

const TENANT_CONFIGS: Readonly<Record<string, LandingConfig>> = {
  "cva-edu": CVA_CONFIG,
  "tran-dai-nghia": TDN_CONFIG,
  "nguyen-huy-tuong": NHT_CONFIG,
};

const DEFAULT_CONFIG: LandingConfig = {
  sections: [
    {
      type: "hero",
      headline: "EduGate",
      subheadline: "Nền tảng tuyển sinh đa tenant.",
      image: unsplash("1523050854058-8df90110c9f1"),
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
