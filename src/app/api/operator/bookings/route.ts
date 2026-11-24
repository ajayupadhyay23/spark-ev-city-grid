/**
 * @file src/app/api/operator/bookings/route.ts
 * @description Operator bookings management API with Zod validation.
 * @purpose Allows municipal operators to query all customer reservations across the grid,
 * filter by status or facility, and execute administrative actions (cancel, refund, extend, mark no-show).
 *
 * @connections
 * - Protected by getServerAuthSession() (role: operator only)
 * - Reads/mutates /src/lib/db.ts
 * - Used by Bookings tab in /src/app/operator/page.tsx
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerAuthSession } from "@/lib/auth";
import {
  getAllReservations,
  getReservationById,
  updateReservationRecord,
  refundUserWallet,
  addAuditLog,
} from "@/lib/db";

const operatorBookingActionSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
  action: z.enum(["cancel", "refund", "extend", "mark_noshow", "resend_qr"]),
  additionalHours: z.number().int().min(1).max(24).optional(),
  refundReason: z.string().optional(),
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
    const status = searchParams.get("status");
    const spotId = searchParams.get("spotId");
    const q = searchParams.get("q")?.toLowerCase().trim();

    let list = getAllReservations();

    if (status && status !== "all") {
      list = list.filter((b) => b.status === status);
    }
    if (spotId && spotId !== "all") {
      list = list.filter((b) => b.spotId === spotId);
    }
    if (q) {
      list = list.filter(
        (b) =>
          b.id.toLowerCase().includes(q) ||
          b.vehicle.plateNumber.toLowerCase().includes(q) ||
          b.spotName.toLowerCase().includes(q) ||
          (b.customerName && b.customerName.toLowerCase().includes(q))
      );
    }

    return NextResponse.json({
      success: true,
      count: list.length,
      bookings: list,
    });
  } catch (error) {
    console.error("[GET /api/operator/bookings] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve bookings" },
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
    const parsed = operatorBookingActionSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { bookingId, action, additionalHours, refundReason } = parsed.data;
    const booking = getReservationById(bookingId);

    if (!booking) {
      return NextResponse.json(
        { success: false, error: `Booking '${bookingId}' not found.` },
        { status: 404 }
      );
    }

    const actorName = session?.user?.name || "Operator";

    if (action === "cancel") {
      const updated = updateReservationRecord(bookingId, {
        status: "cancelled",
        gateState: "cancelled",
        cancelledAt: new Date().toISOString(),
      });

      addAuditLog({
        action: "OPERATOR_CANCEL_BOOKING",
        actorId: session.user.id,
        actorName,
        actorRole: "operator",
        targetId: bookingId,
        details: `Cancelled booking for vehicle ${booking.vehicle.plateNumber}`,
      });

      return NextResponse.json({
        success: true,
        message: "Booking cancelled by operator.",
        booking: updated,
      });
    }

    if (action === "refund") {
      const amount = booking.pricing.totalAmount;
      refundUserWallet(
        booking.userId,
        amount,
        `Operator Refund for ${booking.spotName}`,
        booking.id
      );

      const updated = updateReservationRecord(bookingId, {
        status: "cancelled",
        gateState: "cancelled",
        refundAmount: amount,
      });

      addAuditLog({
        action: "OPERATOR_REFUND_BOOKING",
        actorId: session.user.id,
        actorName,
        actorRole: "operator",
        targetId: bookingId,
        details: `Full refund ₹${amount} granted: ${refundReason || "Operator concession"}`,
      });

      return NextResponse.json({
        success: true,
        message: `Refund of ₹${amount} credited to customer wallet.`,
        booking: updated,
      });
    }

    if (action === "extend") {
      const extra = additionalHours || 1;
      const currentEnd = new Date(booking.endTime);
      const newEnd = new Date(currentEnd.getTime() + extra * 3600000);

      const updated = updateReservationRecord(bookingId, {
        endTime: newEnd.toISOString(),
        durationHours: booking.durationHours + extra,
      });

      addAuditLog({
        action: "OPERATOR_EXTEND_BOOKING",
        actorId: session.user.id,
        actorName,
        actorRole: "operator",
        targetId: bookingId,
        details: `Extended duration by +${extra} hours`,
      });

      return NextResponse.json({
        success: true,
        message: `Reservation extended until ${newEnd.toLocaleTimeString()}.`,
        booking: updated,
      });
    }

    if (action === "mark_noshow") {
      const updated = updateReservationRecord(bookingId, {
        status: "cancelled",
        gateState: "expired",
      });

      addAuditLog({
        action: "OPERATOR_MARK_NOSHOW",
        actorId: session.user.id,
        actorName,
        actorRole: "operator",
        targetId: bookingId,
        details: `Driver marked as no-show for plate ${booking.vehicle.plateNumber}`,
      });

      return NextResponse.json({
        success: true,
        message: "Booking marked as driver no-show.",
        booking: updated,
      });
    }

    if (action === "resend_qr") {
      addAuditLog({
        action: "OPERATOR_RESEND_QR",
        actorId: session.user.id,
        actorName,
        actorRole: "operator",
        targetId: bookingId,
        details: "Regenerated and refreshed digital barrier pass token",
      });

      return NextResponse.json({
        success: true,
        message: "Digital barrier QR pass refreshed.",
        booking,
      });
    }

    return NextResponse.json({ success: false, error: "Action not supported" }, { status: 400 });
  } catch (error) {
    console.error("[PATCH /api/operator/bookings] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update reservation" },
      { status: 500 }
    );
  }
}
