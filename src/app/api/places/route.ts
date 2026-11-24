/**
 * @file src/app/api/places/route.ts
 * @description Next.js Route Handler for nationwide Indian district parking & EV charging queries.
 * @purpose Serves real OpenStreetMap Overpass places cached for 6 hours with a simulated live availability layer.
 * @connections
 * - Uses /src/lib/places/index.ts
 * - Polled by Finder screen when user selects an Indian state and district
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCachedPlaces, getPlacesProvider } from "@/lib/places";

const placesQuerySchema = z.object({
  state: z.string().optional(),
  district: z.string().optional(),
  kind: z.enum(["all", "parking", "ev"]).optional().default("all"),
  lat: z.string().optional().transform((v) => (v ? parseFloat(v) : undefined)),
  lng: z.string().optional().transform((v) => (v ? parseFloat(v) : undefined)),
  radiusKm: z.string().optional().transform((v) => (v ? parseFloat(v) : 12)),
});

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = placesQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid search parameters", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { state, district, kind, lat, lng, radiusKm } = parsed.data;

    if (!district && (lat === undefined || lng === undefined)) {
      return NextResponse.json(
        { success: false, error: "Please provide a district name or GPS coordinates." },
        { status: 400 }
      );
    }

    const places = await getCachedPlaces({
      state,
      district,
      kind,
      lat,
      lng,
      radiusKm,
    });

    // Also return geocoded center if requested
    let center = null;
    if (district) {
      const provider = getPlacesProvider();
      center = await provider.geocodeDistrict(district, state);
    }

    return NextResponse.json({
      success: true,
      count: places.length,
      center,
      places,
      meta: {
        provider: process.env.PLACES_PROVIDER || "osm",
        cacheTtlHours: 6,
        isLiveSimulated: true,
      },
    });
  } catch (err) {
    console.error("[GET /api/places] Error:", err);
    return NextResponse.json({ success: false, error: "Failed to query places." }, { status: 500 });
  }
}
