"use client";

/**
 * @file src/components/spots/SpotCard.tsx
 * @description Interactive spot result card with color glow, live scroll-spy highlight, and bidirectional map hover.
 * @purpose Renders parking lot or EV station summary in the Finder feed.
 * Features distance and driving ETA, capacity progress bar, charger chips with strike-through
 * occupied indicators, "Simulated live" badge, Navigate button, and direct Reserve button.
 * Synchronizes with map markers via `hoveredSpotId` and `activeInViewSpotId` in Zustand.
 *
 * @connections
 * - Used in /src/app/finder/page.tsx
 * - Connected to /src/components/map/SpotMap.tsx via /src/store/useAppStore.ts
 */

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Zap, MapPin, Star, Navigation, ArrowRight, Eye } from "lucide-react";
import { Spot } from "@/types";
import { cardHoverMotion } from "@/lib/animations";
import ProgressBar from "@/components/ui/ProgressBar";
import LiveBadge from "./LiveBadge";
import { useAppStore } from "@/store/useAppStore";
import { calculateDistanceKm, getGoogleMapsNavigationUrl } from "@/lib/utils";

interface SpotCardProps {
  spot: Spot;
  isSelected: boolean;
  onSelect: () => void;
}

export default function SpotCard({ spot, isSelected, onSelect }: SpotCardProps) {
  const isEv = spot.type === "ev";
  const openBookingModal = useAppStore((state) => state.openBookingModal);
  const setNavigationRoute = useAppStore((state) => state.setNavigationRoute);
  const userCoords = useAppStore((state) => state.filters.userCoords);
  const isGpsActive = useAppStore((state) => state.isGpsActive);
  const setIsGpsActive = useAppStore((state) => state.setIsGpsActive);
  const updateFilter = useAppStore((state) => state.updateFilter);
  const hoveredSpotId = useAppStore((state) => state.hoveredSpotId);
  const setHoveredSpotId = useAppStore((state) => state.setHoveredSpotId);
  const activeInViewSpotId = useAppStore((state) => state.activeInViewSpotId);

  const isHovered = hoveredSpotId === spot.id;
  const isActiveInView = activeInViewSpotId === spot.id;

  // Calculate distance and driving ETA from user position
  const { distanceStr, etaStr } = useMemo(() => {
    if (!userCoords) return { distanceStr: null, etaStr: null };
    const km = calculateDistanceKm(userCoords, spot.location);
    const etaMin = Math.max(2, Math.round(km * 2.2)); // Approx 25-30 km/h city driving
    return {
      distanceStr: `${km.toFixed(1)} km`,
      etaStr: `${etaMin} mins drive`,
    };
  }, [userCoords, spot.location]);

  // Dynamic glow depending on selection, scroll-spy, and hover states
  let glowBorderClass = "border-border";
  if (isSelected) {
    glowBorderClass = isEv
      ? "border-cyan-400 shadow-glow-ev ring-2 ring-cyan-400/60 bg-surface-2"
      : "border-amber-400 shadow-glow-parking ring-2 ring-amber-400/60 bg-surface-2";
  } else if (isHovered) {
    glowBorderClass = isEv
      ? "border-cyan-400 shadow-glow-ev ring-1 ring-cyan-400/40 bg-surface-2"
      : "border-amber-400 shadow-glow-parking ring-1 ring-amber-400/40 bg-surface-2";
  } else if (isActiveInView) {
    glowBorderClass = "border-rust ring-1 ring-rust/50 shadow-md";
  } else {
    glowBorderClass = isEv
      ? "hover:border-cyan-500/50 hover:shadow-glow-ev"
      : "hover:border-amber-500/50 hover:shadow-glow-parking";
  }

  const handleNavigateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const destCoords = spot.location || {
      lat: (spot as unknown as { lat: number }).lat,
      lng: (spot as unknown as { lng: number }).lng,
    };

    // If user's device GPS is not yet active, turn on browser location in background
    if (!isGpsActive && typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const liveLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          updateFilter("userCoords", liveLoc);
          setIsGpsActive(true);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }

    // 1. Draw route line + ETA on Leaflet map
    setNavigationRoute({
      destination: destCoords,
      spotName: spot.name,
    });
    onSelect();

    // 2. Open Google Maps turn-by-turn navigation deep link starting from device's live current location
    const navUrl = getGoogleMapsNavigationUrl(destCoords, spot.name, userCoords, isGpsActive);
    window.open(navUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <motion.div
      variants={cardHoverMotion}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      onClick={onSelect}
      onMouseEnter={() => setHoveredSpotId(spot.id)}
      onMouseLeave={() => setHoveredSpotId(null)}
      className={`relative p-4 rounded-2xl bg-surface border cursor-pointer transition-all duration-200 flex flex-col justify-between gap-3 shadow-sm ${glowBorderClass} ${
        isActiveInView ? "border-l-4 border-l-rust" : ""
      }`}
    >
      {/* Scroll indicator pill when card is actively in view */}
      {isActiveInView && !isSelected && (
        <div className="absolute -top-2.5 right-4 z-10 px-2 py-0.5 rounded-full bg-rust text-[9px] font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1 shadow-sm">
          <Eye className="w-2.5 h-2.5" />
          <span>In View</span>
        </div>
      )}

      {/* Card Header: Type Badge, Simulated LIVE, and Rating */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold flex items-center gap-1 ${
              isEv
                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                : "bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/30"
            }`}
          >
            {isEv ? <Zap className="w-3 h-3 text-cyan-400" /> : null}
            {isEv ? "EV Hub" : spot.parkingType ? `${spot.parkingType} Parking` : "Parking"}
          </span>

          <div className="flex items-center gap-1">
            <LiveBadge />
            <span className="text-[9px] font-mono text-muted uppercase">Simulated Live</span>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1 text-xs text-amber-400 font-mono">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>{spot.rating.toFixed(1)}</span>
          <span className="text-muted text-[10px]">({spot.reviewCount})</span>
        </div>
      </div>

      {/* Spot Title, Address & Distance/ETA */}
      <div>
        <h3 className="text-sm sm:text-base font-bold text-text leading-tight group-hover:text-cyan-400 transition-colors">
          {spot.name}
        </h3>

        <div className="flex items-center justify-between gap-2 mt-1 text-xs text-muted">
          <p className="flex items-center gap-1 truncate">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-muted" />
            <span className="truncate">{spot.address}</span>
          </p>

          {distanceStr && (
            <span className="shrink-0 text-[11px] font-mono text-cyan-400 font-medium">
              {distanceStr} • {etaStr}
            </span>
          )}
        </div>
      </div>

      {/* EV Charger Summary Chips (Strikethrough = occupied) */}
      {isEv && spot.chargers && (
        <div className="space-y-1">
          <div className="flex flex-wrap gap-1.5">
            {spot.chargers.slice(0, 4).map((charger, idx) => {
              const isAvailable = charger.status === "available";
              return (
                <span
                  key={idx}
                  title={isAvailable ? "Available to plug in" : "Currently Occupied by another vehicle"}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all ${
                    isAvailable
                      ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 font-semibold"
                      : "bg-surface-subtle border-border text-muted line-through opacity-70"
                  }`}
                >
                  {charger.type} • {charger.powerKw}kW
                </span>
              );
            })}
            {spot.chargers.length > 4 && (
              <span className="px-1.5 py-0.5 text-[10px] font-mono text-muted">
                +{spot.chargers.length - 4} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Live Capacity Progress Bar */}
      <ProgressBar free={spot.freeSlots} total={spot.totalSlots} />

      {/* Footer: Rate, Navigate Shortcut, and Reserve Button */}
      <div className="pt-2 border-t border-border flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] text-muted font-mono uppercase">Starting from</span>
          <span className="text-sm font-bold font-mono text-text">
            ₹{isEv ? `${spot.pricing.perKwh}/kWh` : `${spot.pricing.perHour}/hr`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Navigate Icon Button */}
          <button
            type="button"
            onClick={handleNavigateClick}
            title="Draw route line & navigate"
            className="p-2 rounded-xl bg-surface-subtle hover:bg-border border border-border text-text transition-colors"
          >
            <Navigation className="w-3.5 h-3.5 text-cyan-400" />
          </button>

          {/* Reserve CTA */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openBookingModal(spot);
            }}
            className="px-3.5 py-1.5 rounded-full bg-rust hover:bg-rust-hover text-white text-xs font-semibold shadow-glow-rust transition-all active:scale-95 flex items-center gap-1"
          >
            Reserve <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}