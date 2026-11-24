"use client";

/**
 * @file src/app/spot/[id]/page.tsx
 * @description Dedicated standalone details page for a specific parking lot or EV station.
 * @purpose Enables deep linking and direct booking. Displays photos as gradient placeholders,
 * live slot capacity with animated progress bars, full pricing tables, technical charger specs,
 * customer reviews summary, and a deep-link Google Maps navigate button.
 *
 * @connections
 * - Fetches from /api/spots/[id]
 * - Interacts with /src/store/useAppStore.ts for booking
 */

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Star,
  Clock,
  Zap,
  Navigation,
  ShieldCheck,
  Calendar,
  AlertCircle,
  Loader2,
  ExternalLink,
  DollarSign,
  Layers,
} from "lucide-react";
import { Spot } from "@/types";
import { useAppStore } from "@/store/useAppStore";
import ProgressBar from "@/components/ui/ProgressBar";
import LiveBadge from "@/components/spots/LiveBadge";
import BookingWizard from "@/components/booking/BookingWizard";
import { getGoogleMapsNavigationUrl } from "@/lib/utils";

export default function SpotDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [spot, setSpot] = useState<Spot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { isBookingModalOpen, openBookingModal, closeBookingModal } = useAppStore();

  useEffect(() => {
    let isMounted = true;
    async function fetchSpot() {
      try {
        const res = await fetch(`/api/spots/${id}`);
        const data = await res.json();
        if (isMounted) {
          if (data.success && data.spot) {
            setSpot(data.spot);
          } else {
            setError(data.error || "Facility not found.");
          }
        }
      } catch {
        if (isMounted) setError("Network error loading facility details.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    if (id) fetchSpot();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen pt-28 pb-16 px-4 flex flex-col items-center justify-center text-muted gap-3">
        <Loader2 className="w-8 h-8 text-rust animate-spin" />
        <span className="text-xs font-mono uppercase tracking-wider">
          Retrieving live telemetry & pricing...
        </span>
      </div>
    );
  }

  if (error || !spot) {
    return (
      <div className="min-h-screen pt-28 pb-16 px-4 max-w-md mx-auto text-center space-y-4">
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <h2 className="font-bold text-base">Facility Unavailable</h2>
          <p className="text-xs mt-1">{error || "Could not find spot record."}</p>
        </div>
        <Link
          href="/finder"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface border border-border text-xs text-text hover:bg-surface-2 transition-colors font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Finder</span>
        </Link>
      </div>
    );
  }

  const isEv = spot.type === "ev";
  const navUrl = getGoogleMapsNavigationUrl(spot.location);

  return (
    <div className="flex-1 pt-24 pb-16 px-4 max-w-4xl mx-auto w-full space-y-6">
      {/* Back Link */}
      <Link
        href="/finder"
        className="inline-flex items-center gap-2 text-xs font-mono text-muted hover:text-text transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Grid Radar</span>
      </Link>

      {/* Main Hero Header Card */}
      <div className="relative rounded-3xl overflow-hidden border border-border bg-surface shadow-2xl">
        {/* Photo Gradient Placeholders Carousel / Banner */}
        <div className={`h-48 w-full bg-gradient-to-br ${spot.gradient} opacity-85 relative`}>
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
          <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between">
            <span
              className={`px-3 py-1 rounded-full text-xs font-mono uppercase font-bold flex items-center gap-1.5 ${
                isEv
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                  : "bg-amber-500/20 text-amber-500 border border-amber-500/40"
              }`}
            >
              {isEv ? <Zap className="w-4 h-4 text-cyan-400" /> : null}
              {isEv ? "EV Fast Charging Station" : `${spot.parkingType || "Open"} Parking`}
            </span>
            <LiveBadge />
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold font-sans text-text">{spot.name}</h1>
              <p className="text-xs sm:text-sm text-muted flex items-center gap-1.5 mt-1">
                <MapPin className="w-4 h-4 text-muted shrink-0" />
                <span>
                  {spot.address}, {spot.city}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <a
                href={navUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-4 rounded-xl border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Navigation className="w-4 h-4 text-cyan-400" />
                <span>GPS Directions</span>
                <ExternalLink className="w-3.5 h-3.5 text-cyan-400/60" />
              </a>

              <button
                onClick={() => openBookingModal(spot)}
                className="py-2.5 px-6 rounded-xl bg-rust hover:bg-rust-hover text-white text-xs font-semibold shadow-glow-rust flex items-center gap-1.5 transition-all active:scale-95"
              >
                <Calendar className="w-4 h-4" />
                <span>Reserve Bay</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-surface-2 border border-border font-mono text-xs">
            <div>
              <span className="text-muted block text-[10px] uppercase">Rating</span>
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                {spot.rating.toFixed(1)} ({spot.reviewCount} reviews)
              </span>
            </div>

            <div>
              <span className="text-muted block text-[10px] uppercase">Hours</span>
              <span className="text-text font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-muted" />
                {spot.openingHours}
              </span>
            </div>

            <div>
              <span className="text-muted block text-[10px] uppercase">Pricing</span>
              <span className="text-text font-bold">
                ₹{isEv ? `${spot.pricing.perKwh}/kWh` : `${spot.pricing.perHour}/hr`}
              </span>
            </div>

            <div>
              <span className="text-muted block text-[10px] uppercase">Vacant Bays</span>
              <span className="text-emerald-500 font-bold">
                {spot.freeSlots} of {spot.totalSlots} Free
              </span>
            </div>
          </div>

          {/* Live Progress Bar */}
          <ProgressBar free={spot.freeSlots} total={spot.totalSlots} />

          {/* Comprehensive Pricing Table */}
          <div className="space-y-3 pt-4 border-t border-border">
            <h2 className="text-sm font-mono uppercase tracking-wider text-text font-bold flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-rust" />
              Standard Tariff Schedule
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-surface-2 border border-border">
                <span className="text-muted block text-[10px] uppercase">Hourly Rate</span>
                <span className="text-text font-bold text-sm">₹{spot.pricing.perHour}/hr</span>
              </div>
              {spot.pricing.perDay && (
                <div className="p-3 rounded-xl bg-surface-2 border border-border">
                  <span className="text-muted block text-[10px] uppercase">Full Day Pass</span>
                  <span className="text-text font-bold text-sm">₹{spot.pricing.perDay}/day</span>
                </div>
              )}
              {spot.pricing.perKwh && (
                <div className="p-3 rounded-xl bg-surface-2 border border-border">
                  <span className="text-muted block text-[10px] uppercase">Energy Rate</span>
                  <span className="text-cyan-400 font-bold text-sm">₹{spot.pricing.perKwh}/kWh</span>
                </div>
              )}
              {spot.pricing.idleFeePerMin && (
                <div className="p-3 rounded-xl bg-surface-2 border border-border">
                  <span className="text-muted block text-[10px] uppercase">Idle Grace Fee</span>
                  <span className="text-amber-400 font-bold text-sm">₹{spot.pricing.idleFeePerMin}/min</span>
                </div>
              )}
            </div>
          </div>

          {/* EV Charger Specifications */}
          {isEv && spot.chargers && spot.chargers.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-border">
              <h2 className="text-sm font-mono uppercase tracking-wider text-text font-bold flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-cyan-400" />
                Connector Protocols & Real-Time Availability
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {spot.chargers.map((c) => (
                  <div
                    key={c.id}
                    className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-mono ${
                      c.status === "available"
                        ? "bg-cyan-500/10 border-cyan-500/30 text-text"
                        : "bg-surface-2 border-border text-muted"
                    }`}
                  >
                    <div>
                      <span className="font-bold text-sm">{c.type}</span>
                      <span className="text-[10px] text-muted block">
                        {c.powerKw} kW • {c.speed}
                      </span>
                    </div>
                    <div className="text-right">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.status === "available"
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30"
                            : "bg-rose-500/10 text-rose-500 border border-rose-500/30"
                        }`}
                      >
                        {c.status.toUpperCase()}
                      </span>
                      <span className="text-muted block text-[10px] mt-0.5">₹{c.pricePerKwh}/kWh</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Amenities */}
          <div className="space-y-3 pt-4 border-t border-border">
            <h2 className="text-sm font-mono uppercase tracking-wider text-text font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-rust" />
              Facility Features & Amenities
            </h2>
            <div className="flex flex-wrap gap-2">
              {spot.amenities.map((amenity, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-xl bg-surface-2 border border-border text-xs text-text flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-rust" />
                  <span className="capitalize">{amenity.replace("-", " ")}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Booking Wizard Modal */}
      {isBookingModalOpen && (
        <BookingWizard spot={spot} isOpen={isBookingModalOpen} onClose={closeBookingModal} />
      )}
    </div>
  );
}
