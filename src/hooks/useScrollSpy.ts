/**
 * @file src/hooks/useScrollSpy.ts
 * @description Hook that observes section elements on screen to highlight the corresponding navbar link.
 * @purpose Implements scroll-spy functionality without jitter, keeping the floating pill navbar in sync
 * with the user's current reading position as they scroll through the landing page.
 * @connections
 * - Used by /src/components/landing/FloatingNavbar.tsx
 */

import { useEffect, useState } from "react";

export function useScrollSpy(sectionIds: string[], offset = 120): string {
  const [activeId, setActiveId] = useState<string>(sectionIds[0] || "");

  useEffect(() => {
    function handleScroll() {
      const scrollPosition = window.scrollY + offset;

      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const id = sectionIds[i];
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop;
          if (scrollPosition >= top) {
            setActiveId(id);
            return;
          }
        }
      }

      // Default to first section when at top
      if (window.scrollY < 200 && sectionIds.length > 0) {
        setActiveId(sectionIds[0]);
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [sectionIds, offset]);

  return activeId;
}
