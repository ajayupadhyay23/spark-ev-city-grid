/**
 * @file src/app/api/wallet/route.ts
 * @description Next.js Route Handler for digital wallet queries and balance top-ups.
 * @purpose Allows drivers to inspect their current wallet balance, view audit transaction logs,
 * and simulate instant balance top-ups with credit/debit card or UPI.
 * @connections
 * - Validated using /src/lib/validators.ts
 * - Reads/writes /src/lib/db.ts
 * - Consumed by /src/store/useWalletStore.ts and /src/components/payment/WalletForm.tsx
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserWalletRecord, topUpUserWallet } from "@/lib/db";
import { walletTopUpSchema } from "@/lib/validators";
import { DEFAULT_USER_ID } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || DEFAULT_USER_ID;

    const wallet = getUserWalletRecord(userId);

    return NextResponse.json({
      success: true,
      wallet,
    });
  } catch (error) {
    console.error("[GET /api/wallet] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch wallet information" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parseResult = walletTopUpSchema.safeParse(json);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid top-up request",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 422 }
      );
    }

    const { userId, amount, method } = parseResult.data;
    const updatedWallet = topUpUserWallet(
      userId,
      amount,
      `Simulated Wallet Top-Up via ${method.toUpperCase()}`
    );

    return NextResponse.json({
      success: true,
      message: `Successfully topped up ₹${amount} to your wallet.`,
      wallet: updatedWallet,
    });
  } catch (error) {
    console.error("[POST /api/wallet] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to top up wallet" },
      { status: 500 }
    );
  }
}
