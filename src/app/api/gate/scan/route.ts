/**
 * @file src/app/api/gate/scan/route.ts
 * @description Next.js Route Handler for verifying camera QR scans and manual gate barrier overrides.
 * @purpose Implements Layer 2 backend security for municipal boom barriers and EV chargers.
 * Cryptographically verifies JWT signatures, anti-passback single-use states, facility matching, and expiry.
 * Emits barrier open events for real-time operator monitoring and logs full audit records.
 *
 * @connections
 * - Uses /src/lib/qr-token.ts for verification
 * - Uses /src/lib/gate-adapter.ts for hardware relay triggers and audit logging
 * - Reads/mutates reservations in /src/lib/db.ts
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyGateToken } from "@/lib/qr-token";
import { recordGateScan, triggerHardwareBarrierRelay, triggerOcppRemoteStart } from "@/lib/gate-adapter";
import { getReservationById, updateReservationRecord } from "@/lib/db";
import { getServerAuthSession } from "@/lib/auth";

const scanPayloadSchema = z.object({
  token: z.string().optional(),
  spotId: z.string().min(1, "Spot ID is required"),
  gateType: z.enum(["entry", "exit", "charge"]),
  isOverride: z.boolean().optional(),
  overrideReason: z.string().optional(),
});

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerAuthSession();
    const userRole = session?.user?.role;

    // Layer 2 Security Check: Only 'gate' or 'operator' roles can command gate scanning
    if (userRole !== "gate" && userRole !== "operator") {
      return NextResponse.json(
        { decision: "DENIED", reason: "Unauthorized: Scanner device account required." },
        { status: 403 }
      );
    }

    const json = await request.json();
    const parsed = scanPayloadSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { decision: "DENIED", reason: "Invalid request payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { token, spotId, gateType, isOverride, overrideReason } = parsed.data;

    // ============================================
    // Case 1: Manual Operator Override
    // ============================================
    if (isOverride) {
      await triggerHardwareBarrierRelay(spotId, gateType);
      const audit = recordGateScan({
        spotId,
        gateType,
        plateNumber: "MANUAL-OVERRIDE",
        decision: "OPEN",
        reason: overrideReason || `Manual open by operator ${session?.user?.name || "staff"}`,
        isOverride: true,
      });

      return NextResponse.json({
        decision: "OPEN",
        reason: "Manual operator barrier override granted.",
        auditId: audit.id,
      });
    }

    // ============================================
    // Case 2: Cryptographic QR Token Verification
    // ============================================
    if (!token) {
      return NextResponse.json(
        { decision: "DENIED", reason: "No QR token provided." },
        { status: 400 }
      );
    }

    const verification = await verifyGateToken(token);
    if (!verification.valid || !verification.payload) {
      recordGateScan({
        spotId,
        gateType,
        plateNumber: "UNKNOWN",
        decision: "DENIED",
        reason: verification.error || "Token validation failed",
      });

      return NextResponse.json({
        decision: "DENIED",
        reason: verification.error || "Token verification failed.",
      });
    }

    const payload = verification.payload;

    // 1. Facility Validation: Spot must match exactly
    if (payload.spotId !== spotId) {
      recordGateScan({
        spotId,
        gateType,
        plateNumber: payload.plateNumber,
        bookingId: payload.bookingId,
        decision: "DENIED",
        reason: `Wrong Facility: Pass is for '${payload.spotId}', not '${spotId}'`,
      });

      return NextResponse.json({
        decision: "DENIED",
        reason: "Access Denied: This pass belongs to a different parking facility.",
      });
    }

    // 2. Fetch Active Database Record
    const booking = getReservationById(payload.bookingId);
    if (!booking) {
      recordGateScan({
        spotId,
        gateType,
        plateNumber: payload.plateNumber,
        bookingId: payload.bookingId,
        decision: "DENIED",
        reason: "Booking record not found in system",
      });

      return NextResponse.json({
        decision: "DENIED",
        reason: "Booking was not found in city records.",
      });
    }

    // 3. State Machine & Anti-Passback Single-Use Rules
    const currentGateState = booking.gateState || "reserved";

    if (booking.status === "cancelled") {
      recordGateScan({
        spotId,
        gateType,
        plateNumber: payload.plateNumber,
        bookingId: payload.bookingId,
        decision: "DENIED",
        reason: "Booking was cancelled by driver",
      });

      return NextResponse.json({
        decision: "DENIED",
        reason: "Reservation has been cancelled.",
        booking,
      });
    }

    // Entry Flow
    if (gateType === "entry") {
      if (currentGateState !== "reserved") {
        recordGateScan({
          spotId,
          gateType,
          plateNumber: payload.plateNumber,
          bookingId: payload.bookingId,
          decision: "DENIED",
          reason: `Pass already used. Current state: ${currentGateState}`,
        });

        return NextResponse.json({
          decision: "DENIED",
          reason: "Pass has already entered the facility (Anti-passback violation).",
          booking,
        });
      }

      // Mark Checked In & Activate Session
      const updated = updateReservationRecord(booking.id, {
        gateState: "checked_in",
        status: "active",
        checkedInAt: new Date().toISOString(),
      });

      await triggerHardwareBarrierRelay(spotId, "entry");
      recordGateScan({
        spotId,
        gateType,
        plateNumber: payload.plateNumber,
        bookingId: payload.bookingId,
        decision: "OPEN",
        reason: "Valid reservation pass verified. Entry gate raised.",
      });

      return NextResponse.json({
        decision: "OPEN",
        reason: `Welcome ${payload.plateNumber}! Entry barrier lifted.`,
        booking: updated || booking,
      });
    }

    // Exit Flow
    if (gateType === "exit") {
      if (currentGateState !== "checked_in" && currentGateState !== "charging") {
        recordGateScan({
          spotId,
          gateType,
          plateNumber: payload.plateNumber,
          bookingId: payload.bookingId,
          decision: "DENIED",
          reason: "Cannot exit: Vehicle never checked in.",
        });

        return NextResponse.json({
          decision: "DENIED",
          reason: "Vehicle was never checked in through entry gate.",
          booking,
        });
      }

      // Mark Completed & Open Exit Barrier
      const updated = updateReservationRecord(booking.id, {
        gateState: "completed",
        status: "completed",
        checkedOutAt: new Date().toISOString(),
      });

      await triggerHardwareBarrierRelay(spotId, "exit");
      recordGateScan({
        spotId,
        gateType,
        plateNumber: payload.plateNumber,
        bookingId: payload.bookingId,
        decision: "OPEN",
        reason: "Exit scan verified. Thank you for visiting.",
      });

      return NextResponse.json({
        decision: "OPEN",
        reason: "Exit barrier raised. Drive safely!",
        booking: updated || booking,
      });
    }

    // Charger Flow
    if (gateType === "charge") {
      await triggerOcppRemoteStart(spotId, payload.slotOrChargerId || "c1");
      const updated = updateReservationRecord(booking.id, {
        gateState: "charging",
        chargingSession: {
          isCharging: true,
          kwhDelivered: 0,
          runningCost: 0,
          startedAt: new Date().toISOString(),
          targetKwh: booking.targetKwh || 35,
        },
      });

      recordGateScan({
        spotId,
        gateType,
        plateNumber: payload.plateNumber,
        bookingId: payload.bookingId,
        decision: "OPEN",
        reason: "EV Charger unlocked. Dispensing energy.",
      });

      return NextResponse.json({
        decision: "OPEN",
        reason: "EV charger unlocked & dispensing power.",
        booking: updated || booking,
      });
    }

    return NextResponse.json({
      decision: "DENIED",
      reason: "Unsupported gate operation.",
      booking,
    });
  } catch (error) {
    console.error("[POST /api/gate/scan] Exception:", error);
    return NextResponse.json(
      { decision: "DENIED", reason: "Internal server scan processing error." },
      { status: 500 }
    );
  }
}
