"use client";

/**
 * @file src/components/booking/StepPayment.tsx
 * @description Step 4 of the booking wizard: Payment method selection, execution, and error handling.
 * @purpose Simulates payment processing with loading animation, 10% random rejection simulation,
 * and immediate retry capability as requested in the specification.
 * @connections
 * - Used in /src/components/booking/BookingWizard.tsx
 * - Renders WalletForm, CardForm, and UpiForm
 */

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Wallet, CreditCard, Smartphone, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { PaymentMethod } from "@/types";
import CardForm from "@/components/payment/CardForm";
import UpiForm from "@/components/payment/UpiForm";
import WalletForm from "@/components/payment/WalletForm";
import { useWalletStore } from "@/store/useWalletStore";

interface StepPaymentProps {
  totalAmount: number;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  isProcessing: boolean;
  paymentError: string | null;
  onRetry: () => void;
}

export default function StepPayment({
  totalAmount,
  paymentMethod,
  onPaymentMethodChange,
  isProcessing,
  paymentError,
  onRetry,
}: StepPaymentProps) {
  const wallet = useWalletStore((state) => state.wallet);
  const [isCardValid, setIsCardValid] = useState(false);
  const [isUpiValid, setIsUpiValid] = useState(true);

  return (
    <div className="space-y-5 text-xs text-neutral-300">
      {/* Simulated Gateway Network Error Banner with Retry */}
      {paymentError && (
        <motion.div
          initial={{ scale: 0.95, x: -6 }}
          animate={{ scale: 1, x: [0, -6, 6, -4, 4, 0] }}
          transition={{ duration: 0.4 }}
          className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 space-y-2"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Payment Simulated Exception</span>
              <span className="text-[11px] text-rose-300/80">{paymentError}</span>
            </div>
          </div>

          <button
            onClick={onRetry}
            className="w-full py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Simulated Payment</span>
          </button>
        </motion.div>
      )}

      {/* Payment Method Selector Tab Pills */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          disabled={isProcessing}
          onClick={() => onPaymentMethodChange("wallet")}
          className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-center font-mono transition-all ${
            paymentMethod === "wallet"
              ? "bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-glow-parking"
              : "bg-white/5 border-white/10 text-neutral-400 hover:text-white"
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span className="font-bold text-xs">Wallet</span>
          <span className="text-[10px] text-neutral-400">₹{wallet.balance}</span>
        </button>

        <button
          type="button"
          disabled={isProcessing}
          onClick={() => onPaymentMethodChange("card")}
          className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-center font-mono transition-all ${
            paymentMethod === "card"
              ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-glow-ev"
              : "bg-white/5 border-white/10 text-neutral-400 hover:text-white"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span className="font-bold text-xs">Card</span>
          <span className="text-[10px] text-neutral-400">Credit / Debit</span>
        </button>

        <button
          type="button"
          disabled={isProcessing}
          onClick={() => onPaymentMethodChange("upi")}
          className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-center font-mono transition-all ${
            paymentMethod === "upi"
              ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-sm"
              : "bg-white/5 border-white/10 text-neutral-400 hover:text-white"
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span className="font-bold text-xs">UPI</span>
          <span className="text-[10px] text-neutral-400">GPay, PhonePe</span>
        </button>
      </div>

      {/* Selected Payment Form Body */}
      <div className="pt-2">
        {paymentMethod === "wallet" && <WalletForm requiredAmount={totalAmount} />}
        {paymentMethod === "card" && (
          <CardForm onCardValidChange={(valid) => setIsCardValid(valid)} />
        )}
        {paymentMethod === "upi" && (
          <UpiForm onUpiValidChange={(valid) => setIsUpiValid(valid)} />
        )}
      </div>

      {/* Loading Overlay when payment is processing */}
      {isProcessing && (
        <div className="p-4 rounded-xl bg-black/60 border border-white/10 backdrop-blur-md flex flex-col items-center justify-center gap-2 text-center">
          <Loader2 className="w-6 h-6 text-rust animate-spin" />
          <span className="text-white font-semibold">Contacting Bank Gateway...</span>
          <span className="text-[10px] text-neutral-400 font-mono">
            Verifying token with simulated reserve node
          </span>
        </div>
      )}
    </div>
  );
}
