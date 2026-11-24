"use client";

/**
 * @file src/components/landing/LogoMarquee.tsx
 * @description Infinite horizontal scrolling marquee displaying municipal and EV charging network partners.
 * @purpose Demonstrates credibility and enterprise trust using a smooth CSS/Framer translateX loop.
 * WHY WE DUPLICATE THE LIST ONCE:
 * By rendering the list of partner brands twice ([...PARTNER_NETWORKS, ...PARTNER_NETWORKS]) and translating
 * exactly -50% along the X axis, the second copy seamlessly replaces the first copy at the loop reset point,
 * eliminating any visual jump or white gap during the infinite animation cycle.
 * @connections
 * - Used at bottom of Hero on /src/app/page.tsx
 * - Reads partner brand definitions from /src/lib/constants.ts
 */

import React from "react";
import { motion } from "framer-motion";
import { PARTNER_NETWORKS } from "@/lib/constants";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";

export default function LogoMarquee() {
  const prefersReduced = useReducedMotionSafe();

  // Duplicate items array once to achieve the infinite seamless wrapping effect
  const marqueeItems = [...PARTNER_NETWORKS, ...PARTNER_NETWORKS];

  return (
    <div className="w-full py-8 border-y border-white/[0.06] bg-[#07070a]/60 relative overflow-hidden group">
      {/* Edge gradient fade masks on both sides so items fade gracefully into darkness */}
      <div className="absolute left-0 inset-y-0 w-20 sm:w-32 bg-gradient-to-r from-[#050506] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 inset-y-0 w-20 sm:w-32 bg-gradient-to-l from-[#050506] to-transparent z-10 pointer-events-none" />

      {prefersReduced ? (
        // Static flex wrap fallback for users with reduced motion preferences
        <div className="flex flex-wrap items-center justify-center gap-8 px-6 opacity-40">
          {PARTNER_NETWORKS.map((partner, idx) => (
            <span key={idx} className={`text-neutral-400 text-sm ${partner.font}`}>
              {partner.name}
            </span>
          ))}
        </div>
      ) : (
        // Infinite sliding marquee; pauses on hover via CSS group-hover
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            duration: 28,
            ease: "linear",
            repeat: Infinity,
          }}
          className="flex items-center gap-12 sm:gap-16 whitespace-nowrap will-change-transform group-hover:[animation-play-state:paused]"
        >
          {marqueeItems.map((partner, index) => (
            <div
              key={index}
              className="flex items-center gap-3 text-neutral-500 hover:text-neutral-300 transition-colors cursor-default select-none opacity-45 hover:opacity-90"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-600" />
              <span className={`text-xs sm:text-sm tracking-wider ${partner.font}`}>
                {partner.name}
              </span>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
