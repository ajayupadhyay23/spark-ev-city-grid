"use client";

/**
 * @file src/components/payment/UpiForm.tsx
 * @description Simulated Unified Payments Interface (UPI) form with quick-fill VPA handles.
 * @purpose Lets drivers pay via simulated UPI apps (Google Pay, PhonePe, Paytm, BHIM).
 * Validates virtual payment address (VPA) syntax and provides fast autofill handle chips.
 * @connections
 * - Used in /src/components/booking/StepPayment.tsx
 */

import React, { useState } from "react";
import { Smartphone, CheckCircle2 } from "lucide-react";

interface UpiFormProps {
  onUpiValidChange: (isValid: boolean, upiId: string) => void;
}

const COMMON_HANDLES = ["@okhdfcbank", "@oksbi", "@paytm", "@ybl", "@ibl"];

export default function UpiForm({ onUpiValidChange }: UpiFormProps) {
  const [upiId, setUpiId] = useState("driver@okhdfcbank");

  const validateUpi = (val: string) => {
    // Standard VPA check: username@bank
    const isValid = /^[a-zA-Z0-9.\-_]{2,49}@[a-zA-Z]{2,}$/.test(val.trim());
    onUpiValidChange(isValid, val.trim());
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUpiId(val);
    validateUpi(val);
  };

  const handleAppendHandle = (handle: string) => {
    const prefix = upiId.split("@")[0] || "driver";
    const full = `${prefix}${handle}`;
    setUpiId(full);
    validateUpi(full);
  };

  return (
    <div className="space-y-4 text-xs text-neutral-300">
      <div className="space-y-1.5">
        <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold flex items-center justify-between">
          <span>UPI Virtual Payment Address (VPA)</span>
          <span className="text-emerald-400 text-[10px] flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Auto-collect prompt
          </span>
        </label>
        <div className="relative">
          <Smartphone className="absolute left-3 top-3 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="username@okhdfcbank"
            value={upiId}
            onChange={handleChange}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Quick Handle Chips */}
      <div className="space-y-1">
        <span className="text-[10px] text-neutral-500 font-mono">Popular handles:</span>
        <div className="flex flex-wrap gap-1.5">
          {COMMON_HANDLES.map((handle) => (
            <button
              key={handle}
              type="button"
              onClick={() => handleAppendHandle(handle)}
              className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono text-neutral-400 hover:text-white hover:border-white/30 transition-colors"
            >
              {handle}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
