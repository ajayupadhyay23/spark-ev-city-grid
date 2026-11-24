/**
 * @file src/hooks/useCountUp.ts
 * @description Hook providing smooth numerical count-up animation for stat counters.
 * @purpose Animates numerical values (e.g., total parking slots, active EV stations) from 0 to target
 * using requestAnimationFrame with ease-out cubic deceleration for a premium feel.
 * @connections
 * - Used in /src/components/landing/ArchHero.tsx and /src/components/landing/DashboardMockup.tsx
 */

import { useState, useEffect } from "react";

export function useCountUp(target: number, durationMs = 1500, enabled = true): number {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    if (!enabled) {
      setCount(target);
      return;
    }

    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / durationMs, 1);

      // Ease-out cubic formula: 1 - pow(1 - progress, 3)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * target));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setCount(target);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(animationFrameId);
  }, [target, durationMs, enabled]);

  return count;
}
