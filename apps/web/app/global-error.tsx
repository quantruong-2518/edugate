"use client";

// Last-resort boundary for errors thrown in the root layout itself. It REPLACES
// the root layout (so it must render its own <html>/<body>) and therefore sits
// OUTSIDE NextIntlClientProvider — useTranslations is unavailable here. It may
// also render before globals.css is applied, so styling stays inline. Strings
// are static VI (the default locale); this screen should be vanishingly rare.
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="vi">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          fontFamily: "system-ui, sans-serif",
          padding: "1.5rem",
        }}
      >
        <div style={{ maxWidth: "28rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.125rem", fontWeight: 600, margin: "0 0 0.5rem" }}>
            Đã có lỗi xảy ra
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#666", margin: "0 0 1.25rem" }}>
            Vui lòng tải lại trang. Nếu lỗi vẫn tiếp diễn, hãy liên hệ nhà trường.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              fontSize: "0.875rem",
              padding: "0.5rem 1rem",
              borderRadius: "0.375rem",
              border: "1px solid #ccc",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            Thử lại
          </button>
        </div>
      </body>
    </html>
  );
}
