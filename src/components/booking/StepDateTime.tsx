"use client";

/**
 * @file src/components/booking/StepDateTime.tsx
 * @description Step 1 of the booking wizard: Date, arrival time, parking duration, and target EV charging energy.
 * @purpose Enforces validation that chosen arrival time is not in the past and duration is between 1 and 24 hours.
 * @connections
 * - Used in /src/components/booking/BookingWizard.tsx
 */

import React from "react";
import { Clock, Calendar as CalendarIcon, Zap, AlertCircle } from "lucide-react";
import { Spot } from "@/types";

interface StepDateTimeProps {
  spot: Spot;
  startTime: string; // ISO string
  durationHours: number;
  targetKwh: number;
  onStartTimeChange: (val: string) => void;
  onDurationChange: (val: number) => void;
  onTargetKwhChange: (val: number) => void;
  error: string | null;
}

export default function StepDateTime({
  spot,
  startTime,
  durationHours,
  targetKwh,
  onStartTimeChange,
  onDurationChange,
  onTargetKwhChange,
  error,
}: StepDateTimeProps) {
  const isEv = spot.type === "ev";

  // Convert ISO string to format accepted by datetime-local input: YYYY-MM-DDTHH:MM
  const formatForInput = (iso: string) => {
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return "";
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const hours = String(d.getHours()).padStart(2, "0");
      const mins = String(d.getMinutes()).padStart(2, "0");
      return `${year}-${month}-${day}T${hours}:${mins}`;
    } catch {
      return "";
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      onStartTimeChange(new Date(val).toISOString());
    }
  };

  // Min datetime is current time rounded up to next 5 minutes
  const now = new Date();
  const minDateTime = formatForInput(now.toISOString());

  return (
    <div className="space-y-5 text-xs text-neutral-300">
      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Arrival Date & Time Input */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold flex items-center gap-1.5">
          <CalendarIcon className="w-3.5 h-3.5 text-rust" />
          <span>Arrival Date & Start Time</span>
        </label>
        <input
          type="datetime-local"
          min={minDateTime}
          value={formatForInput(startTime)}
          onChange={handleInputChange}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-rust"
        />
        <p className="text-[10px] text-neutral-500">
          Bookings must begin in the future. Past times are rejected.
        </p>
      </div>

      {/* Parking Duration Selector (1 - 24 hours) */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Duration of Stay</span>
          </label>
          <span className="font-mono font-bold text-white text-sm">
            {durationHours} {durationHours === 1 ? "Hour" : "Hours"}
          </span>
        </div>

        {/* Quick Duration Buttons */}
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {[1, 2, 3, 4, 8, 24].map((hours) => (
            <button
              key={hours}
              type="button"
              onClick={() => onDurationChange(hours)}
              className={`py-2 rounded-xl font-mono text-center transition-all ${
                durationHours === hours
                  ? "bg-rust text-white font-bold shadow-glow-rust"
                  : "bg-white/5 border border-white/10 text-neutral-400 hover:text-white"
              }`}
            >
              {hours}h
            </button>
          ))}
        </div>

        {/* Duration Range Slider */}
        <input
          type="range"
          min="1"
          max="24"
          step="1"
          value={durationHours}
          onChange={(e) => onDurationChange(Number(e.target.value))}
          className="w-full accent-rust cursor-pointer mt-2"
        />
      </div>

      {/* EV Charging Energy Requirement (Only for EV spots) */}
      {isEv && (
        <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-[11px] font-mono uppercase tracking-wider text-cyan-300 font-semibold flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Target Energy Top-Up</span>
            </label>
            <span className="font-mono font-bold text-cyan-300 text-sm">{targetKwh} kWh</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[15, 30, 45, 60].map((kwh) => (
              <button
                key={kwh}
                type="button"
                onClick={() => onTargetKwhChange(kwh)}
                className={`py-1.5 rounded-lg font-mono text-center transition-colors ${
                  targetKwh === kwh
                    ? "bg-cyan-500 text-neutral-950 font-bold"
                    : "bg-black/40 border border-cyan-500/30 text-cyan-400 hover:text-white"
                }`}
              >
                {kwh} kWh
              </button>
            ))}
          </div>

          <input
            type="range"
            min="5"
            max="100"
            step="5"
            value={targetKwh}
            onChange={(e) => onTargetKwhChange(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
          <p className="text-[10px] text-cyan-300/80">
            Estimated ~{(targetKwh * 5).toFixed(0)} km of driving range based on standard 5 km/kWh efficiency.
          </p>
        </div>
      )}
    </div>
  );
}
