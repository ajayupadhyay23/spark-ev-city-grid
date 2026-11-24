/**
 * @file src/app/api/reservations/route.ts
 * @description Next.js Route Handler for creating new reservations and listing user bookings.
 * @purpose Orchestrates slot verification, overlap collision checks, dynamic pricing,
 * cryptographic JWT gate token generation (using jose), and server-session user binding.
 * @connections
 * - Validated using /src/lib/validators.ts with Zod
 * - Reads/writes /src/lib/db.ts
 * - Generates signed QR tokens via /src/lib/qr-token.ts
 * - Bound to authenticated user via /src/lib/auth.ts
 */

import { NextRequest, NextResponse } from "next/server";
import {
  checkVehicleBookingOverlap,
  createReservationRecord,
  deductUserWallet,
  getReservationsByUserId,
  getSpotById,
} from "@/lib/db";
import { createReservationSchema } from "@/lib/validators";
import { calculateBookingPrice } from "@/lib/pricing";
import { generateGateToken } from "@/lib/qr-token";
import { getServerAuthSession } from "@/lib/auth";
import { Reservation } from "@/types";
import { addHours } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerAuthSession();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required to view reservations." },
        { status: 401 }
      );
    }

    const bookings = getReservationsByUserId(userId);
    bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      success: true,
      count: bookings.length,
      reservations: bookings,
    });
  } catch (error) {
    console.error("[GET /api/reservations] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve reservations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerAuthSession();
    // Prefer verified server session userId over client payload
    const sessionUserId = session?.user?.id;

    const json = await request.json();
    const parseResult = createReservationSchema.safeParse(json);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 422 }
      );
    }

    const payload = parseResult.data;
    const finalUserId = sessionUserId || payload.userId;
    const startDate = new Date(payload.startTime);

    // Reject past start times (with 5-min network lag buffer)
    if (startDate.getTime() < Date.now() - 5 * 60 * 1000) {
      return NextResponse.json(
        { success: false, error: "Reservation start time cannot be in the past." },
        { status: 400 }
      );
    }

    const spot = getSpotById(payload.spotId);
    if (!spot) {
      return NextResponse.json(
        { success: false, error: `Spot '${payload.spotId}' does not exist.` },
        { status: 404 }
      );
    }

    if (spot.freeSlots <= 0) {
      return NextResponse.json(
        { success: false, error: "This facility is currently fully occupied. Please select another spot." },
        { status: 409 }
      );
    }

    const endDate = addHours(startDate, payload.durationHours);

    // Vehicle overlap check
    const hasOverlap = checkVehicleBookingOverlap(
      payload.vehicle.plateNumber,
      startDate.toISOString(),
      endDate.toISOString()
    );

    if (hasOverlap) {
      return NextResponse.json(
        {
          success: false,
          error: `Vehicle plate ${payload.vehicle.plateNumber} already has an active or overlapping reservation during this time window.`,
        },
        { status: 409 }
      );
    }

    let chargerPrice: number | undefined;
    if (payload.chargerId && spot.chargers) {
      const charger = spot.chargers.find((c) => c.id === payload.chargerId);
      if (charger) chargerPrice = charger.pricePerKwh;
    }

    const computedPricing = calculateBookingPrice(
      spot,
      startDate,
      payload.durationHours,
      payload.targetKwh,
      chargerPrice
    );

    const bookingId = `res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Wallet deduction
    if (payload.paymentMethod === "wallet") {
      const deduction = deductUserWallet(
        finalUserId,
        computedPricing.totalAmount,
        `Booking at ${spot.name}`,
        bookingId
      );

      if (!deduction.success) {
        return NextResponse.json(
          { success: false, error: deduction.error || "Insufficient wallet balance." },
          { status: 402 }
        );
      }
    }

    // Generate Cryptographically Signed JWT Token for Gate Barrier Opening
    const signedGateToken = await generateGateToken(
      {
        bookingId,
        spotId: spot.id,
        userId: finalUserId,
        plateNumber: payload.vehicle.plateNumber,
        slotOrChargerId: payload.chargerId,
        purpose: "entry",
      },
      startDate.toISOString(),
      endDate.toISOString()
    );

    const newReservation: Reservation = {
      id: bookingId,
      userId: finalUserId,
      spotId: spot.id,
      spotName: spot.name,
      spotType: spot.type,
      spotAddress: spot.address,
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      durationHours: payload.durationHours,
      status: "upcoming",
      gateState: "reserved",
      vehicle: payload.vehicle,
      chargerId: payload.chargerId,
      targetKwh: payload.targetKwh,
      pricing: {
        baseAmount: computedPricing.baseAmount,
        taxes: computedPricing.taxes,
        serviceFee: computedPricing.serviceFee,
        peakMultiplier: computedPricing.peakMultiplier,
        totalAmount: computedPricing.totalAmount,
      },
      paymentMethod: payload.paymentMethod,
      paymentId,
      qrCodeValue: signedGateToken,
      createdAt: new Date().toISOString(),
    };

    const saved = createReservationRecord(newReservation);

    return NextResponse.json(
      {
        success: true,
        message: "Reservation confirmed successfully.",
        reservation: saved,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/reservations] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process reservation" },
      { status: 500 }
    );
  }
}
