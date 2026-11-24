"use client";

/**
 * @file src/components/ui/ProgressBar.tsx
 * @description Animated capacity progress bar showing available vs total slots.
 * @purpose Renders smooth visual ratio fills with color transition (Green -> Amber -> Rose)
 * to immediately convey parking lot fullness at a glance.
 * @connections
 * - Used in /src/components/spots/SpotCard.tsx and /src/components/spots/SpotDrawer.tsx
 */

import React from "react";
import { motion } from "framer-motion";
import { getAvailabilityTier } from "@/lib/utils";

interface ProgressBarProps {
  free: number;
  total: number;
  showLabels?: boolean;
}

export default function ProgressBar({ free, total, showLabels = true }: ProgressBarProps) {
  const percentage = total > 0 ? Math.min(100, Math.max(0, Math.round((free / total) * 100))) : 0;
  const tier = getAvailabilityTier(free, total);

  // Gradient colors depending on capacity health
  const getGradient = () => {
    switch (tier) {
      case "high":
        return "from-emerald-500 to-teal-400";
      case "low":
        return "from-amber-500 to-orange-400";
      case "full":
        return "from-rose-600 to-rose-400";
    }
  };

  return (
    <div className="w-full space-y-1">
      {showLabels && (
        <div className="flex justify-between text-[11px] font-mono">
          <span className="text-neutral-400">Availability</span>
          <span className={tier === "full" ? "text-rose-400 font-bold" : "text-neutral-200"}>
            {free} / {total} free ({percentage}%)
          </span>
        </div>
      )}
      <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden relative">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className={`h-full rounded-full bg-gradient-to-r ${getGradient()}`}
        />
      </div>
    </div>
  );
}
