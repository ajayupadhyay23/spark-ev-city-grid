/**
 * @file src/lib/places/types.ts
 * @description Standardized interface definitions for spatial Places providers (OSM, Google, Mock).
 * @purpose Decouples raw geographical vendor responses (OpenStreetMap Overpass JSON vs Google Places API New)
 * from the application's internal Spot model.
 * @connections
 * - Implemented by /src/lib/places/osm-provider.ts and /src/lib/places/google-provider.ts
 * - Consumed by /src/app/api/places/route.ts
 */

import { Amenity, Charger, ParkingType, SpotPricing, SpotType } from "@/types";

export interface PlaceItem {
  id: string;
  name: string;
  kind: SpotType; // 'parking' | 'ev'
  parkingType?: ParkingType;
  lat: number;
  lng: number;
  address: string;
  state: string;
  district: string;
  totalSlots: number;
  freeSlots: number;
  pricing: SpotPricing;
  amenities: Amenity[];
  rating: number;
  reviewCount: number;
  openingHours: string;
  gradient: string;
  chargers?: Charger[];
  tags?: Record<string, string>;
  isLiveSimulated: boolean; // Indicates availability is simulated on top of real physical facility
  source: "osm" | "google" | "seed";
  updatedAt: string;
}

export interface PlacesQuery {
  state?: string;
  district?: string;
  kind?: "all" | SpotType;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  bbox?: [number, number, number, number]; // [minLat, minLng, maxLat, maxLng]
}

export interface PlacesProvider {
  searchPlaces(query: PlacesQuery): Promise<PlaceItem[]>;
  geocodeDistrict(district: string, state?: string): Promise<{ lat: number; lng: number } | null>;
}
