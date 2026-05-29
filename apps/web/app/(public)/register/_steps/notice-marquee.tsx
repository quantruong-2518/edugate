import { AlertTriangle } from "lucide-react";

/**
 * Scrolling red disclaimer above the register wizard. Rendered server-side and
 * gated by the per-tenant `noticeBanner` so other tenants stay unaffected.
 *
 * The animation is CSS-only (no client component, no JS) — the inner content
 * is duplicated so the loop is seamless. `prefers-reduced-motion` users get a
 * static, wrapping line instead of a scroller (handled by `motion-safe:` /
 * `motion-reduce:` Tailwind variants).
 */
export function NoticeMarquee({ text }: { text: string }) {
  return (
    <div
      role="alert"
      className="sticky top-0 z-30 w-full overflow-hidden border-b border-destructive/40 bg-destructive/10 text-destructive"
    >
      <div className="flex items-center gap-3 px-3 py-2 motion-reduce:flex-wrap">
        <AlertTriangle
          className="size-4 shrink-0 motion-reduce:mt-0.5"
          aria-hidden
        />
        <div className="text-sm motion-safe:flex-1 motion-safe:overflow-hidden">
          <div className="font-medium motion-safe:flex motion-safe:w-max motion-safe:animate-marquee motion-safe:whitespace-nowrap motion-reduce:whitespace-normal">
            <span className="motion-reduce:hidden">
              {text}
              <span className="mx-12" aria-hidden>
                •
              </span>
            </span>
            <span aria-hidden className="motion-reduce:hidden">
              {text}
              <span className="mx-12">•</span>
            </span>
            <span className="motion-safe:hidden">{text}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
