"use client";

/**
 * @file src/components/dashboard/SpotsAdminTable.tsx
 * @description Operator inventory table with live slot overrides and maintenance status toggles.
 * @purpose Simulates municipal operator control view, allowing admins to manually trigger barrier state,
 * increment/decrement free bays, and inspect live sensor telemetry.
 * @connections
 * - Used in /src/app/dashboard/page.tsx
 * - Updates /src/store/useAppStore.ts
 */

import React, { useState } from "react";
import { Spot } from "@/types";
import { Zap, Plus, Minus, Power, Search, MapPin } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { showToast } from "@/components/ui/Toast";

interface SpotsAdminTableProps {
  initialSpots: Spot[];
}

export default function SpotsAdminTable({ initialSpots }: SpotsAdminTableProps) {
  const [spots, setSpots] = useState<Spot[]>(initialSpots);
  const [search, setSearch] = useState("");
  const updateLiveCounts = useAppStore((state) => state.updateLiveCounts);

  // Manual slot capacity override
  const handleSlotDelta = (spotId: string, delta: number) => {
    setSpots((prev) =>
      prev.map((s) => {
        if (s.id === spotId) {
          const newFree = Math.max(0, Math.min(s.totalSlots, s.freeSlots + delta));
          updateLiveCounts({ [spotId]: newFree });
          return { ...s, freeSlots: newFree };
        }
        return s;
      })
    );
    showToast({
      type: "info",
      title: "Capacity Overridden",
      description: `Spot ${spotId} manual bay adjustment committed to sensor telemetry.`,
    });
  };

  const filtered = spots.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Search & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white">Facility Inventory Control</h3>
          <p className="text-xs text-neutral-400 font-mono">
            {spots.length} Total Monitored Nodes Across Chandigarh Urban Area
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-neutral-500" />
          <input
            type="text"
            placeholder="Filter facilities by name or sector..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      {/* Admin Table */}
      <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#0a0a0f]/90">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-white/5 text-[11px] font-mono uppercase text-neutral-400 border-b border-white/10">
              <tr>
                <th className="py-3 px-4">Facility Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Free / Total</th>
                <th className="py-3 px-4">Hourly / Tariff</th>
                <th className="py-3 px-4 text-center">Manual Bay Adjust</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {filtered.map((spot) => {
                const isEv = spot.type === "ev";
                const isFull = spot.freeSlots <= 0;

                return (
                  <tr key={spot.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* Name */}
                    <td className="py-3 px-4">
                      <span className="font-bold text-white block">{spot.name}</span>
                      <span className="text-[10px] text-neutral-500 flex items-center gap-1 font-sans">
                        <MapPin className="w-3 h-3" /> {spot.address}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold flex items-center gap-1 w-max ${
                          isEv
                            ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {isEv && <Zap className="w-3 h-3" />}
                        {isEv ? "EV Hub" : "Parking"}
                      </span>
                    </td>

                    {/* Slots */}
                    <td className="py-3 px-4">
                      <span className={isFull ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
                        {spot.freeSlots}
                      </span>
                      <span className="text-neutral-500"> / {spot.totalSlots}</span>
                    </td>

                    {/* Tariff */}
                    <td className="py-3 px-4 text-white">
                      ₹{isEv ? `${spot.pricing.perKwh}/kWh` : `${spot.pricing.perHour}/hr`}
                    </td>

                    {/* Overrides */}
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleSlotDelta(spot.id, -1)}
                          disabled={spot.freeSlots <= 0}
                          title="Occupy slot"
                          className="p-1 rounded bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 disabled:opacity-30"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-[11px] font-bold text-white min-w-[28px] text-center">
                          {spot.freeSlots}
                        </span>
                        <button
                          onClick={() => handleSlotDelta(spot.id, 1)}
                          disabled={spot.freeSlots >= spot.totalSlots}
                          title="Free slot"
                          className="p-1 rounded bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 disabled:opacity-30"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </td>

                    {/* Node Health */}
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
