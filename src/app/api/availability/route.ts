/**
 * @file src/app/api/availability/route.ts
 * @description Lightweight API endpoint returning live slot availability counts and simulated IoT telemetry.
 * @purpose Minimizes network payload bandwidth for the 5-second polling loop used on the map and landing stats.
 * Instead of re-fetching full spot models with descriptions, this returns a key-value map { [id]: freeSlots }.
 * @connections
 * - Mutates live counts via /src/lib/simulation.ts
 * - Polled by /src/hooks/useLiveAvailability.ts
 * - Powers the landing page stat counters and the pulsating "LIVE" badges
 */

import { NextResponse } from "next/server";
import { getAllSpots } from "@/lib/db";
import { stepSimulation } from "@/lib/simulation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Run an IoT perturbation step
    const events = stepSimulation();
    const spots = getAllSpots();

    // Map of ID to free slot count
    const liveCounts: Record<string, number> = {};
    let totalSpots = 0;
    let freeSpots = 0;
    let chargersOnline = 0;

    for (const spot of spots) {
      liveCounts[spot.id] = spot.freeSlots;
      totalSpots += spot.totalSlots;
      freeSpots += spot.freeSlots;

      if (spot.type === "ev" && spot.chargers) {
        chargersOnline += spot.chargers.filter((c) => c.status !== "offline").length;
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      counts: liveCounts,
      stats: {
        totalSpots,
        freeSpots,
        occupiedSpots: totalSpots - freeSpots,
        chargersOnline,
      },
      recentEvents: events.slice(0, 5),
    });
  } catch (error) {
    console.error("[GET /api/availability] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch live availability" },
      { status: 500 }
    );
  }
}
