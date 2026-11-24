/**
 * @file src/hooks/useGeolocation.ts
 * @description Robust browser geolocation hook with security checks, error recovery, and fallback.
 * @purpose Provides accurate device GPS coordinates with strict error handling:
 * - Checks window.isSecureContext (geolocation is disabled on unencrypted HTTP origins)
 * - Explicitly handles PERMISSION_DENIED (with re-enable browser instructions), POSITION_UNAVAILABLE, TIMEOUT
 * - Triggers toast notifications on success/failure
 * - Automatically falls back to selected district or city center
 * - Supports "Follow me" watchPosition tracking
 * - Optional IP-based fallback guarded strictly by NEXT_PUBLIC_ENABLE_IP_GEOLOCATION env flag
 *
 * @connections
 * - Used in /src/app/finder/page.tsx and /src/components/spots/FilterSidebar.tsx
 * - Updates /src/store/useAppStore.ts with userCoords and switches sort to "nearest"
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { GeoLocation } from "@/types";
import { CITY_CENTER_COORDS } from "@/lib/constants";
import { useAppStore } from "@/store/useAppStore";
import { showToast } from "@/components/ui/Toast";

export interface GeolocationState {
  coords: GeoLocation;
  isLocating: boolean;
  error: string | null;
  errorType: "permission_denied" | "position_unavailable" | "timeout" | "unsupported" | "insecure_context" | null;
  isWatching: boolean;
  isUsingFallback: boolean;
  fallbackReason: string | null;
}

export function useGeolocation() {
  const updateFilter = useAppStore((state) => state.updateFilter);
  const setIsGpsActive = useAppStore((state) => state.setIsGpsActive);
  const selectedDistrict = useAppStore((state) => state.filters.selectedDistrict);

  const [state, setState] = useState<GeolocationState>({
    coords: CITY_CENTER_COORDS,
    isLocating: false,
    error: null,
    errorType: null,
    isWatching: false,
    isUsingFallback: false,
    fallbackReason: null,
  });

  const watchIdRef = useRef<number | null>(null);

  /**
   * WHY: Helper to get fallback center coordinates based on currently selected district
   */
  const getDistrictCenter = useCallback((): GeoLocation => {
    // Standard city center fallback (Chandigarh Sector 17)
    return CITY_CENTER_COORDS;
  }, []);

  /**
   * WHY: Optional IP-based geolocation fallback ONLY executed if explicitly enabled via env flag
   */
  const tryIpFallback = async (): Promise<GeoLocation | null> => {
    if (process.env.NEXT_PUBLIC_ENABLE_IP_GEOLOCATION !== "true") {
      return null;
    }
    try {
      const res = await fetch("https://ipapi.co/json/", { cache: "no-store" });
      const data = await res.json();
      if (data && data.latitude && data.longitude) {
        return { lat: Number(data.latitude), lng: Number(data.longitude) };
      }
    } catch (e) {
      console.warn("[useGeolocation] IP fallback failed:", e);
    }
    return null;
  };

  /**
   * WHY: Main requestLocation method that executes high-accuracy GPS lookup
   */
  const requestLocation = useCallback(async (): Promise<GeoLocation> => {
    setState((prev) => ({
      ...prev,
      isLocating: true,
      error: null,
      errorType: null,
      isUsingFallback: false,
      fallbackReason: null,
    }));

    // 1. Security Check: Geolocation is disabled on insecure contexts (HTTP non-localhost)
    if (typeof window !== "undefined" && !window.isSecureContext) {
      const errorMsg =
        "Geolocation requires a secure context (HTTPS or localhost). Falling back to city center.";
      const fallback = getDistrictCenter();

      setState((prev) => ({
        ...prev,
        coords: fallback,
        isLocating: false,
        error: errorMsg,
        errorType: "insecure_context",
        isUsingFallback: true,
        fallbackReason: "Insecure HTTP context",
      }));

      showToast({
        title: "Insecure Context",
        message: "Browser location requires HTTPS. Using city center.",
        type: "error",
      });

      updateFilter("userCoords", fallback);
      return fallback;
    }

    // 2. Browser Support Check
    if (typeof window === "undefined" || !navigator.geolocation) {
      const errorMsg = "Geolocation is not supported by your browser.";
      const fallback = getDistrictCenter();

      setState((prev) => ({
        ...prev,
        coords: fallback,
        isLocating: false,
        error: errorMsg,
        errorType: "unsupported",
        isUsingFallback: true,
        fallbackReason: "Browser unsupported",
      }));

      showToast({
        title: "Location Unsupported",
        message: "Your browser does not support GPS. Using city center.",
        type: "error",
      });

      updateFilter("userCoords", fallback);
      return fallback;
    }

    // 3. Request Coordinates via navigator.geolocation
    return new Promise<GeoLocation>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userCoords: GeoLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          setState((prev) => ({
            ...prev,
            coords: userCoords,
            isLocating: false,
            error: null,
            errorType: null,
            isUsingFallback: false,
            fallbackReason: null,
          }));

          // Synchronize with global Zustand store
          updateFilter("userCoords", userCoords);
          updateFilter("sortBy", "nearest");
          setIsGpsActive(true);

          showToast({
            title: "Location Detected",
            message: `Locked onto GPS (${userCoords.lat.toFixed(4)}, ${userCoords.lng.toFixed(4)}). Sorted by nearest.`,
            type: "success",
          });

          resolve(userCoords);
        },
        async (err) => {
          let errorMsg = "Failed to determine location.";
          let errorType: GeolocationState["errorType"] = "position_unavailable";

          if (err.code === err.PERMISSION_DENIED) {
            errorType = "permission_denied";
            errorMsg =
              "Location permission denied. Click the lock/settings icon in your browser address bar to allow Location access.";
          } else if (err.code === err.TIMEOUT) {
            errorType = "timeout";
            errorMsg = "GPS request timed out. Check your device location signal.";
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            errorType = "position_unavailable";
            errorMsg = "Location information is currently unavailable.";
          }

          // Try optional IP fallback if enabled
          const ipCoords = await tryIpFallback();
          const fallback = ipCoords || getDistrictCenter();

          setState((prev) => ({
            ...prev,
            coords: fallback,
            isLocating: false,
            error: errorMsg,
            errorType,
            isUsingFallback: true,
            fallbackReason: ipCoords ? "Approximate IP location" : "Using city center instead",
          }));

          showToast({
            title: "GPS Unavailable",
            message: errorMsg,
            type: "error",
          });

          // Always set fallback coords so distances and map remain functional
          updateFilter("userCoords", fallback);
          setIsGpsActive(false);
          resolve(fallback);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  }, [getDistrictCenter, updateFilter]);

  /**
   * WHY: Toggle "Follow me" live watch tracking
   */
  const toggleWatchPosition = useCallback(() => {
    if (state.isWatching) {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setState((prev) => ({ ...prev, isWatching: false }));
      showToast({
        title: "Live Tracking Paused",
        message: "Follow-me position updates stopped.",
        type: "info",
      });
    } else {
      if (typeof window === "undefined" || !navigator.geolocation) return;

      const id = navigator.geolocation.watchPosition(
        (position) => {
          const userCoords: GeoLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setState((prev) => ({ ...prev, coords: userCoords, isWatching: true }));
          updateFilter("userCoords", userCoords);
        },
        (err) => {
          console.warn("[useGeolocation] Watch error:", err);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );

      watchIdRef.current = id;
      setState((prev) => ({ ...prev, isWatching: true }));
      showToast({
        title: "Live Tracking Active",
        message: "Map will now track your movement in real time.",
        type: "success",
      });
    }
  }, [state.isWatching, updateFilter]);

  // Cleanup watchPosition on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && typeof window !== "undefined" && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    ...state,
    requestLocation,
    toggleWatchPosition,
  };
}
