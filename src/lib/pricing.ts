/**
 * @file src/lib/pricing.ts
 * @description Dynamic pricing algorithms, tax computations, and refund policy calculations.
 * @purpose Encapsulates all financial math in one tested place so calculations in UI previews
 * match the exact final charge calculated by the backend API routes.
 * @connections
 * - Used by /src/components/booking/StepPricingSummary.tsx to show real-time fare estimates
 * - Used by /src/app/api/reservations/route.ts to compute official invoice amounts
 * - Used by /src/app/api/reservations/[id]/route.ts to calculate cancellation refund values
 */

import {
  FULL_REFUND_THRESHOLD_MINUTES,
  GST_TAX_RATE,
  PEAK_HOUR_MULTIPLIER,
  PEAK_HOURS,
  PLATFORM_SERVICE_FEE,
} from "./constants";
import { Spot } from "@/types";
import { differenceInMinutes } from "date-fns";

export interface ComputedPricing {
  baseAmount: number;
  peakMultiplier: number;
  subtotal: number;
  taxes: number;
  serviceFee: number;
  totalAmount: number;
  isPeak: boolean;
  evEnergyCharge?: number;
}

/**
 * Checks whether a given timestamp falls into defined city peak demand traffic hours.
 * WHY: Urban parking demand spikes in morning (9-12) and evening (17-21) commutes.
 * Dynamic surge pricing balances lot occupancy across the municipality.
 */
export function isPeakHour(date: Date): boolean {
  const hour = date.getHours();
  return PEAK_HOURS.some((range) => hour >= range.start && hour < range.end);
}

/**
 * Calculates complete pricing breakdown for a proposed booking.
 * @param spot The parking lot or EV station record
 * @param startTime Date when parking session begins
 * @param durationHours How many hours driver intends to park
 * @param targetKwh Optional EV charging energy requested
 * @param chargerPrice Optional per-kWh price of the chosen charger
 */
export function calculateBookingPrice(
  spot: Spot,
  startTime: Date,
  durationHours: number,
  targetKwh?: number,
  chargerPrice?: number
): ComputedPricing {
  const hourlyRate = spot.pricing.perHour;
  let baseAmount = hourlyRate * durationHours;

  // Add EV energy consumption cost if requested
  let evEnergyCharge = 0;
  if (targetKwh && targetKwh > 0) {
    const kwhRate = chargerPrice ?? spot.pricing.perKwh ?? 15;
    evEnergyCharge = Math.round(targetKwh * kwhRate);
    baseAmount += evEnergyCharge;
  }

  // Determine peak hour surge multiplier
  const peak = isPeakHour(startTime);
  const peakMultiplier = peak ? PEAK_HOUR_MULTIPLIER : 1.0;

  // Apply peak surge to base parking amount
  const subtotal = Math.round(baseAmount * peakMultiplier);

  // Compute 18% GST on subtotal
  const taxes = Math.round(subtotal * GST_TAX_RATE);

  // Platform convenience fee
  const serviceFee = PLATFORM_SERVICE_FEE;

  // Grand total in whole Rupees
  const totalAmount = subtotal + taxes + serviceFee;

  return {
    baseAmount,
    peakMultiplier,
    subtotal,
    taxes,
    serviceFee,
    totalAmount,
    isPeak: peak,
    evEnergyCharge: evEnergyCharge > 0 ? evEnergyCharge : undefined,
  };
}

/**
 * Computes eligible refund amount when a driver cancels an existing booking.
 * Business Rule:
 * - If cancelled > 60 minutes prior to start time: 100% full refund of totalAmount.
 * - If cancelled <= 60 minutes prior or during booking: refund subtotal only (retains service fee & tax).
 */
export function calculateCancellationRefund(
  totalAmount: number,
  serviceFee: number,
  startTimeISO: string
): { refundAmount: number; isFullRefund: boolean; minutesUntilStart: number } {
  const now = new Date();
  const start = new Date(startTimeISO);
  const minutesUntilStart = differenceInMinutes(start, now);

  if (minutesUntilStart > FULL_REFUND_THRESHOLD_MINUTES) {
    return {
      refundAmount: totalAmount,
      isFullRefund: true,
      minutesUntilStart,
    };
  }

  // Late cancellation retains the platform convenience fee
  const lateRefund = Math.max(0, totalAmount - serviceFee);
  return {
    refundAmount: lateRefund,
    isFullRefund: false,
    minutesUntilStart,
  };
}

/**
 * Formats a numerical value as Indian Rupee currency (₹).
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
