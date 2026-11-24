"use client";

/**
 * @file src/components/ui/StarfieldBackground.tsx
 * @description Fixed full-page background featuring faint grid lines, theme-adaptive glows, and twinkling stars.
 * @purpose Renders the signature backdrop.
 * In Dark Mode: Deep #050506 background with 48 twinkling stars and dual neon glows (blue/orange).
 * In Light Mode: Soft slate background with subtle pastel gradient halos and no distracting stars.
 * @connections
 * - Mounted in /src/app/layout.tsx
 */

import React, { useMemo } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";

export default function StarfieldBackground() {
  const prefersReducedMotion = useReducedMotionSafe();
  const { scrollY } = useScroll();

  // Slow subtle parallax: stars layer translates down by 15% of page scroll
  const parallaxY = useTransform(scrollY, [0, 2000], [0, 300]);

  // Generate 48 deterministic star coordinates
  const stars = useMemo(() => {
    return Array.from({ length: 48 }).map((_, index) => {
      const top = ((index * 37 + 13) % 97) + "%";
      const left = ((index * 59 + 29) % 97) + "%";
      const size = (index % 3) + 1; // 1px to 3px
      const duration = 2.5 + (index % 5) * 0.8;
      const delay = (index % 7) * 0.4;
      const isBlue = index % 3 === 0;
      const isOrange = index % 5 === 0;

      return {
        id: index,
        top,
        left,
        size,
        duration,
        delay,
        color: isBlue ? "bg-cyan-400" : isOrange ? "bg-amber-400" : "bg-white",
      };
    });
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
    >
      {/* 1. Base Adaptive Background */}
      <div className="absolute inset-0 bg-bg transition-colors duration-300" />

      {/* 2. Faint 1px Subtle Grid Lines Layer */}
      <div
        className="absolute inset-0 opacity-40 dark:opacity-[0.035]"
        style={{
          backgroundImage: `
            linear-gradient(to right, var(--border) 1px, transparent 1px),
            linear-gradient(to bottom, var(--border) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
        }}
      />

      {/* 3. Soft Ambient Vignette Glows (Pastel in light mode, neon in dark mode) */}
      <div className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-cyan-400/10 dark:bg-cyan-900/15 blur-[130px] transition-all" />
      <div className="absolute top-[30%] -right-[15%] w-[65vw] h-[65vw] rounded-full bg-amber-400/10 dark:bg-amber-900/15 blur-[150px] transition-all" />

      {/* 4. Twinkling Stars Layer (Visible exclusively in Dark Mode) */}
      <motion.div
        style={{ y: prefersReducedMotion ? 0 : parallaxY }}
        className="absolute inset-0 w-full h-full hidden dark:block"
      >
        {stars.map((star) => (
          <motion.span
            key={star.id}
            initial={{ opacity: 0.2 }}
            animate={
              prefersReducedMotion
                ? { opacity: 0.4 }
                : {
                    opacity: [0.15, 0.9, 0.15],
                    scale: [0.8, 1.2, 0.8],
                  }
            }
            transition={{
              duration: star.duration,
              delay: star.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              top: star.top,
              left: star.left,
              width: `${star.size}px`,
              height: `${star.size}px`,
            }}
            className={`absolute rounded-full shadow-[0_0_8px_rgba(255,255,255,0.6)] ${star.color}`}
          />
        ))}
      </motion.div>
    </div>
  );
}
