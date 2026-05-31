import { TriangleAlert } from "lucide-react";

/**
 * Legal commitment notice above the register wizard. Uses amber/warning palette
 * because the text is a binding disclaimer (not a routine info banner). Static
 * (no scrolling) per tasteskill — the amber surface is attention-grabbing enough.
 */
export function NoticeBanner({ text }: { text: string }) {
  return (
    <div
      role="alert"
      className="border-b border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-950/40 print:hidden"
    >
      <div className="mx-auto flex max-w-3xl items-start gap-2.5 px-4 py-3 sm:px-6">
        <TriangleAlert
          className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400"
          aria-hidden
        />
        <p className="text-sm font-medium leading-relaxed text-amber-900 dark:text-amber-100">
          {text}
        </p>
      </div>
    </div>
  );
}
