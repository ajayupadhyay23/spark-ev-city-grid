/**
 * @file src/app/api/operator/customers/route.ts
 * @description Operator customer administration API with Zod validation.
 * @purpose Allows municipal operators to query registered drivers, inspect their profile,
 * fleet, wallet balances, total spend, and toggle account suspension or grant wallet credit.
 *
 * @connections
 * - Protected by getServerAuthSession() (role: operator only)
 * - Interacts with /src/lib/users.ts and /src/lib/db.ts
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerAuthSession } from "@/lib/auth";
import { getAllCustomers, setCustomerStatus } from "@/lib/users";
import {
  getAllReservations,
  getUserWalletRecord,
  topUpUserWallet,
  addAuditLog,
} from "@/lib/db";

const customerActionSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  action: z.enum(["toggle_status", "grant_credit"]),
  status: z.enum(["active", "suspended"]).optional(),
  creditAmount: z.number().positive().max(10000).optional(),
  reason: z.string().optional(),
});

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (session?.user?.role !== "operator") {
      return NextResponse.json(
        { success: false, error: "Access Forbidden: Operator credentials required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.toLowerCase().trim();

    const customers = await getAllCustomers();
    const allBookings = getAllReservations();

    // Enrich each customer with real wallet balance and spend stats
    const enriched = customers.map((c) => {
      const userBookings = allBookings.filter((b) => b.userId === c.id);
      const wallet = getUserWalletRecord(c.id);
      const totalSpend = userBookings
        .filter((b) => b.status !== "cancelled")
        .reduce((sum, b) => sum + b.pricing.totalAmount, 0);

      return {
        ...c,
        walletBalance: wallet.balance,
        totalBookings: userBookings.length,
        totalSpend,
        recentBookings: userBookings.slice(0, 5),
      };
    });

    let result = enriched;
    if (q) {
      result = enriched.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({
      success: true,
      count: result.length,
      customers: result,
    });
  } catch (error) {
    console.error("[GET /api/operator/customers] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch customer directory" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (session?.user?.role !== "operator") {
      return NextResponse.json(
        { success: false, error: "Access Forbidden: Operator credentials required." },
        { status: 403 }
      );
    }

    const json = await request.json();
    const parsed = customerActionSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { userId, action, status, creditAmount, reason } = parsed.data;
    const actorName = session?.user?.name || "Operator";

    if (action === "toggle_status" && status) {
      const updated = await setCustomerStatus(userId, status);
      if (!updated) {
        return NextResponse.json({ success: false, error: "Customer not found." }, { status: 404 });
      }

      addAuditLog({
        action: `CUSTOMER_${status.toUpperCase()}`,
        actorId: session.user.id,
        actorName,
        actorRole: "operator",
        targetId: userId,
        details: `Customer status updated to ${status}. Reason: ${reason || "Operator review"}`,
      });

      return NextResponse.json({
        success: true,
        message: `Customer account is now ${status}.`,
        customer: updated,
      });
    }

    if (action === "grant_credit" && creditAmount) {
      const wallet = topUpUserWallet(
        userId,
        creditAmount,
        `Courtesy Credit: ${reason || "Customer service concession"}`
      );

      addAuditLog({
        action: "WALLET_COURTESY_CREDIT",
        actorId: session.user.id,
        actorName,
        actorRole: "operator",
        targetId: userId,
        details: `Granted ₹${creditAmount} credit. Reason: ${reason || "Support concession"}`,
      });

      return NextResponse.json({
        success: true,
        message: `Successfully granted ₹${creditAmount} to customer wallet.`,
        newBalance: wallet.balance,
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action." }, { status: 400 });
  } catch (error) {
    console.error("[PATCH /api/operator/customers] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update customer account" },
      { status: 500 }
    );
  }
}
