"use client";

/**
 * @file src/app/wallet/page.tsx
 * @description Dedicated Driver Wallet page for balance tracking, instant top-ups, and transaction logs.
 * @purpose Allows drivers to maintain prepaid funds for seamless parking bay reservation and EV charging,
 * view audited transaction statements, and filter history by transaction type.
 *
 * @connections
 * - Reads from /src/store/useWalletStore.ts
 * - Calls /api/wallet
 * - Connected to navbar and booking checkout flows
 */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw,
  Plus,
  CreditCard,
  Shield,
  Clock,
  ArrowLeft,
  CheckCircle2,
  Filter,
  Loader2,
} from "lucide-react";
import { useWalletStore } from "@/store/useWalletStore";
import { showToast } from "@/components/ui/Toast";

export default function WalletPage() {
  const { wallet, isLoading, fetchWallet, topUpWallet } = useWalletStore();
  const [topUpAmount, setTopUpAmount] = useState<number>(500);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "topup" | "payment" | "refund">("all");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = customAmount ? parseFloat(customAmount) : topUpAmount;
    if (isNaN(amount) || amount <= 0) {
      showToast("Invalid Amount", "Please enter a valid top-up amount.", "error");
      return;
    }

    setIsSubmitting(true);
    const success = await topUpWallet(amount, "Quick In-App Top-up");
    setIsSubmitting(false);

    if (success) {
      showToast("Top-up Successful", `₹${amount} added to your wallet balance.`, "success");
      setCustomAmount("");
    } else {
      showToast("Top-up Failed", "Could not complete wallet transaction.", "error");
    }
  };

  const filteredTransactions = (wallet.transactions || []).filter((txn) => {
    if (selectedFilter === "all") return true;
    return txn.type === selectedFilter;
  });

  return (
    <div className="flex-1 pt-24 pb-16 px-4 max-w-4xl mx-auto w-full space-y-6">
      {/* Back button */}
      <Link
        href="/finder"
        className="inline-flex items-center gap-2 text-xs font-mono text-muted hover:text-text transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Grid Radar</span>
      </Link>

      {/* Hero Wallet Card */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-amber-600/20 via-surface to-surface border border-border shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -z-10" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
              <span className="text-xs font-mono uppercase tracking-wider text-muted font-bold">
                SPARK Prepaid Digital Wallet
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold font-mono text-text">
              ₹{wallet.balance.toFixed(2)}
            </h1>

            <p className="text-xs text-muted">
              Auto-debited for parking reservations, EV energy consumption, and gate entries.
            </p>
          </div>

          {/* Quick Top-up Form */}
          <form
            onSubmit={handleTopUp}
            className="p-4 rounded-2xl bg-surface-2 border border-border space-y-3 sm:w-72"
          >
            <span className="text-xs font-bold text-text block">Instant Balance Top-Up</span>

            <div className="grid grid-cols-3 gap-1.5">
              {[200, 500, 1000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    setTopUpAmount(amt);
                    setCustomAmount("");
                  }}
                  className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
                    topUpAmount === amt && !customAmount
                      ? "bg-rust text-white border-rust shadow-glow-rust"
                      : "bg-surface border-border text-muted hover:text-text"
                  }`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>

            <div className="relative">
              <span className="absolute left-3 top-2 text-xs text-muted font-mono">₹</span>
              <input
                type="number"
                min="10"
                max="10000"
                placeholder="Custom amount"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 rounded-xl bg-surface border border-border text-text text-xs focus:outline-none focus:border-rust font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 rounded-xl bg-rust hover:bg-rust-hover text-white text-xs font-semibold shadow-glow-rust flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Load Balance</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-rust" />
            <h2 className="font-bold text-sm text-text">Audit Transaction Log</h2>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 text-xs">
            {(["all", "topup", "payment", "refund"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setSelectedFilter(filter)}
                className={`px-2.5 py-1 rounded-lg capitalize transition-colors ${
                  selectedFilter === filter
                    ? "bg-surface border border-border text-text font-bold"
                    : "text-muted hover:text-text"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="p-8 rounded-2xl bg-surface border border-border text-center text-muted text-xs">
            No {selectedFilter !== "all" ? selectedFilter : ""} transactions found.
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTransactions.map((txn) => {
              const isCredit = txn.type === "topup" || txn.type === "refund";
              return (
                <div
                  key={txn.id}
                  className="p-3.5 rounded-xl bg-surface border border-border flex items-center justify-between text-xs transition-colors hover:border-rust/40"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isCredit
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>

                    <div>
                      <span className="font-bold text-text block">{txn.description}</span>
                      <span className="text-[10px] text-muted font-mono">
                        {format(new Date(txn.timestamp), "dd MMM yyyy, hh:mm a")} • Ref: {txn.id.slice(0, 12)}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`font-mono font-bold text-sm ${
                      isCredit ? "text-emerald-500" : "text-text"
                    }`}
                  >
                    {isCredit ? "+" : "-"}₹{txn.amount}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
