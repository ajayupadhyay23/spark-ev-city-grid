"use client";

/**
 * @file src/components/dashboard/AnalyticsCharts.tsx
 * @description Recharts data visualization suite for parking operator telemetry and revenue.
 * @purpose Illustrates 24-hour city occupancy curve, hourly revenue generation, and EV charger mix.
 * Styled with dark glass theme to match the cinematic dark background palette.
 * @connections
 * - Used in /src/app/dashboard/page.tsx
 * - Renders AreaChart, BarChart, and PieChart from recharts
 */

import React, { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// 24-hour city parking occupancy trend (%)
const OCCUPANCY_DATA = [
  { time: "00:00", occupancy: 22 },
  { time: "02:00", occupancy: 15 },
  { time: "04:00", occupancy: 12 },
  { time: "06:00", occupancy: 28 },
  { time: "08:00", occupancy: 58 },
  { time: "10:00", occupancy: 88 }, // Morning peak
  { time: "12:00", occupancy: 74 },
  { time: "14:00", occupancy: 68 },
  { time: "16:00", occupancy: 82 },
  { time: "18:00", occupancy: 94 }, // Evening peak
  { time: "20:00", occupancy: 86 },
  { time: "22:00", occupancy: 52 },
];

// Daily revenue breakdown (in thousands ₹)
const REVENUE_DATA = [
  { day: "Mon", parking: 48, ev: 26 },
  { day: "Tue", parking: 52, ev: 31 },
  { day: "Wed", parking: 55, ev: 34 },
  { day: "Thu", parking: 58, ev: 38 },
  { day: "Fri", parking: 74, ev: 49 },
  { day: "Sat", parking: 92, ev: 62 },
  { day: "Sun", parking: 84, ev: 58 },
];

// EV Charger connector standard distribution
const CHARGER_DISTRIBUTION = [
  { name: "CCS2 (150kW)", value: 45, color: "#00D2FF" },
  { name: "Type 2 (22kW)", value: 30, color: "#38BDF8" },
  { name: "GB/T Fleet", value: 15, color: "#F59E0B" },
  { name: "CHAdeMO", value: 10, color: "#EC4899" },
];

export default function AnalyticsCharts() {
  const [isMounted, setIsMounted] = useState(false);

  // Avoid SSR hydration issues with recharts ResponsiveContainer
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="h-64 rounded-2xl bg-white/5 border border-white/10 animate-pulse flex items-center justify-center text-xs font-mono text-neutral-500">
        Loading Telemetry Visualizations...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* 1. 24-Hour City-Wide Occupancy Trend (8 cols) */}
      <div className="lg:col-span-8 p-5 rounded-2xl bg-[#0e0e14]/90 border border-white/10 shadow-glass flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">24-Hour Occupancy Trajectory</h3>
            <p className="text-[11px] text-neutral-400 font-mono">
              Aggregated sensor capacity across all 35 Chandigarh facilities
            </p>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            PEAK: 94% AT 18:00
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={OCCUPANCY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="occupancyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00D2FF" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#00D2FF" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#232330" vertical={false} />
              <XAxis dataKey="time" stroke="#71717a" fontSize={10} fontStyle="monospace" />
              <YAxis stroke="#71717a" fontSize={10} fontStyle="monospace" tickFormatter={(v) => `${v}%`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0d0d14",
                  borderColor: "rgba(255,255,255,0.15)",
                  borderRadius: "12px",
                  fontSize: "11px",
                  fontFamily: "monospace",
                }}
              />
              <Area
                type="monotone"
                dataKey="occupancy"
                stroke="#00D2FF"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#occupancyGrad)"
                name="Occupancy %"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. EV Charger Connector Breakdown (4 cols) */}
      <div className="lg:col-span-4 p-5 rounded-2xl bg-[#0e0e14]/90 border border-white/10 shadow-glass flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-bold text-white">EV Charger Mix</h3>
          <p className="text-[11px] text-neutral-400 font-mono">
            Active power connector distribution
          </p>
        </div>

        <div className="h-56 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={CHARGER_DISTRIBUTION}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={4}
                dataKey="value"
              >
                {CHARGER_DISTRIBUTION.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#0e0e14" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0d0d14",
                  borderColor: "rgba(255,255,255,0.15)",
                  borderRadius: "12px",
                  fontSize: "11px",
                  fontFamily: "monospace",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-neutral-400 pt-2 border-t border-white/5">
          {CHARGER_DISTRIBUTION.map((item, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="truncate">{item.name} ({item.value}%)</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Weekly Revenue by Category (Full width 12 cols) */}
      <div className="lg:col-span-12 p-5 rounded-2xl bg-[#0e0e14]/90 border border-white/10 shadow-glass">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">Weekly Platform Revenue (₹ in Thousands)</h3>
            <p className="text-[11px] text-neutral-400 font-mono">
              Comparative split between standard vehicle parking and EV charging tariffs
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              Parking
            </span>
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              EV Power
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={REVENUE_DATA} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#232330" vertical={false} />
              <XAxis dataKey="day" stroke="#71717a" fontSize={11} fontStyle="monospace" />
              <YAxis stroke="#71717a" fontSize={10} fontStyle="monospace" tickFormatter={(v) => `₹${v}k`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0d0d14",
                  borderColor: "rgba(255,255,255,0.15)",
                  borderRadius: "12px",
                  fontSize: "11px",
                  fontFamily: "monospace",
                }}
              />
              <Bar dataKey="parking" name="Parking Fare (₹k)" fill="#FF7A00" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ev" name="EV Energy Tariff (₹k)" fill="#00D2FF" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
