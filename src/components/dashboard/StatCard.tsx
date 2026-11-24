"use client";

/**
 * @file src/components/dashboard/StatCard.tsx
 * @description Metric statistic card with count-up animation and trend indicator.
 * @purpose Renders high-level KPIs on the operator dashboard (Occupancy, Revenue, EV uptime).
 * @connections
 * - Used in /src/app/dashboard/page.tsx
 * - Uses useCountUp from /src/hooks/useCountUp.ts
 */

import React from "react";
import { LucideIcon } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";

interface StatCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon: LucideIcon;
  trend?: string;
  trendPositive?: boolean;
  accentColor?: "rust" | "cyan" | "amber" | "emerald";
}

export default function StatCard({
  title,
  value,
  prefix = "",
  suffix = "",
  icon: Icon,
  trend,
  trendPositive = true,
  accentColor = "rust",
}: StatCardProps) {
  const animatedValue = useCountUp(value, 1600);

  const getBorder = () => {
    switch (accentColor) {
      case "cyan":
        return "border-cyan-500/30 text-cyan-400 bg-cyan-950/10";
      case "amber":
        return "border-amber-500/30 text-amber-400 bg-amber-950/10";
      case "emerald":
        return "border-emerald-500/30 text-emerald-400 bg-emerald-950/10";
      default:
        return "border-rust/30 text-rust bg-rust/10";
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-[#0e0e14]/90 border border-white/10 backdrop-blur-md shadow-glass flex flex-col justify-between space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">
          {title}
        </span>
        <div className={`p-2 rounded-xl border ${getBorder()}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div>
        <p className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
          {prefix}
          {animatedValue.toLocaleString()}
          {suffix}
        </p>

        {trend && (
          <p
            className={`text-[11px] font-mono mt-1 ${
              trendPositive ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {trend}
          </p>
        )}
      </div>
    </div>
  );
}
