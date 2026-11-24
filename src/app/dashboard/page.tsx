"use client";

/**
 * @file src/app/dashboard/page.tsx
 * @description Municipal Parking & EV Operator Dashboard with real-time analytics and controls.
 * @purpose Provides municipal authorities and lot operators with city-wide telemetry, occupancy curves,
 * revenue projections, and manual bay override capabilities.
 * @connections
 * - Renders /src/components/dashboard/... components
 * - Pulls seed data and live metrics from /src/hooks/useLiveAvailability.ts
 */

import React, { useEffect, useState } from "react";
import {
  BarChart3,
  Car,
  Zap,
  TrendingUp,
  DollarSign,
  Layers,
  RefreshCw,
  Sliders,
} from "lucide-react";
import { useLiveAvailability } from "@/hooks/useLiveAvailability";
import StatCard from "@/components/dashboard/StatCard";
import AnalyticsCharts from "@/components/dashboard/AnalyticsCharts";
import SpotsAdminTable from "@/components/dashboard/SpotsAdminTable";
import { Spot } from "@/types";

export default function OperatorDashboardPage() {
  const { stats, isUpdating } = useLiveAvailability();
  const [spots, setSpots] = useState<Spot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSpots() {
      try {
        const res = await fetch("/api/spots");
        const data = await res.json();
        if (data.success && data.spots) {
          setSpots(data.spots);
        }
      } catch (err) {
        console.warn("Error fetching operator spots:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSpots();
  }, []);

  return (
    <div className="flex-1 pt-24 pb-16 px-4 max-w-7xl mx-auto w-full space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold font-sans text-white">
              Municipal Grid Command
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              OPERATOR SUITE
            </span>
            {isUpdating && (
              <span className="text-[10px] text-cyan-300 font-mono flex items-center gap-1 animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin" /> Stream Synced
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-400 font-mono mt-1">
            Live telemetry telemetry from 35 IoT sensory arrays in Chandigarh Metropolitan Area
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-neutral-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Sensor Health: 99.8%
          </span>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Monitored Bays"
          value={stats.totalSpots}
          icon={Layers}
          trend="+120 bays onboarded this week"
          trendPositive={true}
          accentColor="amber"
        />

        <StatCard
          title="Current Vacant Slots"
          value={stats.freeSpots}
          icon={Car}
          trend="Occupancy rate: ~66%"
          trendPositive={true}
          accentColor="emerald"
        />

        <StatCard
          title="Active EV Plugs Online"
          value={stats.chargersOnline}
          icon={Zap}
          trend="OCPP 2.0.1 protocol steady"
          trendPositive={true}
          accentColor="cyan"
        />

        <StatCard
          title="Est. Daily Gross"
          value={84500}
          prefix="₹"
          icon={DollarSign}
          trend="+18.4% vs last Thursday"
          trendPositive={true}
          accentColor="rust"
        />
      </div>

      {/* Analytics Visualizations Suite */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold font-sans text-white">Live Grid Telemetry Analytics</h2>
          <p className="text-xs text-neutral-400 font-mono">
            Dynamic surge curves, peak hour distribution, and EV power tariffs
          </p>
        </div>

        <AnalyticsCharts />
      </div>

      {/* Operator Inventory Override Table */}
      <div className="space-y-4 pt-6 border-t border-white/10">
        {!isLoading && <SpotsAdminTable initialSpots={spots} />}
      </div>
    </div>
  );
}
