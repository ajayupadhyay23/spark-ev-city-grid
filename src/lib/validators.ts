/**
 * @file src/lib/validators.ts
 * @description Centralized schema validation using Zod and card verification using the Luhn algorithm.
 * @purpose Enforces strict runtime data safety for all incoming API route payloads and frontend forms.
 * Catches invalid inputs (e.g., negative duration, invalid connector, non-existent payment methods) early.
 * @connections
 * - Used by /src/app/api/reservations/route.ts to validate new bookings
 * - Used by /src/app/api/payments/route.ts to validate payment simulations
 * - Used by /src/app/api/wallet/route.ts to validate wallet top-ups
 * - Used by /src/components/payment/CardForm.tsx to validate credit/debit card numbers
 */

import { z } from "zod";

// Schema for creating a new spot reservation
export const createReservationSchema = z.object({
  spotId: z.string().min(1, "Spot ID is required"),
  userId: z.string().min(1, "User ID is required"),
  startTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid start time format (must be valid ISO string)",
  }),
  durationHours: z.number().int().min(1, "Minimum duration is 1 hour").max(24, "Maximum duration is 24 hours"),
  vehicle: z.object({
    plateNumber: z
      .string()
      .min(4, "Vehicle plate number must be at least 4 characters")
      .max(15, "Vehicle plate number is too long")
      .transform((val) => val.toUpperCase().trim()),
    vehicleType: z.enum(["Car", "SUV", "Two-Wheeler", "Commercial"]),
    modelName: z.string().optional(),
    connectorType: z.enum(["Type 2", "CCS2", "CHAdeMO", "GB/T"]).optional(),
  }),
  chargerId: z.string().optional(),
  targetKwh: z.number().min(1).max(150).optional(),
  paymentMethod: z.enum(["wallet", "card", "upi"]),
});

// Schema for updating/cancelling a reservation
export const updateReservationSchema = z.object({
  action: z.enum(["cancel", "extend"]),
  additionalHours: z.number().int().min(1).max(12).optional(),
});

// Schema for simulating a digital payment transaction
export const paymentProcessSchema = z.object({
  reservationId: z.string().min(1, "Reservation ID is required"),
  amount: z.number().positive("Amount must be greater than zero"),
  method: z.enum(["wallet", "card", "upi"]),
  paymentDetails: z
    .object({
      cardNumber: z.string().optional(),
      upiId: z.string().optional(),
      walletUserId: z.string().optional(),
    })
    .optional(),
});

// Schema for wallet top-up transactions
export const walletTopUpSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  amount: z.number().min(10, "Minimum wallet top-up is ₹10").max(10000, "Maximum top-up is ₹10,000"),
  method: z.enum(["card", "upi"]),
});

/**
 * Validates a credit or debit card number using the Luhn Algorithm (Mod 10).
 * WHY: This is the industry-standard checksum formula used by Visa, MasterCard, Amex, etc.
 * It lets us perform real client-side validation without calling external payment APIs.
 */
export function validateLuhnCardNumber(cardNumber: string): boolean {
  // Strip all non-digit characters (spaces, dashes)
  const cleanNumber = cardNumber.replace(/\D/g, "");

  // Most valid cards are between 13 and 19 digits
  if (cleanNumber.length < 13 || cleanNumber.length > 19) {
    return false;
  }

  let sum = 0;
  let shouldDouble = false;

  // Loop from right to left
  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber.charAt(i), 10);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  // If the total modulo 10 is equal to 0, the card number is valid
  return sum % 10 === 0;
}
