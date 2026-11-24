/**
 * @file src/app/api/payments/route.ts
 * @description Next.js Route Handler simulating a digital payment gateway (UPI, Card, Wallet).
 * @purpose Emulates payment gateway latency, random 10% failure simulation, and card verification
 * without moving actual money or requiring Stripe/Razorpay merchant credentials.
 * @connections
 * - Validated with Zod via /src/lib/validators.ts
 * - Used by /src/components/booking/StepPayment.tsx
 */

import { NextRequest, NextResponse } from "next/server";
import { paymentProcessSchema, validateLuhnCardNumber } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parseResult = paymentProcessSchema.safeParse(json);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid payment payload",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 422 }
      );
    }

    const { amount, method, paymentDetails } = parseResult.data;

    // Validate Card format if paying by Card
    if (method === "card" && paymentDetails?.cardNumber) {
      const isValid = validateLuhnCardNumber(paymentDetails.cardNumber);
      if (!isValid) {
        return NextResponse.json(
          {
            success: false,
            error: "Card checksum validation failed. Please check your 16-digit card number.",
          },
          { status: 400 }
        );
      }
    }

    // Emulate 10% random payment network timeout/failure requirement
    const shouldFail = Math.random() < 0.1;
    if (shouldFail) {
      return NextResponse.json(
        {
          success: false,
          error: "Simulated bank gateway timeout. Please retry your payment.",
          canRetry: true,
        },
        { status: 502 }
      );
    }

    // Success response
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    return NextResponse.json({
      success: true,
      transactionId,
      amount,
      method,
      status: "paid",
      timestamp: new Date().toISOString(),
      message: "Simulated payment processed successfully (DEMO MODE: No actual funds charged).",
    });
  } catch (error) {
    console.error("[POST /api/payments] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal payment processing error" },
      { status: 500 }
    );
  }
}
