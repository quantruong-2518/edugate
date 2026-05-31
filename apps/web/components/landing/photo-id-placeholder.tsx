import { User } from 'lucide-react';

const SIZES = [
  { label: '3×4 cm', note: 'Phổ biến nhất — CMND, học bạ, hồ sơ tuyển sinh' },
  { label: '4×6 cm', note: 'Hộ chiếu, một số hồ sơ đặc biệt' },
];

export function PhotoIdPlaceholder() {
  return (
    <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
      {/* Visual placeholder */}
      <div className="flex shrink-0 flex-col items-center gap-2">
        <div
          className="flex items-center justify-center rounded-lg border-2 border-dashed border-primary/40 bg-muted/60"
          style={{ width: 72, height: 96 }}
          aria-hidden
        >
          <User className="size-8 text-primary/40" />
        </div>
        <span className="text-center text-xs text-muted-foreground">
          Ảnh thẻ
          <br />
          nền trắng / xanh nhạt
        </span>
      </div>

      {/* Size table */}
      <div className="min-w-0 flex-1">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Kích thước ảnh thẻ tiêu chuẩn
        </p>
        <ul className="space-y-2">
          {SIZES.map(({ label, note }) => (
            <li key={label} className="flex items-baseline gap-2 text-sm">
              <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 font-mono text-xs font-semibold text-primary">
                {label}
              </span>
              <span className="text-muted-foreground">{note}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          Định dạng: JPG hoặc PNG · Dung lượng tối đa: 2 MB
        </p>
      </div>
    </div>
  );
}
