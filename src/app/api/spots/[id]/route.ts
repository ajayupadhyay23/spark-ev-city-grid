/**
 * @file src/app/api/spots/[id]/route.ts
 * @description Next.js Route Handler for fetching full details for a single spot by ID.
 * @purpose Used by the slide-over drawer and the dedicated spot detail page (/spot/[id]).
 * @connections
 * - Reads from /src/lib/db.ts
 * - Polled when user inspects a parking lot or EV charger from search results or map pins
 */

import { NextRequest, NextResponse } from "next/server";
import { getSpotById } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const spot = getSpotById(params.id);

    if (!spot) {
      return NextResponse.json(
        { success: false, error: `Spot with ID '${params.id}' was not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      spot,
    });
  } catch (error) {
    console.error(`[GET /api/spots/${params.id}] Error:`, error);
    return NextResponse.json(
      { success: false, error: "Internal server error fetching spot details" },
      { status: 500 }
    );
  }
}
