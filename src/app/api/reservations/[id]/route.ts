/**
 * @file src/app/api/reservations/[id]/route.ts
 * @description Next.js Route Handler for modifying reservations (cancel, extend, start/stop charging, exit token).
 * @purpose Implements business logic for instant wallet refunds, duration extensions, and live EV charging sessions.
 * @connections
 * - Reads/writes /src/lib/db.ts
 * - Generates exit tokens via /src/lib/qr-token.ts
 * - Triggered from /src/app/bookings/page.tsx
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getReservationById, refundUserWallet, updateReservationRecord } from "@/lib/db";
import { calculateCancellationRefund } from "@/lib/pricing";
import { generateGateToken } from "@/lib/qr-token";
import { addHours } from "date-fns";

const updateSchema = z.object({
  action: z.enum(["cancel", "extend", "start_charge", "stop_charge", "generate_exit_token"]),
  additionalHours: z.number().int().min(1).max(12).optional(),
});

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const json = await request.json();
    const parseResult = updateSchema.safeParse(json);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Invalid action", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const reservation = getReservationById(params.id);
    if (!reservation) {
      return NextResponse.json(
        { success: false, error: `Reservation '${params.id}' was not found.` },
        { status: 404 }
      );
    }

    const { action, additionalHours } = parseResult.data;

    // Action 1: Cancellation with 1-hour refund policy
    if (action === "cancel") {
      if (reservation.status === "cancelled") {
        return NextResponse.json({ success: false, error: "Already cancelled." }, { status: 400 });
      }

      const { refundAmount, isFullRefund } = calculateCancellationRefund(
        reservation.pricing.totalAmount,
        reservation.pricing.serviceFee,
        reservation.startTime
      );

      let updatedWallet = null;
      if (refundAmount > 0) {
        updatedWallet = refundUserWallet(
          reservation.userId,
          refundAmount,
          `Refund for booking ${reservation.id} (${isFullRefund ? "Full" : "Partial"})`,
          reservation.id
        );
      }

      const updated = updateReservationRecord(reservation.id, {
        status: "cancelled",
        gateState: "cancelled",
      });

      return NextResponse.json({
        success: true,
        message: isFullRefund
          ? `Booking cancelled. 100% full refund of ₹${refundAmount} credited to your wallet.`
          : `Booking cancelled. Partial refund of ₹${refundAmount} credited (late cancellation fee retained).`,
        refund: { amount: refundAmount, isFullRefund, balance: updatedWallet?.balance },
        reservation: updated,
      });
    }

    // Action 2: Extend duration
    if (action === "extend") {
      const hours = additionalHours || 1;
      const newEnd = addHours(new Date(reservation.endTime), hours);
      const updated = updateReservationRecord(reservation.id, {
        endTime: newEnd.toISOString(),
        durationHours: reservation.durationHours + hours,
      });
      return NextResponse.json({
        success: true,
        message: `Booking extended by ${hours} hour(s).`,
        reservation: updated,
      });
    }

    // Action 3: Start EV Charging Session
    if (action === "start_charge") {
      const updated = updateReservationRecord(reservation.id, {
        gateState: "charging",
        chargingSession: {
          isCharging: true,
          kwhDelivered: 0.1,
          runningCost: 15,
          startedAt: new Date().toISOString(),
          targetKwh: reservation.targetKwh || 30,
        },
      });

      return NextResponse.json({
        success: true,
        message: "EV Charging session started successfully.",
        reservation: updated,
      });
    }

    // Action 4: Stop EV Charging Session
    if (action === "stop_charge") {
      const prevSession = reservation.chargingSession;
      const updated = updateReservationRecord(reservation.id, {
        gateState: "checked_in",
        chargingSession: prevSession ? { ...prevSession, isCharging: false } : undefined,
      });

      return NextResponse.json({
        success: true,
        message: "EV Charging stopped. Total power delivered recorded.",
        reservation: updated,
      });
    }

    // Action 5: Generate Exit Gate Token
    if (action === "generate_exit_token") {
      const exitToken = await generateGateToken(
        {
          bookingId: reservation.id,
          spotId: reservation.spotId,
          userId: reservation.userId,
          plateNumber: reservation.vehicle.plateNumber,
          purpose: "exit",
        },
        reservation.startTime,
        reservation.endTime
      );

      return NextResponse.json({
        success: true,
        exitToken,
      });
    }

    return NextResponse.json({ success: false, error: "Unsupported action." }, { status: 400 });
  } catch (err) {
    console.error(`[PATCH /api/reservations/${params.id}] Error:`, err);
    return NextResponse.json({ success: false, error: "Update failed." }, { status: 500 });
  }
}
