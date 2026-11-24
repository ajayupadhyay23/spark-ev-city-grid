/**
 * @file src/lib/places/index.ts
 * @description Provider selector and 6-hour memory cache manager for Places data.
 * @purpose Switches between OpenStreetMap (free Overpass API) and Google Places API based on PLACES_PROVIDER env.
 * WHY CACHING MATTERS (TTL 6 Hours):
 * - Overpass API public servers have strict fair-use rate limits (typically 2 queries per IP per minute).
 * - Caching query results for 6 hours avoids repeat requests for the same district, dramatically speeds up page loads,
 *   and strictly complies with OpenStreetMap Foundation acceptable use guidelines.
 * @connections
 * - Used by /src/app/api/places/route.ts
 */

import { OsmPlacesProvider } from "./osm-provider";
import { GooglePlacesProvider } from "./google-provider";
import { PlaceItem, PlacesProvider, PlacesQuery } from "./types";

// In-memory 6-Hour Cache Entry
interface CacheEntry {
  data: PlaceItem[];
  timestamp: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __placesCache: Map<string, CacheEntry> | undefined;
}

if (!globalThis.__placesCache) {
  globalThis.__placesCache = new Map<string, CacheEntry>();
}

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 Hours

export function getPlacesProvider(): PlacesProvider {
  const providerType = process.env.PLACES_PROVIDER?.toLowerCase() || "osm";
  if (providerType === "google") {
    return new GooglePlacesProvider();
  }
  return new OsmPlacesProvider();
}

/**
 * Searches places with 6-hour in-memory cache layer.
 */
export async function getCachedPlaces(query: PlacesQuery): Promise<PlaceItem[]> {
  const cacheKey = `${query.state || ""}_${query.district || ""}_${query.kind || "all"}_${query.lat || ""}_${query.lng || ""}`;
  const cache = globalThis.__placesCache!;

  const existing = cache.get(cacheKey);
  const now = Date.now();

  if (existing && now - existing.timestamp < CACHE_TTL_MS) {
    return existing.data;
  }

  const provider = getPlacesProvider();
  const places = await provider.searchPlaces(query);

  if (places.length > 0) {
    cache.set(cacheKey, { data: places, timestamp: now });
  }

  return places;
}
