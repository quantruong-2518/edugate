import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-dvh max-w-md place-items-center px-6 text-center">
      <div className="space-y-3">
        <p className="text-sm font-medium text-neutral-500">404</p>
        <h1 className="text-2xl font-semibold">Không tìm thấy trang</h1>
        <p className="text-sm text-neutral-600">
          Đường dẫn bạn truy cập không tồn tại hoặc đã bị di chuyển.
        </p>
        <Link className="text-sm font-medium underline" href="/">
          Về trang chủ
        </Link>
      </div>
    </main>
  );
}
