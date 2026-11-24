"use client";

/**
 * @file src/components/booking/StepPricingSummary.tsx
 * @description Step 3 of the booking wizard: Detailed fare receipt and dynamic pricing breakdown.
 * @purpose Displays base parking fare, EV power tariff, 1.25x peak surge multiplier (if applicable),
 * 18% GST taxes, and platform service fee before the driver commits to payment.
 * @connections
 * - Used in /src/components/booking/BookingWizard.tsx
 * - Uses /src/lib/pricing.ts for price math
 */

import React from "react";
import { format } from "date-fns";
import { Spot, VehicleDetails } from "@/types";
import { calculateBookingPrice, formatCurrency } from "@/lib/pricing";
import { Zap, AlertTriangle, ShieldCheck, Clock } from "lucide-react";

interface StepPricingSummaryProps {
  spot: Spot;
  startTime: string; // ISO string
  durationHours: number;
  vehicle: VehicleDetails;
  targetKwh: number;
  selectedChargerPrice?: number;
}

export default function StepPricingSummary({
  spot,
  startTime,
  durationHours,
  vehicle,
  targetKwh,
  selectedChargerPrice,
}: StepPricingSummaryProps) {
  const startDate = new Date(startTime);
  const pricing = calculateBookingPrice(
    spot,
    startDate,
    durationHours,
    targetKwh,
    selectedChargerPrice
  );

  return (
    <div className="space-y-5 text-xs text-neutral-300">
      {/* Dynamic Peak Surge Warning (if active) */}
      {pricing.isPeak && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
          <div className="leading-snug">
            <span className="font-semibold text-amber-200 block">Peak Commute Surge Active (1.25x)</span>
            <span className="text-[11px] text-amber-300/80">
              High municipal traffic density between 09:00-12:00 and 17:00-21:00.
            </span>
          </div>
        </div>
      )}

      {/* Booking Snapshot Header */}
      <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
        <div className="flex justify-between items-center text-white">
          <span className="font-bold text-sm">{spot.name}</span>
          <span className="font-mono text-neutral-400 text-[11px]">
            {format(startDate, "MMM dd, yyyy")}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-400 font-mono border-t border-white/5 pt-2">
          <div>
            <span>Check-in: </span>
            <span className="text-white font-semibold">{format(startDate, "hh:mm a")}</span>
          </div>
          <div>
            <span>Duration: </span>
            <span className="text-white font-semibold">{durationHours} Hours</span>
          </div>
          <div>
            <span>Vehicle: </span>
            <span className="text-white font-semibold">{vehicle.plateNumber}</span>
          </div>
          <div>
            <span>Type: </span>
            <span className="text-white font-semibold">{vehicle.vehicleType}</span>
          </div>
        </div>
      </div>

      {/* Itemized Financial Breakdown */}
      <div className="rounded-xl border border-white/10 overflow-hidden divide-y divide-white/5 bg-black/30 font-mono">
        {/* Base Parking Charge */}
        <div className="p-3 flex justify-between items-center">
          <div>
            <span className="text-neutral-300">Base Parking Rate</span>
            <span className="text-[10px] text-neutral-500 block">
              ₹{spot.pricing.perHour}/hr × {durationHours} hr
            </span>
          </div>
          <span className="text-white">₹{spot.pricing.perHour * durationHours}</span>
        </div>

        {/* EV Electricity Tariff (if applicable) */}
        {pricing.evEnergyCharge && (
          <div className="p-3 flex justify-between items-center bg-cyan-950/10">
            <div>
              <span className="text-cyan-300 flex items-center gap-1">
                <Zap className="w-3 h-3 text-cyan-400" />
                EV Energy Top-Up
              </span>
              <span className="text-[10px] text-neutral-400 block">
                {targetKwh} kWh @ ₹{selectedChargerPrice || spot.pricing.perKwh}/kWh
              </span>
            </div>
            <span className="text-cyan-300 font-bold">₹{pricing.evEnergyCharge}</span>
          </div>
        )}

        {/* Surge pricing adjustment */}
        {pricing.isPeak && (
          <div className="p-3 flex justify-between items-center text-amber-300">
            <span>Peak Demand Multiplier</span>
            <span>+25%</span>
          </div>
        )}

        {/* Subtotal */}
        <div className="p-3 flex justify-between items-center text-neutral-400">
          <span>Subtotal Fare</span>
          <span className="text-white">₹{pricing.subtotal}</span>
        </div>

        {/* 18% GST */}
        <div className="p-3 flex justify-between items-center text-neutral-400">
          <div>
            <span>GST (18% Standard)</span>
            <span className="text-[10px] text-neutral-500 block">Goods & Services Tax</span>
          </div>
          <span className="text-white">₹{pricing.taxes}</span>
        </div>

        {/* Platform Convenience Fee */}
        <div className="p-3 flex justify-between items-center text-neutral-400">
          <div>
            <span>Convenience & Sensor Fee</span>
            <span className="text-[10px] text-neutral-500 block">IoT Bay Reservation Service</span>
          </div>
          <span className="text-white">₹{pricing.serviceFee}</span>
        </div>

        {/* Grand Total */}
        <div className="p-4 flex justify-between items-center bg-rust/10 border-t border-rust/30">
          <span className="font-bold text-white text-sm font-sans">Total Payable</span>
          <span className="font-bold text-rust-light text-lg">
            {formatCurrency(pricing.totalAmount)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[10px] text-neutral-400">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>
          100% full refund policy applies if cancelled &gt; 60 minutes before start time.
        </span>
      </div>
    </div>
  );
}
