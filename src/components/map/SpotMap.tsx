"use client";

/**
 * @file src/components/map/SpotMap.tsx
 * @description Advanced interactive Leaflet map component with multi-style basemaps (Dark, Streets, Satellite),
 * zero-watermark tiles, live scroll-spy marker highlighting, hover synchronization, clustering, and viewport area search.
 *
 * @purpose
 * 1. Zero-watermark high-contrast basemaps (Cyber Dark OSM, Streets OSM, and Esri Satellite).
 * 2. Completely eliminates "Invalid LatLng object: (NaN, NaN)" crashes by:
 *    - Strict coordinate extraction & validation via `getSafeCoords`.
 *    - In-place marker icon and z-index updates instead of clearing cluster layers during active animations.
 *    - Bulletproof camera navigation using `map.setView` with container size and finite coordinate checks.
 *    - Strict coordinate validation on route polylines.
 * 3. Bidirectional interaction:
 *    - Clicking card moves camera and highlights pin.
 *    - Scrolling results updates active marker beacon.
 *    - Hovering card highlights marker with glow.
 *    - Clicking marker highlights card and scrolls it into view.
 *    - Cyan direction button draws route line + ETA on map and enables 1-click Google Maps navigation.
 *
 * @connections
 * - Dynamically loaded with ssr: false by /src/components/map/SpotMapWrapper.tsx
 * - Used in /src/app/finder/page.tsx
 * - Interacts with /src/store/useAppStore.ts for active navigation routing, hovered spot, and map bounds
 */

import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

import { useTheme } from "next-themes";
import { GeoLocation, Spot } from "@/types";
import { useAppStore } from "@/store/useAppStore";
import { getAvailabilityTier, getGoogleMapsNavigationUrl } from "@/lib/utils";
import {
  Zap,
  Navigation,
  Crosshair,
  Plus,
  Minus,
  Maximize2,
  Maximize,
  Minimize,
  Check,
  Compass,
  X,
  ExternalLink,
} from "lucide-react";

// Fix default Leaflet icon paths in Webpack bundles
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface SpotMapProps {
  spots: Spot[];
  userCoords: GeoLocation;
  selectedSpot: Spot | null;
  onSelectSpot: (spot: Spot) => void;
}

type BasemapStyle = "dark" | "streets" | "satellite";

/**
 * WHY: Robust helper to extract valid numeric [lat, lng] coordinates from any spot or location object.
 * Prevents Leaflet's fatal "Invalid LatLng object: (NaN, NaN)" runtime crash if an object has
 * flat lat/lng or nested location.lat/lng or string values.
 */
export function getSafeCoords(obj: unknown): [number, number] | null {
  if (!obj || typeof obj !== "object") return null;
  const o = obj as Record<string, unknown>;
  const loc = (o.location && typeof o.location === "object" ? o.location : o) as Record<string, unknown>;

  const latRaw = loc.lat ?? loc.latitude ?? o.lat;
  const lngRaw = loc.lng ?? loc.longitude ?? o.lng;

  const lat = typeof latRaw === "number" ? latRaw : parseFloat(String(latRaw));
  const lng = typeof lngRaw === "number" ? lngRaw : parseFloat(String(lngRaw));

  if (!isFinite(lat) || !isFinite(lng) || isNaN(lat) || isNaN(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return [lat, lng];
}

/**
 * WHY: Creates a custom HTML DivIcon color-coded green / yellow / red by slot availability,
 * with 'P' badge for parking and Lightning Bolt SVG for EV stations.
 * Includes distinct styling states for:
 * - isSelected (white glow ring, enlarged)
 * - isHovered (highlighted border and halo)
 * - isActiveInView (pulsing rust beacon ring when user scrolls to this card in the feed)
 */
function createSpotDivIcon(
  spot: Spot,
  isSelected: boolean,
  isHovered: boolean,
  isActiveInView: boolean
): L.DivIcon {
  const tier = getAvailabilityTier(spot.freeSlots, spot.totalSlots);
  const isEv = spot.type === "ev";

  // Capacity color coding rule
  let statusColor = "#10B981"; // Green: many free (>20%)
  let statusGlow = "rgba(16, 185, 129, 0.6)";
  if (tier === "low") {
    statusColor = "#F59E0B"; // Yellow/Amber: few free (1-20%)
    statusGlow = "rgba(245, 158, 11, 0.6)";
  } else if (tier === "full") {
    statusColor = "#EF4444"; // Red: completely full (0 free)
    statusGlow = "rgba(239, 68, 68, 0.6)";
  }

  // Dynamic border and scale based on selection, scroll-spy, and hover states
  let ringBorder = isEv ? "#00D2FF" : "#FF7A00";
  let scale = "scale(1)";
  let zIndex = 100;
  let beaconRingHtml = "";

  if (isSelected) {
    ringBorder = "#FFFFFF";
    scale = "scale(1.35)";
    zIndex = 10000;
    beaconRingHtml = `
      <div style="
        position: absolute;
        inset: -6px;
        border-radius: 50%;
        border: 2px solid ${isEv ? "#00D2FF" : "#C2603F"};
        animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        opacity: 0.75;
      "></div>
    `;
  } else if (isHovered) {
    ringBorder = "#FFFFFF";
    scale = "scale(1.25)";
    zIndex = 9999;
    statusGlow = isEv ? "rgba(0, 210, 255, 0.8)" : "rgba(255, 122, 0, 0.8)";
  } else if (isActiveInView) {
    // When card is actively centered in user's scrolling viewport
    ringBorder = "#C2603F";
    scale = "scale(1.2)";
    zIndex = 9500;
    beaconRingHtml = `
      <div class="marker-beacon-active" style="
        position: absolute;
        inset: -5px;
        border-radius: 50%;
        border: 2px solid #C2603F;
      "></div>
    `;
  }

  // Icon symbol: Bolt for EV, 'P' for Parking
  const symbolHtml = isEv
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="#00D2FF" stroke="#00D2FF" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`
    : `<span style="font-weight:900; font-size:12px; font-family:sans-serif; color:#FF7A00;">P</span>`;

  const html = `
    <div style="
      position: relative;
      transform: ${scale};
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      z-index: ${zIndex};
      cursor: pointer;
    ">
      ${beaconRingHtml}

      <!-- Glow & Outer Ring -->
      <div style="
        position: absolute;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background-color: #0c0c14;
        border: 2px solid ${ringBorder};
        box-shadow: 0 0 16px ${statusGlow};
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        ${symbolHtml}
      </div>

      <!-- Live Capacity Dot / Count Badge -->
      <div style="
        position: absolute;
        top: -4px;
        right: -4px;
        background-color: ${statusColor};
        color: #ffffff;
        font-family: monospace;
        font-size: 10px;
        font-weight: bold;
        min-width: 18px;
        height: 18px;
        line-height: 16px;
        text-align: center;
        border-radius: 9px;
        border: 1.5px solid #0c0c14;
        padding: 0 3px;
        box-shadow: 0 0 6px ${statusGlow};
      ">
        ${spot.freeSlots}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "custom-spot-marker",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -22],
  });
}

/**
 * WHY: Creates pulsing "You Are Here" driver location pin
 */
function createUserDivIcon(): L.DivIcon {
  const html = `
    <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
      <span style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background-color: rgba(0, 210, 255, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
      <span style="position: absolute; width: 18px; height: 18px; border-radius: 50%; background-color: rgba(0, 210, 255, 0.2); border: 1.5px solid rgba(0, 210, 255, 0.6);"></span>
      <span style="position: relative; width: 10px; height: 10px; border-radius: 50%; background-color: #00D2FF; border: 2px solid #ffffff; box-shadow: 0 0 10px #00D2FF;"></span>
    </div>
  `;
  return L.divIcon({
    html,
    className: "custom-user-marker",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

/**
 * WHY: Attaches ResizeObserver, handles map movements, bounds tracking, and safe camera panning.
 * Uses `map.setView` instead of raw `map.flyTo` to prevent "Invalid LatLng object: (NaN, NaN)"
 * calculation exceptions during layout changes.
 */
function MapController({
  spots,
  selectedSpot,
  userCoords,
}: {
  spots: Spot[];
  selectedSpot: Spot | null;
  userCoords: GeoLocation;
}) {
  const map = useMap();
  const setMapBounds = useAppStore((state) => state.setMapBounds);
  const hasFittedInitialBounds = useRef(false);

  // 1. Invalidate size on mount and on container resize
  useEffect(() => {
    if (!map) return;
    const container = map.getContainer();
    map.invalidateSize();

    const timer = setTimeout(() => {
      try {
        map.invalidateSize();
      } catch {}
    }, 150);

    const resizeObserver = new ResizeObserver(() => {
      try {
        map.invalidateSize();
      } catch {}
    });

    if (container) {
      resizeObserver.observe(container);
    }

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
    };
  }, [map]);

  // 2. Track map bounds whenever the user moves or zooms the map
  const updateBounds = useCallback(() => {
    if (!map) return;
    try {
      const bounds = map.getBounds();
      if (bounds) {
        setMapBounds({
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        });
      }
    } catch {}
  }, [map, setMapBounds]);

  useMapEvents({
    moveend: updateBounds,
    zoomend: updateBounds,
  });

  // Initial bounds broadcast
  useEffect(() => {
    updateBounds();
  }, [updateBounds]);

  // 3. Smoothly pan/center when a spot card is selected
  useEffect(() => {
    if (!selectedSpot || !map) return;
    const coords = getSafeCoords(selectedSpot);
    if (coords && isFinite(coords[0]) && isFinite(coords[1])) {
      try {
        const size = map.getSize();
        if (size.x > 0 && size.y > 0) {
          map.setView(coords, Math.max(map.getZoom(), 15), {
            animate: true,
          });
        }
      } catch (err) {
        console.warn("[SpotMap] camera centering failed:", err);
      }
    }
  }, [selectedSpot, map]);

  // 4. Fit bounds to results when spots load initially
  useEffect(() => {
    if (spots.length > 0 && !selectedSpot && !hasFittedInitialBounds.current && map) {
      const validPoints: [number, number][] = [];
      spots.forEach((s) => {
        const c = getSafeCoords(s);
        if (c && isFinite(c[0]) && isFinite(c[1])) validPoints.push(c);
      });
      const userC = getSafeCoords(userCoords);
      if (userC && isFinite(userC[0]) && isFinite(userC[1])) validPoints.push(userC);

      if (validPoints.length > 0) {
        try {
          const bounds = L.latLngBounds(validPoints);
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
          hasFittedInitialBounds.current = true;
        } catch (err) {
          console.warn("[SpotMap] initial fitBounds error:", err);
        }
      }
    }
  }, [spots, selectedSpot, userCoords, map]);

  return null;
}

/**
 * WHY: Robust Leaflet marker cluster manager.
 * CRUCIAL BUG FIX: Instead of clearing the entire cluster layer on every card hover,
 * selection, or scroll-spy change (which triggered Leaflet unspiderfy NaN exceptions),
 * markers are created once per spot ID and updated in-place using `marker.setIcon(...)`.
 */
function MarkerClusterManager({
  spots,
  selectedSpot,
  hoveredSpotId,
  activeInViewSpotId,
  onSelectSpot,
  onHoverSpot,
  openBookingModal,
}: {
  spots: Spot[];
  selectedSpot: Spot | null;
  hoveredSpotId: string | null;
  activeInViewSpotId: string | null;
  onSelectSpot: (spot: Spot) => void;
  onHoverSpot: (id: string | null) => void;
  openBookingModal: (spot: Spot) => void;
}) {
  const map = useMap();
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const markersRef = useRef<Map<string, { marker: L.Marker; spot: Spot }>>(new Map());

  // 1. Initialize Cluster Group once
  useEffect(() => {
    if (!clusterGroupRef.current && map) {
      clusterGroupRef.current = L.markerClusterGroup({
        maxClusterRadius: 35,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
      });
      map.addLayer(clusterGroupRef.current);
    }

    return () => {
      if (clusterGroupRef.current && map) {
        try {
          clusterGroupRef.current.clearLayers();
          map.removeLayer(clusterGroupRef.current);
        } catch {}
        clusterGroupRef.current = null;
      }
      markersRef.current.clear();
    };
  }, [map]);

  // 2. Synchronize markers only when `spots` list structure changes
  useEffect(() => {
    const clusterGroup = clusterGroupRef.current;
    if (!clusterGroup) return;

    const currentMarkers = markersRef.current;
    const newSpotIds = new Set(spots.map((s) => s.id));

    // Remove markers that are no longer in spots
    currentMarkers.forEach(({ marker }, id) => {
      if (!newSpotIds.has(id)) {
        try {
          clusterGroup.removeLayer(marker);
        } catch {}
        currentMarkers.delete(id);
      }
    });

    // Add or update markers
    spots.forEach((spot) => {
      const coords = getSafeCoords(spot);
      if (!coords || !isFinite(coords[0]) || !isFinite(coords[1])) return;

      if (!currentMarkers.has(spot.id)) {
        const isSelected = selectedSpot?.id === spot.id;
        const isHovered = hoveredSpotId === spot.id;
        const isActiveInView = activeInViewSpotId === spot.id;

        const icon = createSpotDivIcon(spot, isSelected, isHovered, isActiveInView);
        const marker = L.marker(coords, { icon });

        // Hover events
        marker.on("mouseover", () => onHoverSpot(spot.id));
        marker.on("mouseout", () => onHoverSpot(null));

        // Hover Tooltip
        const tier = getAvailabilityTier(spot.freeSlots, spot.totalSlots);
        const tierColor = tier === "high" ? "#10B981" : tier === "low" ? "#F59E0B" : "#EF4444";
        const priceText =
          spot.type === "ev"
            ? `₹${spot.pricing.perKwh || 18}/kWh`
            : `₹${spot.pricing.perHour}/hr`;

        marker.bindTooltip(
          `
          <div style="font-family: inherit; font-size: 11px; line-height: 1.3;">
            <div style="font-weight: 700; color: #ffffff; font-size: 12px;">${spot.name}</div>
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 3px;">
              <span style="color: ${tierColor}; font-weight: 700;">${spot.freeSlots}/${spot.totalSlots} free</span>
              <span style="color: #94a3b8; font-family: monospace;">${priceText}</span>
            </div>
          </div>
        `,
          {
            direction: "top",
            offset: [0, -20],
            className: "custom-spot-tooltip",
            opacity: 0.98,
          }
        );

        // Click Marker -> select spot
        marker.on("click", () => onSelectSpot(spot));

        // Popup with Actions
        const popupDiv = document.createElement("div");
        popupDiv.className = "p-2.5 text-xs font-sans max-w-xs space-y-2";
        popupDiv.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.15); padding-bottom:5px;">
            <strong style="font-size:12px; color:var(--text);">${spot.name}</strong>
            <span style="font-size:10px; font-weight:bold; padding:2px 6px; border-radius:4px; ${
              spot.type === "ev" ? "background:#00d2ff22; color:#00D2FF;" : "background:#ff7a0022; color:#FF7A00;"
            }">${spot.type.toUpperCase()}</span>
          </div>
          <p style="font-size:11px; color:var(--muted); margin:4px 0;">${spot.address}</p>
          <div style="display:flex; justify-content:space-between; font-family:monospace; font-size:11px; margin:6px 0; padding:4px 6px; border-radius:6px; background:rgba(255,255,255,0.05);">
            <span>Free: <strong style="color:${tierColor}">${spot.freeSlots}</strong>/${spot.totalSlots}</span>
            <span>Tariff: <strong>${priceText}</strong></span>
          </div>
          <div style="display:flex; gap:6px; margin-top:8px;">
            <button id="popup-btn-nav-${spot.id}" style="flex:1; padding:6px 8px; border-radius:6px; background:#1e293b; color:#00D2FF; font-weight:600; font-size:10px; border:1px solid rgba(0,210,255,0.3); cursor:pointer;">
              Google Maps
            </button>
            <button id="popup-btn-book-${spot.id}" style="flex:1; padding:6px 8px; border-radius:6px; background:#C2603F; color:#ffffff; font-weight:600; font-size:10px; border:none; cursor:pointer;">
              Reserve Bay
            </button>
          </div>
        `;

        marker.bindPopup(popupDiv, { maxWidth: 280 });

        marker.on("popupopen", () => {
          const navBtn = document.getElementById(`popup-btn-nav-${spot.id}`);
          const bookBtn = document.getElementById(`popup-btn-book-${spot.id}`);

          if (navBtn) {
            navBtn.onclick = () => {
              const destCoords = spot.location || { lat: coords[0], lng: coords[1] };
              const destUrl = getGoogleMapsNavigationUrl(destCoords, spot.name);
              window.open(destUrl, "_blank", "noopener,noreferrer");
            };
          }
          if (bookBtn) {
            bookBtn.onclick = () => {
              openBookingModal(spot);
            };
          }
        });

        try {
          clusterGroup.addLayer(marker);
          currentMarkers.set(spot.id, { marker, spot });
        } catch {}
      } else {
        // Update spot data reference
        const entry = currentMarkers.get(spot.id);
        if (entry) entry.spot = spot;
      }
    });
  }, [spots, onSelectSpot, onHoverSpot, openBookingModal]);

  // 3. Fast in-place icon updates when selection, hover, or scroll-spy state changes
  useEffect(() => {
    markersRef.current.forEach(({ marker, spot }) => {
      const isSelected = selectedSpot?.id === spot.id;
      const isHovered = hoveredSpotId === spot.id;
      const isActiveInView = activeInViewSpotId === spot.id;

      try {
        const icon = createSpotDivIcon(spot, isSelected, isHovered, isActiveInView);
        marker.setIcon(icon);

        if (isSelected) {
          marker.setZIndexOffset(10000);
        } else if (isHovered || isActiveInView) {
          marker.setZIndexOffset(5000);
        } else {
          marker.setZIndexOffset(0);
        }
      } catch {}
    });
  }, [selectedSpot, hoveredSpotId, activeInViewSpotId]);

  return null;
}

/**
 * WHY: Dedicated sub-component to render route polylines and fit camera to the route path.
 * Guarantees every single coordinate in the array is a valid finite number before Leaflet receives it.
 */
function RouteRenderer({
  routeCoordinates,
}: {
  routeCoordinates: [number, number][] | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || !routeCoordinates || routeCoordinates.length < 2) return;

    const validCoords = routeCoordinates.filter(
      (c) => Array.isArray(c) && isFinite(c[0]) && isFinite(c[1])
    );

    if (validCoords.length >= 2) {
      try {
        const bounds = L.latLngBounds(validCoords);
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
      } catch (err) {
        console.warn("[SpotMap] route fitBounds failed:", err);
      }
    }
  }, [routeCoordinates, map]);

  if (
    !routeCoordinates ||
    routeCoordinates.length < 2 ||
    !routeCoordinates.every((pt) => Array.isArray(pt) && isFinite(pt[0]) && isFinite(pt[1]))
  ) {
    return null;
  }

  return (
    <Polyline
      positions={routeCoordinates}
      pathOptions={{
        color: "#00D2FF",
        weight: 5,
        opacity: 0.9,
        dashArray: "1, 10",
      }}
    />
  );
}

export default function SpotMap({
  spots,
  userCoords,
  selectedSpot,
  onSelectSpot,
}: SpotMapProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const navigationRoute = useAppStore((state) => state.navigationRoute);
  const setNavigationRoute = useAppStore((state) => state.setNavigationRoute);
  const openBookingModal = useAppStore((state) => state.openBookingModal);
  const hoveredSpotId = useAppStore((state) => state.hoveredSpotId);
  const activeInViewSpotId = useAppStore((state) => state.activeInViewSpotId);
  const setHoveredSpotId = useAppStore((state) => state.setHoveredSpotId);
  const isFilterByMapArea = useAppStore((state) => state.isFilterByMapArea);
  const setIsFilterByMapArea = useAppStore((state) => state.setIsFilterByMapArea);
  const mapBounds = useAppStore((state) => state.mapBounds);
  const isGpsActive = useAppStore((state) => state.isGpsActive);

  const [basemapStyle, setBasemapStyle] = useState<BasemapStyle>("dark");
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][] | null>(null);
  const [routeEta, setRouteEta] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Safe normalized user coordinates
  const safeUserCoords = useMemo<[number, number]>(() => {
    return getSafeCoords(userCoords) || [30.7333, 76.7794];
  }, [userCoords]);

  // Sync default basemap with theme
  useEffect(() => {
    setBasemapStyle(isDark ? "dark" : "streets");
  }, [isDark]);

  // Count how many spots are currently within the map bounds
  const spotsInViewCount = useMemo(() => {
    if (!mapBounds) return spots.length;
    return spots.filter((s) => {
      const c = getSafeCoords(s);
      if (!c) return false;
      return (
        c[0] <= mapBounds.north &&
        c[0] >= mapBounds.south &&
        c[1] <= mapBounds.east &&
        c[1] >= mapBounds.west
      );
    }).length;
  }, [spots, mapBounds]);

  /**
   * WHY: Watermark-free, zero-API-key basemap endpoints:
   * 1. Dark Grid: OpenStreetMap with clean cyber-dark CSS inversion filter (no API key, no watermark)
   * 2. Streets: Standard OpenStreetMap raster tiles (no API key, no watermark)
   * 3. Satellite: Esri World Imagery (high-resolution aerial photography, no API key, no watermark)
   */
  const { tileUrl, tileAttribution, tileClassName } = useMemo(() => {
    if (basemapStyle === "satellite") {
      return {
        tileUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        tileAttribution:
          "&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
        tileClassName: "",
      };
    }

    if (basemapStyle === "streets") {
      return {
        tileUrl: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        tileAttribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        tileClassName: "",
      };
    }

    // Default: Dark Grid using OSM + high-contrast cyber dark filter
    return {
      tileUrl: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      tileAttribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      tileClassName: "osm-dark-tiles",
    };
  }, [basemapStyle]);

  // Fetch OSRM driving route with fallback to straight line
  useEffect(() => {
    if (!navigationRoute) {
      setRouteCoordinates(null);
      setRouteEta(null);
      return;
    }

    let isMounted = true;
    async function fetchRoute() {
      const startCoords = getSafeCoords(userCoords) || [30.7333, 76.7794];
      const destCoords = getSafeCoords(navigationRoute?.destination);

      if (!destCoords) {
        setRouteCoordinates(null);
        setRouteEta(null);
        return;
      }

      try {
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startCoords[1]},${startCoords[0]};${destCoords[1]},${destCoords[0]}?overview=full&geometries=geojson`;
        const res = await fetch(osrmUrl);
        const data = await res.json();

        if (isMounted && data.routes && data.routes[0]?.geometry?.coordinates) {
          const rawCoords = data.routes[0].geometry.coordinates;
          const validCoords: [number, number][] = [];
          for (const c of rawCoords) {
            const lat = Number(c[1]);
            const lng = Number(c[0]);
            if (isFinite(lat) && isFinite(lng) && !isNaN(lat) && !isNaN(lng)) {
              validCoords.push([lat, lng]);
            }
          }
          if (validCoords.length >= 2) {
            setRouteCoordinates(validCoords);
            const minutes = Math.max(1, Math.round(data.routes[0].duration / 60));
            setRouteEta(`${minutes} mins (${(data.routes[0].distance / 1000).toFixed(1)} km)`);
            return;
          }
        }
      } catch (err) {
        console.warn("[SpotMap] OSRM route fetch failed, falling back to straight-line:", err);
      }

      if (isMounted) {
        if (
          isFinite(startCoords[0]) &&
          isFinite(startCoords[1]) &&
          isFinite(destCoords[0]) &&
          isFinite(destCoords[1])
        ) {
          setRouteCoordinates([startCoords, destCoords]);
          setRouteEta("Est. 5-8 mins");
        } else {
          setRouteCoordinates(null);
          setRouteEta(null);
        }
      }
    }

    fetchRoute();
    return () => {
      isMounted = false;
    };
  }, [navigationRoute, userCoords]);

  const userMarkerIcon = useMemo(() => createUserDivIcon(), []);

  // Fullscreen container handler
  const toggleFullscreen = () => {
    if (!mapContainerRef.current) return;
    if (!document.fullscreenElement) {
      mapContainerRef.current.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div
      ref={mapContainerRef}
      className={`relative w-full h-full min-h-[420px] rounded-2xl overflow-hidden border border-border shadow-2xl bg-surface-subtle ${
        isFullscreen ? "fixed inset-0 z-[9999] rounded-none border-none" : ""
      }`}
    >
      {/* 1. Dynamic "Search in this area" Floating Pill */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsFilterByMapArea(!isFilterByMapArea)}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md shadow-2xl border transition-all flex items-center gap-1.5 active:scale-95 ${
            isFilterByMapArea
              ? "bg-rust text-white border-rust shadow-glow-rust"
              : "bg-surface/90 hover:bg-surface text-text border-border hover:border-rust"
          }`}
        >
          {isFilterByMapArea ? (
            <>
              <Check className="w-3.5 h-3.5 text-white" />
              <span>Filtering by Map Area ({spotsInViewCount} Hubs)</span>
            </>
          ) : (
            <>
              <Compass className="w-3.5 h-3.5 text-rust animate-spin-slow" />
              <span>Filter List to This Map View ({spotsInViewCount})</span>
            </>
          )}
        </button>
      </div>

      {/* 2. Basemap Style Switcher (Dark Grid, Streets, Satellite) */}
      <div className="absolute top-3 right-3 z-20 p-1 rounded-xl bg-surface/90 border border-border shadow-2xl backdrop-blur-md flex items-center gap-1">
        <button
          type="button"
          onClick={() => setBasemapStyle("dark")}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
            basemapStyle === "dark"
              ? "bg-surface-2 text-cyan-400 border border-cyan-500/30 font-bold shadow-sm"
              : "text-muted hover:text-text"
          }`}
          title="Cyber Dark Basemap"
        >
          🌙 Dark
        </button>
        <button
          type="button"
          onClick={() => setBasemapStyle("streets")}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
            basemapStyle === "streets"
              ? "bg-surface-2 text-amber-400 border border-amber-500/30 font-bold shadow-sm"
              : "text-muted hover:text-text"
          }`}
          title="OpenStreetMap Streets"
        >
          🗺️ Streets
        </button>
        <button
          type="button"
          onClick={() => setBasemapStyle("satellite")}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
            basemapStyle === "satellite"
              ? "bg-surface-2 text-emerald-400 border border-emerald-500/30 font-bold shadow-sm"
              : "text-muted hover:text-text"
          }`}
          title="Esri Satellite Imagery"
        >
          🛰️ Sat
        </button>
      </div>

      {/* 3. Sleek Arranged Google Maps Live Navigation Box with Dismiss */}
      {navigationRoute && routeEta && (
        <div className="absolute top-14 left-3 z-20 max-w-[320px] sm:max-w-xs w-auto rounded-2xl bg-surface/95 border border-cyan-500/40 shadow-2xl backdrop-blur-xl p-3 space-y-2 text-xs">
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 shrink-0">
                <Navigation className="w-4 h-4 animate-pulse" />
              </div>
              <div className="overflow-hidden">
                <div className="font-bold text-text text-xs leading-tight truncate">
                  {navigationRoute.spotName}
                </div>
                <p className="text-[11px] font-mono text-cyan-400 mt-0.5">
                  ETA: {routeEta}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setNavigationRoute(null)}
              title="Close route"
              className="p-1 rounded-lg hover:bg-surface-2 text-muted hover:text-text transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-border/50">
            <button
              type="button"
              onClick={() => {
                const url = getGoogleMapsNavigationUrl(
                  navigationRoute.destination,
                  navigationRoute.spotName,
                  userCoords,
                  isGpsActive
                );
                window.open(url, "_blank", "noopener,noreferrer");
              }}
              className="flex-1 py-1.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-glow-sm transition-all active:scale-95"
            >
              <span>Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setNavigationRoute(null)}
              className="py-1.5 px-2.5 rounded-xl bg-surface-2 hover:bg-surface text-muted hover:text-text border border-border text-xs font-medium transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* 4. Map Action Controls (Recenter, Zoom, Fit, Fullscreen) */}
      <div className="absolute bottom-6 right-4 z-20 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={toggleFullscreen}
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Map"}
          className="p-2 rounded-xl bg-surface/90 hover:bg-surface border border-border text-text shadow-xl backdrop-blur-md transition-all active:scale-95"
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={() => {
            const mapEl = document.querySelector(".leaflet-container") as HTMLElement & {
              _leaflet_map?: L.Map;
            };
            if (mapEl?._leaflet_map) {
              try {
                mapEl._leaflet_map.zoomIn();
              } catch {}
            }
          }}
          title="Zoom In"
          className="p-2 rounded-xl bg-surface/90 hover:bg-surface border border-border text-text shadow-xl backdrop-blur-md transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => {
            const mapEl = document.querySelector(".leaflet-container") as HTMLElement & {
              _leaflet_map?: L.Map;
            };
            if (mapEl?._leaflet_map) {
              try {
                mapEl._leaflet_map.zoomOut();
              } catch {}
            }
          }}
          title="Zoom Out"
          className="p-2 rounded-xl bg-surface/90 hover:bg-surface border border-border text-text shadow-xl backdrop-blur-md transition-all active:scale-95"
        >
          <Minus className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => {
            const mapEl = document.querySelector(".leaflet-container") as HTMLElement & {
              _leaflet_map?: L.Map;
            };
            if (mapEl?._leaflet_map && spots.length > 0) {
              const validPoints: [number, number][] = [];
              spots.forEach((s) => {
                const c = getSafeCoords(s);
                if (c && isFinite(c[0]) && isFinite(c[1])) validPoints.push(c);
              });
              if (validPoints.length > 0) {
                try {
                  const bounds = L.latLngBounds(validPoints);
                  mapEl._leaflet_map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
                } catch {}
              }
            }
          }}
          title="Fit All Spots in View"
          className="p-2 rounded-xl bg-surface/90 hover:bg-surface border border-border text-text shadow-xl backdrop-blur-md transition-all active:scale-95"
        >
          <Maximize2 className="w-4 h-4 text-amber-400" />
        </button>

        <button
          type="button"
          onClick={() => {
            const mapEl = document.querySelector(".leaflet-container") as HTMLElement & {
              _leaflet_map?: L.Map;
            };
            if (mapEl?._leaflet_map && isFinite(safeUserCoords[0]) && isFinite(safeUserCoords[1])) {
              try {
                mapEl._leaflet_map.setView(safeUserCoords as L.LatLngTuple, 14, { animate: true });
              } catch {}
            }
          }}
          title="Recenter to My Location"
          className="p-2 rounded-xl bg-surface/90 hover:bg-surface border border-border text-text shadow-xl backdrop-blur-md transition-all active:scale-95"
        >
          <Crosshair className="w-4 h-4 text-cyan-400" />
        </button>
      </div>

      {/* 5. Map Legend */}
      <div className="absolute bottom-6 left-4 z-20 px-3 py-2 rounded-xl bg-surface/90 border border-border shadow-xl backdrop-blur-md text-[11px] font-mono text-text flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981]" />
          <span>&gt;20% Free</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_#F59E0B]" />
          <span>1-20%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#EF4444]" />
          <span>Full</span>
        </div>
      </div>

      {/* Leaflet Map Surface */}
      <MapContainer
        center={safeUserCoords}
        zoom={13}
        scrollWheelZoom={true}
        zoomControl={false}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution={tileAttribution}
          url={tileUrl}
          className={tileClassName}
        />

        <MapController spots={spots} selectedSpot={selectedSpot} userCoords={userCoords} />

        <MarkerClusterManager
          spots={spots}
          selectedSpot={selectedSpot}
          hoveredSpotId={hoveredSpotId}
          activeInViewSpotId={activeInViewSpotId}
          onSelectSpot={onSelectSpot}
          onHoverSpot={setHoveredSpotId}
          openBookingModal={openBookingModal}
        />

        {/* User Current Location Pin */}
        {isFinite(safeUserCoords[0]) && isFinite(safeUserCoords[1]) && (
          <Marker position={safeUserCoords} icon={userMarkerIcon} />
        )}

        {/* Driving Route Polyline & Bounds */}
        <RouteRenderer routeCoordinates={routeCoordinates} />
      </MapContainer>
    </div>
  );
}
