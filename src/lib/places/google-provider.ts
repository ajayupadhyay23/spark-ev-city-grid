/**
 * @file src/lib/places/google-provider.ts
 * @description Google Maps Places API (New) Provider Implementation Stub.
 * @purpose Demonstrates how to swap the OpenStreetMap engine for Google Places API (New) by editing
 * just one environment variable `PLACES_PROVIDER=google`.
 * HOW TO IMPLEMENT WITH GOOGLE PLACES API (NEW):
 * 1. Obtain an API key with Places API (New) enabled from Google Cloud Console.
 * 2. Set `GOOGLE_MAPS_API_KEY=your_key_here` in `.env.local`.
 * 3. Replace the stub method below with a POST call to:
 *    `https://places.googleapis.com/v1/places:searchNearby`
 *    Headers:
 *      'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY
 *      'X-Goog-FieldMask': 'places.id,places.displayName,places.location,places.evChargeOptions'
 *    Body:
 *      {
 *        includedTypes: ["parking", "electric_vehicle_charging_station"],
 *        maxResultCount: 20,
 *        locationRestriction: { circle: { center: { latitude, longitude }, radius: radiusMeters } }
 *      }
 * @connections
 * - Implements PlacesProvider interface from /src/lib/places/types.ts
 */

import { PlaceItem, PlacesProvider, PlacesQuery } from "./types";

export class GooglePlacesProvider implements PlacesProvider {
  async geocodeDistrict(district: string, state?: string): Promise<{ lat: number; lng: number } | null> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn("[GooglePlacesProvider] GOOGLE_MAPS_API_KEY is not defined. Falling back to default.");
      return null;
    }

    try {
      const q = encodeURIComponent(`${district}, ${state || ""}, India`);
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${q}&key=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.results && data.results[0]) {
        return {
          lat: data.results[0].geometry.location.lat,
          lng: data.results[0].geometry.location.lng,
        };
      }
      return null;
    } catch (err) {
      console.error("[GooglePlacesProvider] Geocoding error:", err);
      return null;
    }
  }

  async searchPlaces(query: PlacesQuery): Promise<PlaceItem[]> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn(
        "[GooglePlacesProvider] GOOGLE_MAPS_API_KEY is unset. Please provide an API key in .env.local to activate real Google Places responses."
      );
      return [];
    }

    // Reference implementation outline for Google Places API (New) SearchNearby endpoint
    // To activate, uncomment and configure field masks:
    /*
    const response = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.evChargeOptions,places.rating"
      },
      body: JSON.stringify({
        includedTypes: query.kind === "ev" ? ["electric_vehicle_charging_station"] : ["parking", "electric_vehicle_charging_station"],
        maxResultCount: 20,
        locationRestriction: {
          circle: {
            center: { latitude: query.lat, longitude: query.lng },
            radius: (query.radiusKm || 10) * 1000
          }
        }
      })
    });
    const data = await response.json();
    return this.transformGooglePlaces(data.places || []);
    */

    return [];
  }
}
