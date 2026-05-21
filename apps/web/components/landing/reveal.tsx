"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { cn } from "@ui/lib/utils";

/**
 * When true, `<Reveal>` skips its scroll observer and renders children visible
 * immediately. The branding/landing editor (task 17) wraps its live preview in
 * this so sections aren't stuck at `opacity-0` inside the constrained preview
 * panel (the viewport-rooted observer would never fire for them).
 */
export const RevealStaticContext = createContext(false);

/**
 * Reveal-on-scroll wrapper. Fades + slides its children up the first time they
 * enter the viewport (IntersectionObserver, no animation dep). RSC content can
 * be passed as children since this is a thin client boundary. Respects
 * prefers-reduced-motion.
 */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isStatic = useContext(RevealStaticContext);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (isStatic) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isStatic]);

  const visible = isStatic || shown;

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out motion-reduce:transition-none motion-reduce:opacity-100",
        visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
        className,
      )}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}
