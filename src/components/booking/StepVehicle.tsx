"use client";

/**
 * @file src/components/booking/StepVehicle.tsx
 * @description Step 2 of the booking wizard: Vehicle registration plate, type, and specific charger selection.
 * @purpose Captures vehicle metadata required by municipal automated barrier gates and validates connector match.
 * @connections
 * - Used in /src/components/booking/BookingWizard.tsx
 */

import React from "react";
import { Car, Zap, Shield, AlertCircle } from "lucide-react";
import { Charger, ChargerType, Spot, VehicleDetails } from "@/types";
import { formatPlateNumber } from "@/lib/utils";

interface StepVehicleProps {
  spot: Spot;
  vehicle: VehicleDetails;
  selectedChargerId?: string;
  onVehicleChange: (updates: Partial<VehicleDetails>) => void;
  onChargerSelect: (chargerId: string, connectorType?: ChargerType) => void;
  error: string | null;
}

export default function StepVehicle({
  spot,
  vehicle,
  selectedChargerId,
  onVehicleChange,
  onChargerSelect,
  error,
}: StepVehicleProps) {
  const isEv = spot.type === "ev";

  return (
    <div className="space-y-5 text-xs text-neutral-300">
      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Vehicle Plate Number */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold flex items-center justify-between">
          <span>License Plate Registration</span>
          <span className="text-neutral-500 text-[10px]">e.g. CH01AB1234</span>
        </label>
        <input
          type="text"
          placeholder="CH 01 AB 1234"
          value={vehicle.plateNumber}
          onChange={(e) =>
            onVehicleChange({
              plateNumber: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""),
            })
          }
          maxLength={12}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white font-mono text-sm tracking-wider uppercase font-bold focus:outline-none focus:border-rust"
        />
        <p className="text-[10px] text-neutral-500">
          Scanned by optical plate recognition (ANPR) cameras at the entrance barrier.
        </p>
      </div>

      {/* Vehicle Category */}
      <div className="space-y-2">
        <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold">
          Vehicle Classification
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(["Car", "SUV", "Two-Wheeler", "Commercial"] as const).map((vType) => (
            <button
              key={vType}
              type="button"
              onClick={() => onVehicleChange({ vehicleType: vType })}
              className={`py-2 px-2 rounded-xl text-center font-medium transition-all ${
                vehicle.vehicleType === vType
                  ? "bg-rust text-white font-bold shadow-glow-rust"
                  : "bg-white/5 border border-white/10 text-neutral-400 hover:text-white"
              }`}
            >
              {vType}
            </button>
          ))}
        </div>
      </div>

      {/* Optional Vehicle Model */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold">
          Make & Model (Optional)
        </label>
        <input
          type="text"
          placeholder="e.g. Tata Nexon EV, Hyundai Ioniq 5, Creta"
          value={vehicle.modelName || ""}
          onChange={(e) => onVehicleChange({ modelName: e.target.value })}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-white/30"
        />
      </div>

      {/* For EV Stations: Select Specific Available Charger Connector */}
      {isEv && spot.chargers && spot.chargers.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-white/10">
          <label className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-semibold flex items-center justify-between">
            <span>Select Available Charging Plug</span>
            <span className="text-neutral-500 font-normal">Choose compatible connector</span>
          </label>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {spot.chargers.map((c) => {
              const isOccupied = c.status !== "available";
              const isSelected = selectedChargerId === c.id;

              return (
                <button
                  key={c.id}
                  type="button"
                  disabled={isOccupied}
                  onClick={() => onChargerSelect(c.id, c.type)}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between font-mono transition-all ${
                    isOccupied
                      ? "opacity-40 cursor-not-allowed bg-black/20 border-white/5"
                      : isSelected
                      ? "bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-glow-ev"
                      : "bg-white/[0.03] border-white/10 text-neutral-300 hover:border-white/30"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Zap className={`w-4 h-4 ${isSelected ? "text-cyan-400" : "text-neutral-500"}`} />
                    <div>
                      <span className="font-bold text-xs">{c.type}</span>
                      <span className="text-[10px] text-neutral-400 ml-2">({c.powerKw} kW • {c.speed})</span>
                    </div>
                  </div>

                  <div className="text-right text-[11px]">
                    <span className={isOccupied ? "text-rose-400" : "text-emerald-400"}>
                      {c.status.toUpperCase()}
                    </span>
                    <span className="text-neutral-400 ml-2">₹{c.pricePerKwh}/kWh</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
