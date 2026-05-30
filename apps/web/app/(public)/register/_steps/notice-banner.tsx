import { Megaphone } from "lucide-react";

/**
 * Static per-tenant notice above the register wizard, gated by the
 * `noticeBanner` config so other tenants stay unaffected. Static and legible
 * (no scrolling marquee) per tasteskill — uses the brand accent rather than an
 * alarming red so a routine deadline reads as information, not error.
 */
export function NoticeBanner({ text }: { text: string }) {
  return (
    <div
      role="status"
      className="border-b border-primary/15 bg-primary/5 print:hidden"
    >
      <div className="mx-auto flex max-w-3xl items-start gap-2.5 px-4 py-2.5 sm:px-6">
        <Megaphone className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <p className="text-sm font-medium leading-relaxed text-foreground">
          {text}
        </p>
      </div>
    </div>
  );
}
