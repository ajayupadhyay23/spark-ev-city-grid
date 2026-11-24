/**
 * @file src/app/api/spots/route.ts
 * @description Next.js Route Handler for fetching and filtering parking lots and EV charging stations.
 * @purpose Serves as the primary data endpoint for the Finder screen and map layer. Applies multiple
 * orthogonal query filters (search text, vehicle type, radius, max pricing, amenities, charger plug types).
 * @connections
 * - Reads seed data from /src/lib/db.ts
 * - Uses /src/lib/utils.ts for Haversine distance computations
 * - Steps the live IoT sensor simulation via /src/lib/simulation.ts
 * - Consumed by /src/store/useAppStore.ts and /src/app/finder/page.tsx
 */

import { NextRequest, NextResponse } from "next/server";
import { getAllSpots } from "@/lib/db";
import { calculateHaversineDistanceKm } from "@/lib/utils";
import { stepSimulation } from "@/lib/simulation";
import { Amenity, ChargerType, ChargingSpeed, ParkingType, Spot, SpotType } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Run an IoT sensor simulation step so data feels fresh
    stepSimulation();

    const { searchParams } = new URL(request.url);

    // Extraction of query parameters
    const type = searchParams.get("type") as "all" | SpotType | null;
    const q = searchParams.get("q")?.toLowerCase().trim() || "";
    const latParam = searchParams.get("lat");
    const lngParam = searchParams.get("lng");
    const maxPriceParam = searchParams.get("maxPrice");
    const onlyAvailable = searchParams.get("onlyAvailable") === "true";
    const maxDistanceKmParam = searchParams.get("maxDistanceKm");
    const sortBy = searchParams.get("sortBy") || "nearest";

    // Multi-value comma-separated filter parsing
    const parkingTypes = (searchParams.get("parkingTypes")?.split(",").filter(Boolean) || []) as ParkingType[];
    const chargerTypes = (searchParams.get("chargerTypes")?.split(",").filter(Boolean) || []) as ChargerType[];
    const chargingSpeeds = (searchParams.get("chargingSpeeds")?.split(",").filter(Boolean) || []) as ChargingSpeed[];
    const amenities = (searchParams.get("amenities")?.split(",").filter(Boolean) || []) as Amenity[];

    const userLat = latParam ? parseFloat(latParam) : null;
    const userLng = lngParam ? parseFloat(lngParam) : null;
    const maxPrice = maxPriceParam ? parseFloat(maxPriceParam) : null;
    const maxDistanceKm = maxDistanceKmParam ? parseFloat(maxDistanceKmParam) : null;

    let spots: Spot[] = getAllSpots();

    // 1. Filter by Primary Category (parking vs ev)
    if (type && type !== "all") {
      spots = spots.filter((s) => s.type === type);
    }

    // 2. Filter by Search Query (name, address, city)
    if (q) {
      spots = spots.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.address.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q)
      );
    }

    // 3. Filter by Availability
    if (onlyAvailable) {
      spots = spots.filter((s) => s.freeSlots > 0);
    }

    // 4. Filter by Max Price
    if (maxPrice !== null && !isNaN(maxPrice)) {
      spots = spots.filter((s) => {
        const rate = s.type === "parking" ? s.pricing.perHour : (s.pricing.perKwh || 20);
        return rate <= maxPrice;
      });
    }

    // 5. Filter by Parking Structure Type
    if (parkingTypes.length > 0) {
      spots = spots.filter((s) => s.parkingType && parkingTypes.includes(s.parkingType));
    }

    // 6. Filter by EV Charger Connector Standard
    if (chargerTypes.length > 0) {
      spots = spots.filter((s) => {
        if (s.type !== "ev" || !s.chargers) return false;
        return s.chargers.some((c) => chargerTypes.includes(c.type));
      });
    }

    // 7. Filter by EV Charging Speed
    if (chargingSpeeds.length > 0) {
      spots = spots.filter((s) => {
        if (s.type !== "ev" || !s.chargers) return false;
        return s.chargers.some((c) => chargingSpeeds.includes(c.speed));
      });
    }

    // 8. Filter by Amenities (must possess all requested amenities)
    if (amenities.length > 0) {
      spots = spots.filter((s) => amenities.every((amenity) => s.amenities.includes(amenity)));
    }

    // 9. Compute Distance and Filter by Radius
    const spotsWithDistance = spots.map((spot) => {
      let distanceKm: number | null = null;
      if (userLat !== null && userLng !== null && !isNaN(userLat) && !isNaN(userLng)) {
        distanceKm = calculateHaversineDistanceKm({ lat: userLat, lng: userLng }, spot.location);
      }
      return { ...spot, distanceKm };
    });

    let results = spotsWithDistance;
    if (maxDistanceKm !== null && !isNaN(maxDistanceKm) && userLat !== null && userLng !== null) {
      results = results.filter((s) => s.distanceKm === null || s.distanceKm <= maxDistanceKm);
    }

    // 10. Sort Results
    results.sort((a, b) => {
      if (sortBy === "cheapest") {
        const rateA = a.type === "parking" ? a.pricing.perHour : (a.pricing.perKwh || 0);
        const rateB = b.type === "parking" ? b.pricing.perHour : (b.pricing.perKwh || 0);
        return rateA - rateB;
      }
      if (sortBy === "availability") {
        return b.freeSlots - a.freeSlots;
      }
      // Default: nearest
      if (a.distanceKm !== null && b.distanceKm !== null) {
        return a.distanceKm - b.distanceKm;
      }
      return 0;
    });

    return NextResponse.json({
      success: true,
      count: results.length,
      spots: results,
    });
  } catch (error) {
    console.error("[GET /api/spots] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch spots" },
      { status: 500 }
    );
  }
}
