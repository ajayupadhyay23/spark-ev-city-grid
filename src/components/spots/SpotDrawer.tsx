"use client";

/**
 * @file src/components/spots/SpotDrawer.tsx
 * @description Slide-over drawer detailing spot pricing, live charger ports, amenities, and navigation routes.
 * @purpose Allows drivers to inspect deep technical specifications (charger connectors, idle fees,
 * opening hours) without losing their current search map context.
 * Features an intuitive "← Back to Results" action bar, backdrop click-to-close, and keyboard Escape listener.
 *
 * @connections
 * - Interacts with /src/store/useAppStore.ts
 * - Generates Google Maps turn-by-turn navigation deep links
 */

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ArrowLeft,
  MapPin,
  Star,
  Clock,
  Zap,
  Navigation,
  ExternalLink,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import { Spot } from "@/types";
import { useAppStore } from "@/store/useAppStore";
import { slideOverDrawerVariant } from "@/lib/animations";
import { getGoogleMapsNavigationUrl } from "@/lib/utils";
import ProgressBar from "@/components/ui/ProgressBar";
import LiveBadge from "./LiveBadge";

interface SpotDrawerProps {
  spot: Spot | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function SpotDrawer({ spot, isOpen, onClose }: SpotDrawerProps) {
  const setNavigationRoute = useAppStore((state) => state.setNavigationRoute);
  const openBookingModal = useAppStore((state) => state.openBookingModal);
  const userCoords = useAppStore((state) => state.filters.userCoords);
  const isGpsActive = useAppStore((state) => state.isGpsActive);
  const setIsGpsActive = useAppStore((state) => state.setIsGpsActive);
  const updateFilter = useAppStore((state) => state.updateFilter);

  // Close drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!spot) return null;

  const isEv = spot.type === "ev";
  const destCoords = spot.location || {
    lat: (spot as unknown as { lat: number }).lat,
    lng: (spot as unknown as { lng: number }).lng,
  };
  const googleMapsUrl = getGoogleMapsNavigationUrl(destCoords, spot.name, userCoords, isGpsActive);

  const handleNavigate = () => {
    // If device location is not yet active, turn on browser location in background
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

    setNavigationRoute({
      destination: destCoords,
      spotName: spot.name,
    });
    window.open(googleMapsUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Universal Backdrop: Clicking outside anywhere closes drawer and goes back */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-[55]"
          />

          {/* Drawer container: starts below the 64px navbar so the action bar is never occluded */}
          <motion.aside
            variants={slideOverDrawerVariant}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed top-16 sm:top-[68px] bottom-0 right-0 z-[60] w-full max-w-md bg-surface border-l border-t border-border shadow-2xl rounded-tl-2xl flex flex-col justify-between overflow-hidden"
          >
            {/* Sticky Top "Back to Results" Action Bar */}
            <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-surface border-b border-border shadow-sm">
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-surface-2 hover:bg-border text-text border border-border text-xs font-bold transition-all active:scale-95 shadow-sm"
              >
                <ArrowLeft className="w-4 h-4 text-rust" />
                <span>Back to Results</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close drawer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-2 hover:bg-border text-muted hover:text-text border border-border text-xs font-semibold transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Close</span>
              </button>
            </div>

            {/* Visual Gradient Header */}
            <div className="relative h-32 w-full bg-surface-subtle overflow-hidden flex-shrink-0">
              <div className={`absolute inset-0 bg-gradient-to-br ${spot.gradient} opacity-60`} />
              <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />

              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider font-bold flex items-center gap-1.5 ${
                    isEv
                      ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                      : "bg-amber-500/20 text-amber-500 dark:text-amber-300 border border-amber-500/40"
                  }`}
                >
                  {isEv ? <Zap className="w-3.5 h-3.5" /> : null}
                  {isEv ? "EV Fast Station" : `${spot.parkingType || "Secure"} Parking`}
                </span>

                <LiveBadge />
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">
              <div>
                <h2 className="text-xl font-bold font-sans text-text leading-tight">
                  {spot.name}
                </h2>
                <p className="text-xs text-muted flex items-center gap-1.5 mt-1.5">
                  <MapPin className="w-4 h-4 text-muted shrink-0" />
                  <span>{spot.address}, {spot.city}</span>
                </p>

                <div className="flex items-center gap-4 mt-3 text-xs font-mono text-muted">
                  <div className="flex items-center gap-1 text-amber-400 font-bold">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{spot.rating.toFixed(1)}</span>
                    <span className="text-muted font-normal">({spot.reviewCount} reviews)</span>
                  </div>

                  <div className="flex items-center gap-1 text-muted">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{spot.openingHours}</span>
                  </div>
                </div>
              </div>

              {/* Real-Time Capacity Progress */}
              <div className="p-4 rounded-xl bg-surface-subtle border border-border space-y-2">
                <ProgressBar free={spot.freeSlots} total={spot.totalSlots} />
              </div>

              {/* Pricing Breakdown */}
              <div className="space-y-2">
                <h3 className="text-xs font-mono uppercase tracking-wider text-muted font-bold">
                  Pricing Schedule
                </h3>
                <div className="rounded-xl border border-border overflow-hidden divide-y divide-border bg-surface-subtle text-xs">
                  <div className="p-3 flex justify-between items-center">
                    <span className="text-muted">Standard Hourly Rate</span>
                    <span className="font-mono font-bold text-text">₹{spot.pricing.perHour}/hr</span>
                  </div>
                  {spot.pricing.perDay && (
                    <div className="p-3 flex justify-between items-center">
                      <span className="text-muted">Full-Day Flat Rate</span>
                      <span className="font-mono font-bold text-text">₹{spot.pricing.perDay}/day</span>
                    </div>
                  )}
                  {spot.pricing.perKwh && (
                    <div className="p-3 flex justify-between items-center">
                      <span className="text-muted">EV Power Tariff</span>
                      <span className="font-mono font-bold text-cyan-400">₹{spot.pricing.perKwh}/kWh</span>
                    </div>
                  )}
                  {spot.pricing.idleFeePerMin && (
                    <div className="p-3 flex justify-between items-center">
                      <span className="text-muted">Post-Charge Idle Fee</span>
                      <span className="font-mono font-bold text-amber-400">₹{spot.pricing.idleFeePerMin}/min</span>
                    </div>
                  )}
                </div>
              </div>

              {/* EV Chargers Port List */}
              {isEv && spot.chargers && spot.chargers.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-muted font-bold flex items-center justify-between">
                    <span>Available Plugs & Connectors</span>
                    <span className="text-cyan-400">{spot.chargers.length} Ports Total</span>
                  </h3>

                  <div className="space-y-2">
                    {spot.chargers.map((c) => {
                      const isAvail = c.status === "available";
                      return (
                        <div
                          key={c.id}
                          className={`p-3 rounded-xl border flex items-center justify-between text-xs font-mono transition-colors ${
                            isAvail
                              ? "bg-cyan-500/10 border-cyan-500/30 text-text"
                              : "bg-surface-subtle border-border text-muted"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Zap className={`w-4 h-4 ${isAvail ? "text-cyan-400" : "text-muted"}`} />
                            <div>
                              <div className="font-bold flex items-center gap-1.5">
                                <span>{c.type}</span>
                                <span className="text-[10px] text-muted font-normal">({c.powerKw} kW)</span>
                              </div>
                              <span className="text-[10px] text-muted capitalize">{c.speed}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                                isAvail
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                  : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                              }`}
                            >
                              {c.status}
                            </span>
                            <p className="text-[10px] text-muted mt-0.5">₹{c.pricePerKwh}/kWh</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Amenities */}
              <div className="space-y-2">
                <h3 className="text-xs font-mono uppercase tracking-wider text-muted font-bold">
                  On-Site Amenities
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {spot.amenities.map((amenity, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-surface-subtle border border-border text-text text-xs flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-rust" />
                      <span className="capitalize">{amenity.replace("-", " ")}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="p-4 border-t border-border bg-surface-subtle flex items-center gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={handleNavigate}
                className="flex-1 py-2.5 px-4 rounded-xl border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-semibold flex items-center justify-center gap-2 transition-colors active:scale-95"
              >
                <Navigation className="w-4 h-4 text-cyan-400" />
                <span>Navigate</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </button>

              <button
                type="button"
                onClick={() => openBookingModal(spot)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rust hover:bg-rust-hover text-white text-xs font-semibold shadow-glow-rust flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Calendar className="w-4 h-4" />
                <span>Reserve Spot</span>
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
