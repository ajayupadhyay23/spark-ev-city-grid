/**
 * @file src/hooks/useReducedMotionSafe.ts
 * @description Hook detecting user's OS-level accessibility preference for reduced motion.
 * @purpose Disables intense 3D tilts, starfield parallax, and infinite marquee loops when requested
 * by drivers sensitive to motion sickness or vestibular disorders.
 * @connections
 * - Used across all animated landing sections in /src/components/landing/...
 */

import { useState, useEffect } from "react";

export function useReducedMotionSafe(): boolean {
  const [prefersReduced, setPrefersReduced] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mediaQuery.matches);

    const listener = (event: MediaQueryListEvent) => {
      setPrefersReduced(event.matches);
    };

    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  return prefersReduced;
}
