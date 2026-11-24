/**
 * @file src/app/api/operator/spots/route.ts
 * @description Operator facility administration API with Zod validation.
 * @purpose Allows municipal operators to adjust tariff rates, toggle charger availability,
 * and switch facilities into Maintenance Mode.
 *
 * @connections
 * - Protected by getServerAuthSession() (role: operator only)
 * - Reads/mutates /src/lib/db.ts
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerAuthSession } from "@/lib/auth";
import {
  getAllSpots,
  getSpotById,
  updateSpotPrice,
  toggleSpotMaintenance,
  toggleChargerStatus,
  addAuditLog,
} from "@/lib/db";

const spotActionSchema = z.object({
  spotId: z.string().min(1, "Spot ID is required"),
  action: z.enum(["update_price", "toggle_maintenance", "toggle_charger"]),
  perHour: z.number().nonnegative().optional(),
  perKwh: z.number().nonnegative().optional(),
  isMaintenance: z.boolean().optional(),
  chargerId: z.string().optional(),
  chargerStatus: z.enum(["available", "occupied", "offline"]).optional(),
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

    const spots = getAllSpots();
    return NextResponse.json({
      success: true,
      count: spots.length,
      spots,
    });
  } catch (error) {
    console.error("[GET /api/operator/spots] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch spots" },
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
    const parsed = spotActionSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { spotId, action, perHour, perKwh, isMaintenance, chargerId, chargerStatus } =
      parsed.data;
    const actorName = session?.user?.name || "Operator";
    const spot = getSpotById(spotId);

    if (!spot) {
      return NextResponse.json({ success: false, error: "Spot not found." }, { status: 404 });
    }

    if (action === "update_price" && perHour !== undefined) {
      const updated = updateSpotPrice(spotId, perHour, perKwh);
      addAuditLog({
        action: "UPDATE_SPOT_PRICE",
        actorId: session.user.id,
        actorName,
        actorRole: "operator",
        targetId: spotId,
        details: `Updated pricing for ${spot.name}: ₹${perHour}/hr, ₹${perKwh || 0}/kWh`,
      });

      return NextResponse.json({
        success: true,
        message: "Pricing updated successfully.",
        spot: updated,
      });
    }

    if (action === "toggle_maintenance" && isMaintenance !== undefined) {
      const updated = toggleSpotMaintenance(spotId, isMaintenance);
      addAuditLog({
        action: isMaintenance ? "ENTER_MAINTENANCE" : "EXIT_MAINTENANCE",
        actorId: session.user.id,
        actorName,
        actorRole: "operator",
        targetId: spotId,
        details: `${spot.name} maintenance mode set to ${isMaintenance}`,
      });

      return NextResponse.json({
        success: true,
        message: `Facility is now ${isMaintenance ? "in maintenance mode" : "operational"}.`,
        spot: updated,
      });
    }

    if (action === "toggle_charger" && chargerId && chargerStatus) {
      const updated = toggleChargerStatus(spotId, chargerId, chargerStatus);
      addAuditLog({
        action: "UPDATE_CHARGER_STATUS",
        actorId: session.user.id,
        actorName,
        actorRole: "operator",
        targetId: `${spotId}:${chargerId}`,
        details: `Charger ${chargerId} at ${spot.name} toggled to ${chargerStatus}`,
      });

      return NextResponse.json({
        success: true,
        message: `Charger status set to ${chargerStatus}.`,
        spot: updated,
      });
    }

    return NextResponse.json({ success: false, error: "Invalid spot action." }, { status: 400 });
  } catch (error) {
    console.error("[PATCH /api/operator/spots] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update facility" },
      { status: 500 }
    );
  }
}
