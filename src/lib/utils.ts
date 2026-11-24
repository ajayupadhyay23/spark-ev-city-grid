/**
 * @file src/lib/utils.ts
 * @description General-purpose helper functions for class merging, distance math, and date formatting.
 * @purpose Provides standard utilities so components remain concise and free of boilerplate math.
 * @connections
 * - Used in virtually every component for styling via `cn`
 * - Used by /src/app/api/spots/route.ts to calculate distance from user coordinates
 * - Used by /src/components/map/SpotMap.tsx to style markers based on capacity
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { GeoLocation } from "@/types";

/**
 * Combines Tailwind classes conditionally and resolves conflicting classes cleanly.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Computes great-circle distance between two GPS coordinates using the Haversine formula.
 * WHY: Calculates real-world ground distance (in kilometers) accurately without needing
 * a paid third-party distance matrix API.
 */
export function calculateHaversineDistanceKm(
  pointA: GeoLocation,
  pointB: GeoLocation
): number {
  const R = 6371; // Earth's mean radius in kilometers
  const dLat = ((pointB.lat - pointA.lat) * Math.PI) / 180;
  const dLng = ((pointB.lng - pointA.lng) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((pointA.lat * Math.PI) / 180) *
      Math.cos((pointB.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  // Round to 1 decimal place (e.g. 2.4 km)
  return Math.round(distance * 10) / 10;
}

export const calculateDistanceKm = calculateHaversineDistanceKm;

/**
 * Classifies slot availability into visual tiers:
 * - "high": >= 30% available slots (Green indicator)
 * - "low": 1% to 29% available slots (Yellow / Amber indicator)
 * - "full": 0 available slots (Red indicator)
 */
export function getAvailabilityTier(
  freeSlots: number,
  totalSlots: number
): "high" | "low" | "full" {
  if (freeSlots <= 0 || totalSlots === 0) return "full";
  const ratio = freeSlots / totalSlots;
  if (ratio < 0.25) return "low";
  return "high";
}

/**
 * Returns Tailwind color classes corresponding to the availability tier.
 */
export function getAvailabilityColorClasses(tier: "high" | "low" | "full"): {
  text: string;
  bg: string;
  border: string;
  pulse: string;
} {
  switch (tier) {
    case "high":
      return {
        text: "text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/30",
        pulse: "bg-emerald-400",
      };
    case "low":
      return {
        text: "text-amber-400",
        bg: "bg-amber-500/10",
        border: "border-amber-500/30",
        pulse: "bg-amber-400",
      };
    case "full":
      return {
        text: "text-rose-400",
        bg: "bg-rose-500/10",
        border: "border-rose-500/30",
        pulse: "bg-rose-400",
      };
  }
}

/**
 * Generates an external Google Maps turn-by-turn navigation deep link.
 * Strictly formats destination as lat,lng coordinates to guarantee Google Maps
 * can pinpoint the exact bay and calculate driving routes without search query failures.
 *
 * NOTE ON ORIGIN & LIVE LOCATION:
 * When isGpsActive is true and userCoords are provided, passes exact numeric GPS coordinates as origin.
 * When isGpsActive is false or omitted, origin is omitted so Google Maps prompts to turn on device
 * location and automatically starts navigation directly from the user's live current location ("Your location").
 */
export function getGoogleMapsNavigationUrl(
  destination: GeoLocation,
  spotName?: string,
  userCoords?: GeoLocation | null,
  isGpsActive?: boolean
): string {
  const destCoords = `${destination.lat},${destination.lng}`;
  const originParam =
    isGpsActive && userCoords && isFinite(userCoords.lat) && isFinite(userCoords.lng)
      ? `&origin=${userCoords.lat},${userCoords.lng}`
      : "";
  return `https://www.google.com/maps/dir/?api=1${originParam}&destination=${destCoords}&travelmode=driving`;
}

/**
 * Formats a raw vehicle plate number with standard spacing (e.g., "CH01AB1234" -> "CH 01 AB 1234")
 */
export function formatPlateNumber(plate: string): string {
  const clean = plate.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (clean.length <= 4) return clean;
  if (clean.length <= 6) return `${clean.slice(0, 2)} ${clean.slice(2)}`;
  if (clean.length <= 8) return `${clean.slice(0, 2)} ${clean.slice(2, 4)} ${clean.slice(4)}`;
  return `${clean.slice(0, 2)} ${clean.slice(2, 4)} ${clean.slice(4, 6)} ${clean.slice(6)}`;
}
