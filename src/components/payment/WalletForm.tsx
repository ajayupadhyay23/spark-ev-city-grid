"use client";

/**
 * @file src/components/payment/WalletForm.tsx
 * @description Driver digital wallet balance viewer and instant top-up controller.
 * @purpose Renders the current simulated wallet balance and allows drivers to immediately top-up
 * funds in case of insufficient balance without interrupting their active reservation flow.
 * @connections
 * - Reads and mutates /src/store/useWalletStore.ts
 * - Used in /src/components/booking/StepPayment.tsx and /src/app/bookings/page.tsx
 */

import React, { useState } from "react";
import { Wallet, Plus, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { useWalletStore } from "@/store/useWalletStore";
import { showToast } from "@/components/ui/Toast";

interface WalletFormProps {
  requiredAmount?: number;
}

export default function WalletForm({ requiredAmount }: WalletFormProps) {
  const { wallet, topUp, isLoading } = useWalletStore();
  const [topUpAmount, setTopUpAmount] = useState<number>(500);

  const balance = wallet.balance;
  const isInsufficient = requiredAmount !== undefined && balance < requiredAmount;
  const shortfall = requiredAmount ? Math.max(0, requiredAmount - balance) : 0;

  const handleTopUp = async (amount: number) => {
    const success = await topUp(amount, "card");
    if (success) {
      showToast({
        type: "success",
        title: "Wallet Topped Up",
        description: `₹${amount} added successfully to your prepaid wallet balance.`,
      });
    }
  };

  return (
    <div className="space-y-4 text-xs text-neutral-300">
      {/* Wallet Balance Card */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-[#12121c] to-[#0a0a10] border border-white/10 flex items-center justify-between shadow-inner">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-glow-parking">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-mono uppercase text-neutral-400 block">
              Prepaid Wallet Balance
            </span>
            <span className="text-xl font-bold font-mono text-white">₹{balance}</span>
          </div>
        </div>

        {requiredAmount !== undefined && (
          <div className="text-right font-mono">
            <span className="text-[10px] text-neutral-400 block">Due Now</span>
            <span className="font-bold text-sm text-rust-light">₹{requiredAmount}</span>
          </div>
        )}
      </div>

      {/* Insufficient Balance Alert */}
      {isInsufficient && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <span className="font-semibold block">Insufficient Balance</span>
            <span className="text-[11px] text-amber-300/80">
              You need ₹{shortfall} more to complete this reservation. Top up instantly below:
            </span>
          </div>
        </div>
      )}

      {/* Instant Top-Up Preset Actions */}
      <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-2.5">
        <div className="flex justify-between items-center text-[11px] font-mono text-neutral-400">
          <span>Add Demo Balance</span>
          <span>Instant Credit</span>
        </div>

        <div className="grid grid-cols-4 gap-2 font-mono">
          {[100, 250, 500, 1000].map((amt) => (
            <button
              key={amt}
              type="button"
              disabled={isLoading}
              onClick={() => handleTopUp(amt)}
              className="py-2 px-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-neutral-200 hover:text-white text-center transition-colors font-bold disabled:opacity-50"
            >
              +₹{amt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
