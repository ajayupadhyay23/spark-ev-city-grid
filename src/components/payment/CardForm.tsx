"use client";

/**
 * @file src/components/payment/CardForm.tsx
 * @description Simulated credit/debit card form with Luhn algorithm validation and real-time formatting.
 * @purpose Formats card numbers into 4-digit chunks as user types and executes checksum verification.
 * Clearly displays a DEMO SANDBOX indicator so drivers know real money is never charged.
 * @connections
 * - Used in /src/components/booking/StepPayment.tsx
 * - Uses validateLuhnCardNumber from /src/lib/validators.ts
 */

import React, { useState } from "react";
import { CreditCard, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { validateLuhnCardNumber } from "@/lib/validators";

interface CardFormProps {
  onCardValidChange: (isValid: boolean, cardNumber: string) => void;
}

export default function CardForm({ onCardValidChange }: CardFormProps) {
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [touched, setTouched] = useState(false);

  // Auto-format card number into 4-digit groups (e.g. 4532 1234 5678 9010)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = raw.replace(/(\d{4})/g, "$1 ").trim();
    setCardNumber(formatted);

    const isValidLuhn = validateLuhnCardNumber(raw);
    onCardValidChange(isValidLuhn && expiry.length === 5 && cvv.length >= 3, raw);
  };

  // Auto-format MM/YY expiry
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (raw.length >= 3) {
      raw = `${raw.slice(0, 2)}/${raw.slice(2)}`;
    }
    setExpiry(raw);
    const cleanCard = cardNumber.replace(/\D/g, "");
    onCardValidChange(validateLuhnCardNumber(cleanCard) && raw.length === 5 && cvv.length >= 3, cleanCard);
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    setCvv(raw);
    const cleanCard = cardNumber.replace(/\D/g, "");
    onCardValidChange(validateLuhnCardNumber(cleanCard) && expiry.length === 5 && raw.length >= 3, cleanCard);
  };

  const cleanNum = cardNumber.replace(/\D/g, "");
  const isLuhnValid = cleanNum.length >= 13 ? validateLuhnCardNumber(cleanNum) : false;

  return (
    <div className="space-y-4 text-xs">
      {/* Demo Sandbox Alert Pill */}
      <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-cyan-300 flex items-center justify-between text-[11px] font-mono">
        <span className="flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-cyan-400" />
          TEST MODE: 0.00 REAL CHARGE
        </span>
        <span className="text-[10px] text-cyan-400/80">Luhn Verified</span>
      </div>

      {/* Card Number Input */}
      <div className="space-y-1">
        <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold flex items-center justify-between">
          <span>Card Number</span>
          {cleanNum.length >= 13 && (
            <span className={isLuhnValid ? "text-emerald-400 flex items-center gap-1" : "text-rose-400 flex items-center gap-1"}>
              {isLuhnValid ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
              {isLuhnValid ? "Valid Luhn Card" : "Invalid Checksum"}
            </span>
          )}
        </label>
        <div className="relative">
          <CreditCard className="absolute left-3 top-3 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="4532 •••• •••• 9010"
            value={cardNumber}
            onChange={handleCardNumberChange}
            onBlur={() => setTouched(true)}
            className={`w-full bg-white/5 border rounded-xl pl-9 pr-3 py-2.5 text-white font-mono text-sm tracking-wider focus:outline-none ${
              touched && cleanNum.length >= 13 && !isLuhnValid
                ? "border-rose-500/50 focus:border-rose-400"
                : "border-white/10 focus:border-cyan-400"
            }`}
          />
        </div>
      </div>

      {/* Expiry and CVV in split columns */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold">
            Expires (MM/YY)
          </label>
          <input
            type="text"
            placeholder="12/28"
            value={expiry}
            onChange={handleExpiryChange}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold">
            CVV / CVC
          </label>
          <input
            type="password"
            placeholder="•••"
            maxLength={4}
            value={cvv}
            onChange={handleCvvChange}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      {/* Cardholder Name */}
      <div className="space-y-1">
        <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold">
          Name on Card
        </label>
        <input
          type="text"
          placeholder="e.g. Vikram Sharma"
          value={cardHolder}
          onChange={(e) => setCardHolder(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-400"
        />
      </div>
    </div>
  );
}
