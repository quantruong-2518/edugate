"use client";

import { type ElementType, type ReactNode, useEffect, useRef, useState } from "react";

type RevealVariant = "up" | "left" | "right";

/**
 * Scroll-into-view reveal wrapper. On first intersection it sets
 * `data-revealed`, which the tenant-scoped CSS (see globals.css) uses to play a
 * transition. The visual is opt-in *per tenant* — only `[data-tenant]` that
 * styles `[data-reveal]` animates; everywhere else this renders an inert wrapper
 * and the content shows normally. Children marked `data-reveal-item` (with a
 * `--reveal-index`) cascade in a stagger once the wrapper is revealed.
 *
 * One-shot (does not re-hide on scroll out) and respects prefers-reduced-motion
 * via the CSS gate, so motion-averse visitors and no-JS fallbacks see content.
 */
export function Reveal({
  children,
  variant,
  as: Tag = "div",
  className,
}: {
  children: ReactNode;
  /** Wrapper-level entrance. Omit when children handle their own stagger. */
  variant?: RevealVariant;
  as?: ElementType;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || revealed) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true);
            observer.disconnect();
            break;
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [revealed]);

  return (
    <Tag
      ref={ref}
      data-reveal=""
      data-reveal-variant={variant}
      data-revealed={revealed ? "" : undefined}
      className={className}
    >
      {children}
    </Tag>
  );
}
