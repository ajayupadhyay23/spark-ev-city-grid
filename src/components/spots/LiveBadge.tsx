"use client";

/**
 * @file src/components/spots/LiveBadge.tsx
 * @description Pulsating badge signifying real-time sensor freshness.
 * @purpose Draws driver attention to live IoT bay availability.
 * Animates a glowing dot and label using Framer Motion.
 * @connections
 * - Used across /src/components/spots/SpotCard.tsx and /src/components/spots/SpotDrawer.tsx
 */

import React from "react";
import { motion } from "framer-motion";
import { livePulseVariant } from "@/lib/animations";

interface LiveBadgeProps {
  className?: string;
}

export default function LiveBadge({ className = "" }: LiveBadgeProps) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono tracking-wider font-semibold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 ${className}`}
    >
      <motion.span
        variants={livePulseVariant}
        initial="initial"
        animate="animate"
        className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34D399]"
      />
      LIVE
    </div>
  );
}
