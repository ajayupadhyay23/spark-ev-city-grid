"use client";

/**
 * @file src/app/finder/page.tsx
 * @description Main Urban Grid Finder Page (/finder).
 * @purpose Implements the high-productivity 3-zone layout on desktop (Sticky Filters 300px, Results 420px, Full Sticky Map),
 * tablet slide-over drawers, and mobile draggable bottom-sheets (Framer Motion drag with snap points).
 * Strictly starts below the floating navbar with pt-[var(--nav-h)], includes the top search and territory bar,
 * active filter chips with 1-click removal, geolocation fallback banners, and two-way card-marker synchronization.
 *
 * Enhanced scrolling and finding capabilities:
 * - Live scroll-spy IntersectionObserver: automatically highlights corresponding map markers as cards scroll into view.
 * - Dynamic Viewport Area Search: "Filter list to map view" dynamically updates cards to only visible spots as the user pans/zooms.
 * - Bidirectional hover: Hovering a card or marker immediately highlights its counterpart.
 * - Quick scroll-to-top floating button and quick category pills.
 *
 * @connections
 * - Interacts with /src/store/useAppStore.ts
 * - Uses /src/hooks/useGeolocation.ts for device coordinates
 * - Renders /src/components/map/SpotMapWrapper.tsx
 * - Renders /src/components/spots/SpotCard.tsx, SpotDrawer.tsx, FilterSidebar.tsx
 * - Renders /src/components/booking/BookingWizard.tsx
 */

import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  Map as MapIcon,
  List,
  SlidersHorizontal,
  X,
  Zap,
  Car,
  Loader2,
  AlertCircle,
  RefreshCw,
  Search,
  MapPin,
  ChevronRight,
  Info,
  ArrowUp,
  CheckCircle2,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useLiveAvailability } from "@/hooks/useLiveAvailability";
import { useGeolocation } from "@/hooks/useGeolocation";
import { Spot } from "@/types";
import SpotCard from "@/components/spots/SpotCard";
import SpotDrawer from "@/components/spots/SpotDrawer";
import FilterSidebar from "@/components/spots/FilterSidebar";
import SpotMap from "@/components/map/SpotMapWrapper";
import BookingWizard from "@/components/booking/BookingWizard";
import LiveBadge from "@/components/spots/LiveBadge";
import { staggerContainerVariant } from "@/lib/animations";
import indiaLocations from "@/data/india-locations.json";

export default function FinderPage() {
  const {
    filters,
    spots,
    selectedSpot,
    isDrawerOpen,
    isBookingModalOpen,
    activeBookingSpot,
    isFilterByMapArea,
    mapBounds,
    setSpots,
    selectSpot,
    setDrawerOpen,
    closeBookingModal,
    updateFilter,
    resetFilters,
    setActiveInViewSpotId,
    setIsFilterByMapArea,
    isGpsActive,
  } = useAppStore();

  const { stats, isUpdating } = useLiveAvailability(6000);
  const { requestLocation, isLocating, isUsingFallback, fallbackReason } = useGeolocation();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showFallbackBanner, setShowFallbackBanner] = useState<boolean>(true);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

  // Responsive Drawer and Modal toggles
  const [tabletFilterOpen, setTabletFilterOpen] = useState(false);
  const [mobileFilterModalOpen, setMobileFilterModalOpen] = useState(false);

  // Card element refs container for bidirectional scroll-into-view
  const cardsContainerRef = useRef<HTMLDivElement>(null);

  // State & District Cascading Dropdowns for Top Bar
  const selectedStateObj = useMemo(() => {
    const sName = filters.selectedState || "Chandigarh (UT)";
    return indiaLocations.states.find((s) => s.name === sName);
  }, [filters.selectedState]);

  const districtsList = selectedStateObj ? selectedStateObj.districts : [];

  // Fetch spots based on whether user selected Demo Dataset or Live OSM Grid
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      setError(null);

      try {
        if (filters.dataSource === "live_osm") {
          // Query real OpenStreetMap Overpass places
          const params = new URLSearchParams();
          if (filters.selectedState) params.set("state", filters.selectedState);
          if (filters.selectedDistrict) params.set("district", filters.selectedDistrict);
          if (filters.type !== "all") params.set("kind", filters.type);

          const res = await fetch(`/api/places?${params.toString()}`);
          const data = await res.json();

          if (isMounted) {
            if (data.success && data.places) {
              const convertedSpots: Spot[] = data.places.map(
                (p: {
                  id: string;
                  name: string;
                  type: "parking" | "ev";
                  lat: number;
                  lng: number;
                  address: string;
                  operator?: string;
                  capacity?: number;
                }) => ({
                  id: p.id,
                  name: p.name,
                  address: p.address,
                  type: p.type,
                  location: { lat: p.lat, lng: p.lng },
                  totalSlots: p.capacity || (p.type === "ev" ? 6 : 40),
                  freeSlots: Math.max(
                    1,
                    Math.floor((p.capacity || (p.type === "ev" ? 6 : 40)) * 0.45)
                  ),
                  occupiedSlots: Math.floor(
                    (p.capacity || (p.type === "ev" ? 6 : 40)) * 0.55
                  ),
                  rating: 4.2 + (Math.random() * 0.7),
                  reviewCount: 30 + Math.floor(Math.random() * 200),
                  photos: [
                    "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=600&q=80",
                  ],
                  pricing: {
                    perHour: p.type === "ev" ? 50 : 30,
                    perDay: p.type === "ev" ? 400 : 200,
                    evPerKwh: p.type === "ev" ? 18 : undefined,
                    idleFeePerMin: p.type === "ev" ? 5 : undefined,
                  },
                  amenities: ["cctv", "24x7", "disabled-access"],
                  parkingType: p.type === "parking" ? "open" : undefined,
                  chargers:
                    p.type === "ev"
                      ? [
                          {
                            id: `c_${p.id}_1`,
                            type: "CCS2",
                            powerKw: 60,
                            speed: "fast",
                            status: "available",
                            pricePerKwh: 18,
                          },
                          {
                            id: `c_${p.id}_2`,
                            type: "Type 2",
                            powerKw: 22,
                            speed: "slow",
                            status: "occupied",
                            pricePerKwh: 15,
                          },
                        ]
                      : undefined,
                  openingHours: "24/7",
                  state: filters.selectedState,
                  district: filters.selectedDistrict,
                })
              );

              setSpots(convertedSpots);

              if (convertedSpots.length > 0) {
                updateFilter("userCoords", convertedSpots[0].location);
              }
            } else {
              setError(data.error || "No facilities found for this region.");
            }
          }
        } else {
          // Fetch from mock database API
          const params = new URLSearchParams();
          if (filters.searchQuery) params.set("q", filters.searchQuery);
          if (filters.type !== "all") params.set("type", filters.type);
          if (filters.onlyAvailable) params.set("onlyAvailable", "true");
          if (filters.maxPrice < 300) params.set("maxPrice", filters.maxPrice.toString());
          if (filters.parkingTypes.length) params.set("parkingTypes", filters.parkingTypes.join(","));
          if (filters.chargerTypes.length) params.set("chargerTypes", filters.chargerTypes.join(","));
          if (filters.chargingSpeeds.length) params.set("chargingSpeeds", filters.chargingSpeeds.join(","));
          if (filters.amenities.length) params.set("amenities", filters.amenities.join(","));
          if (filters.selectedDistrict) params.set("district", filters.selectedDistrict);
          params.set("sortBy", filters.sortBy);

          const res = await fetch(`/api/spots?${params.toString()}`);
          const data = await res.json();

          if (isMounted) {
            if (data.success && data.spots) {
              setSpots(data.spots);
            } else {
              setError(data.error || "Failed to load spots.");
            }
          }
        }
      } catch {
        if (isMounted) setError("Network error loading facilities.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    const timer = setTimeout(loadData, 180);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [filters, setSpots, updateFilter]);

  // Compute displayed spots based on whether "Filter list to map view" is active
  const displayedSpots = useMemo(() => {
    if (!isFilterByMapArea || !mapBounds) return spots;
    return spots.filter(
      (s) =>
        s.location.lat <= mapBounds.north &&
        s.location.lat >= mapBounds.south &&
        s.location.lng <= mapBounds.east &&
        s.location.lng >= mapBounds.west
    );
  }, [spots, isFilterByMapArea, mapBounds]);

  /**
   * WHY: Live Scroll-Spy IntersectionObserver
   * Observes all visible cards in the middle results list.
   * As the user scrolls, it detects which card is currently in view and
   * updates `activeInViewSpotId` in Zustand, which triggers a pulsing beacon on the corresponding map pin!
   */
  useEffect(() => {
    const container = cardsContainerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((e) => e.isIntersecting);
        if (visibleEntries.length > 0) {
          visibleEntries.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
          const spotId = visibleEntries[0].target.getAttribute("data-spot-id");
          if (spotId) {
            setActiveInViewSpotId(spotId);
          }
        }
      },
      {
        root: container,
        rootMargin: "-5% 0px -40% 0px",
        threshold: [0.15, 0.4, 0.7],
      }
    );

    const cards = container.querySelectorAll("[data-spot-id]");
    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, [displayedSpots, setActiveInViewSpotId]);

  // Two-way synchronization: When marker selects a spot, scroll corresponding card into view
  const handleSelectSpot = (spot: Spot) => {
    selectSpot(spot);
    const cardEl = document.getElementById(`spot-card-${spot.id}`);
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // Compile active filter chips
  const activeChips = useMemo(() => {
    const list: { label: string; onRemove: () => void }[] = [];

    if (filters.type !== "all") {
      list.push({
        label: `Category: ${filters.type.toUpperCase()}`,
        onRemove: () => updateFilter("type", "all"),
      });
    }

    if (filters.onlyAvailable) {
      list.push({
        label: "Vacant Only",
        onRemove: () => updateFilter("onlyAvailable", false),
      });
    }

    if (filters.maxPrice < 300) {
      list.push({
        label: `Under ₹${filters.maxPrice}`,
        onRemove: () => updateFilter("maxPrice", 300),
      });
    }

    if (filters.maxDistanceKm < 50) {
      list.push({
        label: `Within ${filters.maxDistanceKm}km`,
        onRemove: () => updateFilter("maxDistanceKm", 50),
      });
    }

    filters.parkingTypes.forEach((pt) => {
      list.push({
        label: pt,
        onRemove: () =>
          updateFilter(
            "parkingTypes",
            filters.parkingTypes.filter((i) => i !== pt)
          ),
      });
    });

    filters.chargerTypes.forEach((ct) => {
      list.push({
        label: ct,
        onRemove: () =>
          updateFilter(
            "chargerTypes",
            filters.chargerTypes.filter((i) => i !== ct)
          ),
      });
    });

    filters.amenities.forEach((am) => {
      list.push({
        label: am.replace("-", " "),
        onRemove: () =>
          updateFilter(
            "amenities",
            filters.amenities.filter((i) => i !== am)
          ),
      });
    });

    return list;
  }, [filters, updateFilter]);

  const scrollToTop = () => {
    cardsContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex flex-col pt-[var(--nav-h)] h-[100dvh] w-full overflow-hidden bg-bg">
      {/* 1. Top Controls Bar: Category, Search Box, State/District Dropdowns, Use My Location */}
      <div className="px-4 py-2.5 border-b border-border bg-surface flex-shrink-0 z-20">
        <div className="max-w-[1600px] mx-auto w-full flex flex-wrap items-center justify-between gap-3">
          {/* Segmented Control: All / Parking / EV */}
          <div className="flex items-center p-1 rounded-xl bg-surface-2 border border-border">
            <button
              type="button"
              onClick={() => updateFilter("type", "all")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                filters.type === "all"
                  ? "bg-surface text-text font-bold shadow-sm"
                  : "text-muted hover:text-text"
              }`}
            >
              All Hubs
            </button>
            <button
              type="button"
              onClick={() => updateFilter("type", "parking")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                filters.type === "parking"
                  ? "bg-amber-500/20 text-amber-400 font-bold shadow-glow-parking"
                  : "text-muted hover:text-text"
              }`}
            >
              <Car className="w-3.5 h-3.5 text-amber-400" />
              <span>Parking</span>
            </button>
            <button
              type="button"
              onClick={() => updateFilter("type", "ev")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                filters.type === "ev"
                  ? "bg-cyan-500/20 text-cyan-400 font-bold shadow-glow-ev"
                  : "text-muted hover:text-text"
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>EV</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search area, mall, or station..."
              value={filters.searchQuery}
              onChange={(e) => updateFilter("searchQuery", e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surface-2 border border-border text-xs text-text placeholder-muted focus:outline-none focus:border-rust"
            />
            {filters.searchQuery && (
              <button
                type="button"
                onClick={() => updateFilter("searchQuery", "")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-text"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* State & District Selectors */}
          <div className="flex items-center gap-2">
            <select
              value={filters.selectedState}
              onChange={(e) => {
                const newState = e.target.value;
                updateFilter("selectedState", newState);
                const sObj = indiaLocations.states.find((s) => s.name === newState);
                if (sObj && sObj.districts.length > 0) {
                  updateFilter("selectedDistrict", sObj.districts[0]);
                }
              }}
              className="bg-surface-2 border border-border rounded-xl px-2.5 py-1.5 text-xs text-text font-medium focus:outline-none focus:border-rust"
            >
              {indiaLocations.states.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>

            <select
              value={filters.selectedDistrict}
              onChange={(e) => updateFilter("selectedDistrict", e.target.value)}
              className="bg-surface-2 border border-border rounded-xl px-2.5 py-1.5 text-xs text-text font-medium focus:outline-none focus:border-rust"
            >
              {districtsList.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Use My Location Trigger */}
          <button
            type="button"
            onClick={requestLocation}
            disabled={isLocating}
            title={
              isGpsActive
                ? "GPS active: locked onto your live location"
                : "Click to turn on device location & navigate from your current position"
            }
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-60 shadow-sm ${
              isGpsActive
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-glow-sm"
                : "bg-surface-2 hover:bg-surface border-border text-text hover:border-cyan-400"
            }`}
          >
            {isLocating ? (
              <Loader2 className="w-3.5 h-3.5 text-rust animate-spin" />
            ) : isGpsActive ? (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            ) : (
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span>
              {isLocating
                ? "Locating..."
                : isGpsActive
                ? "My Live Location On"
                : "Turn On My Location"}
            </span>
          </button>
        </div>

        {/* Fallback City Center Notice Banner */}
        {isUsingFallback && showFallbackBanner && (
          <div className="max-w-[1600px] mx-auto mt-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <span>
                Using city centre instead ({fallbackReason || "Default location applied"}).
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowFallbackBanner(false)}
              className="text-amber-400 hover:text-text p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Active Filter Chips Ribbon */}
        {activeChips.length > 0 && (
          <div className="max-w-[1600px] mx-auto w-full flex items-center gap-1.5 overflow-x-auto pt-2 text-xs scrollbar-thin">
            <span className="text-[11px] font-mono text-muted uppercase shrink-0">Active:</span>

            {activeChips.map((chip, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-2 border border-border text-[11px] text-text font-mono shrink-0"
              >
                <span>{chip.label}</span>
                <button
                  type="button"
                  onClick={chip.onRemove}
                  className="p-0.5 text-muted hover:text-rose-400 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            <button
              type="button"
              onClick={resetFilters}
              className="text-[11px] font-mono text-rust hover:underline ml-2 shrink-0 font-bold"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* 2. Main Desktop 3-Column Layout (Height = 100dvh - nav) */}
      <div className="flex-1 w-full max-w-[1600px] mx-auto flex overflow-hidden min-h-0 relative">
        {/* Column 1: Desktop Sticky Filter Sidebar (300px, own scroll) */}
        <aside className="hidden xl:block w-[300px] flex-shrink-0 h-full border-r border-border overflow-y-auto p-4 scrollbar-thin bg-surface/50">
          <FilterSidebar />
        </aside>

        {/* Column 2: Middle Results Feed (~440px, own scroll, scroll-spy enabled) */}
        <main
          ref={cardsContainerRef}
          onScroll={(e) => {
            setShowScrollTop(e.currentTarget.scrollTop > 260);
          }}
          className="relative w-full md:w-[420px] lg:w-[440px] flex-shrink-0 h-full overflow-y-auto p-4 scrollbar-thin space-y-3 z-10 bg-bg/95 md:border-r border-border smooth-scroll"
        >
          {/* Header above results: count, map filter state & sort priority */}
          <div className="sticky top-0 z-20 pb-2 pt-1 bg-bg/95 backdrop-blur-md border-b border-border/60 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-text">
                  {displayedSpots.length}{" "}
                  {isFilterByMapArea ? `of ${spots.length} in View` : "Hubs Found"}
                </span>
                <LiveBadge />
                {isUpdating && (
                  <span className="text-[10px] text-cyan-400 font-mono flex items-center gap-1 animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  </span>
                )}
              </div>

              <select
                value={filters.sortBy}
                onChange={(e) =>
                  updateFilter(
                    "sortBy",
                    e.target.value as "nearest" | "cheapest" | "availability"
                  )
                }
                className="bg-surface-2 border border-border rounded-lg px-2 py-1 text-text text-[11px] focus:outline-none focus:border-rust"
              >
                <option value="nearest">Nearest</option>
                <option value="cheapest">Cheapest</option>
                <option value="availability">Most Available</option>
              </select>
            </div>

            {/* Quick Filter Pills for rapid browsing while scrolling */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono no-scrollbar">
              <button
                type="button"
                onClick={() => updateFilter("onlyAvailable", !filters.onlyAvailable)}
                className={`px-2 py-0.5 rounded-md border whitespace-nowrap transition-all ${
                  filters.onlyAvailable
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 font-bold"
                    : "bg-surface-2 border-border text-muted hover:text-text"
                }`}
              >
                🟢 Available Only
              </button>

              {isFilterByMapArea && (
                <button
                  type="button"
                  onClick={() => setIsFilterByMapArea(false)}
                  className="px-2 py-0.5 rounded-md bg-rust/20 border border-rust/40 text-rust font-bold whitespace-nowrap"
                >
                  Clear Map Filter ✕
                </button>
              )}
            </div>
          </div>

          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-surface border border-border space-y-3 animate-pulse"
              >
                <div className="flex justify-between">
                  <div className="h-4 w-24 bg-border rounded-full" />
                  <div className="h-4 w-12 bg-border rounded-full" />
                </div>
                <div className="h-5 w-3/4 bg-border rounded-lg" />
                <div className="h-3 w-1/2 bg-border rounded-md" />
                <div className="h-2 w-full bg-border rounded-full" />
              </div>
            ))
          ) : error ? (
            <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
              <p className="font-semibold text-xs">{error}</p>
              <button
                type="button"
                onClick={resetFilters}
                className="px-3 py-1.5 rounded-lg bg-surface border border-border text-xs text-text font-mono hover:bg-surface-2"
              >
                Reset to Demo Grid
              </button>
            </div>
          ) : displayedSpots.length === 0 ? (
            <div className="p-8 rounded-2xl bg-surface border border-border text-center space-y-3">
              <Compass className="w-8 h-8 text-muted mx-auto" />
              <h3 className="font-bold text-text text-sm">
                {isFilterByMapArea
                  ? "No facilities inside visible map area"
                  : "No facilities match your filters"}
              </h3>
              <p className="text-xs text-muted max-w-xs mx-auto">
                {isFilterByMapArea
                  ? "Zoom out or pan the map to bring more hubs into view, or clear map area filtering."
                  : "Try expanding search radius, clearing connector filters, or switching district."}
              </p>
              <button
                type="button"
                onClick={() => {
                  if (isFilterByMapArea) {
                    setIsFilterByMapArea(false);
                  } else {
                    resetFilters();
                  }
                }}
                className="px-4 py-2 rounded-xl bg-rust text-white text-xs font-semibold shadow-glow-rust"
              >
                {isFilterByMapArea ? "Show All City Hubs" : "Reset Filters"}
              </button>
            </div>
          ) : (
            <motion.div
              variants={staggerContainerVariant}
              initial="hidden"
              animate="visible"
              className="space-y-3"
            >
              {displayedSpots.map((spot) => (
                <div key={spot.id} id={`spot-card-${spot.id}`} data-spot-id={spot.id}>
                  <SpotCard
                    spot={spot}
                    isSelected={selectedSpot?.id === spot.id}
                    onSelect={() => handleSelectSpot(spot)}
                  />
                </div>
              ))}
            </motion.div>
          )}

          {/* Floating Smooth Scroll to Top Button */}
          {showScrollTop && (
            <button
              type="button"
              onClick={scrollToTop}
              title="Scroll to top of results"
              className="sticky bottom-4 left-full -ml-12 z-30 p-2.5 rounded-full bg-rust hover:bg-rust-hover text-white shadow-2xl transition-all active:scale-95 animate-bounce-short"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          )}
        </main>

        {/* Column 3: Full Sticky Map (Fills remaining width, height matches parent) */}
        <section className="hidden md:block flex-1 h-full relative overflow-hidden bg-surface-subtle">
          <SpotMap
            spots={displayedSpots}
            userCoords={filters.userCoords || { lat: 30.7333, lng: 76.7794 }}
            selectedSpot={selectedSpot}
            onSelectSpot={handleSelectSpot}
          />
        </section>

        {/* Mobile View: Map on top half, Draggable Bottom Sheet on bottom half */}
        <div className="md:hidden absolute inset-0 flex flex-col">
          {/* Top Half: Mobile Map */}
          <div className="h-1/2 w-full relative">
            <SpotMap
              spots={displayedSpots}
              userCoords={filters.userCoords || { lat: 30.7333, lng: 76.7794 }}
              selectedSpot={selectedSpot}
              onSelectSpot={handleSelectSpot}
            />
          </div>

          {/* Bottom Half: Draggable Results Bottom Sheet */}
          <motion.div
            drag="y"
            dragConstraints={{ top: -150, bottom: 200 }}
            className="h-1/2 w-full bg-surface border-t border-border rounded-t-3xl p-4 overflow-y-auto shadow-2xl space-y-3 z-20"
          >
            {/* Grab handle pill */}
            <div className="w-12 h-1.5 rounded-full bg-border mx-auto mb-1" />

            <div className="flex justify-between items-center text-xs font-mono pb-2 border-b border-border">
              <span className="font-bold text-text">
                {displayedSpots.length} Facilities Found
              </span>
              <button
                type="button"
                onClick={() => setTabletFilterOpen(true)}
                className="text-rust font-bold flex items-center gap-1"
              >
                <SlidersHorizontal className="w-3 h-3" /> Filters
              </button>
            </div>

            {displayedSpots.map((spot) => (
              <div
                key={spot.id}
                id={`spot-card-mobile-${spot.id}`}
                data-spot-id={spot.id}
              >
                <SpotCard
                  spot={spot}
                  isSelected={selectedSpot?.id === spot.id}
                  onSelect={() => handleSelectSpot(spot)}
                />
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Slide-over Spot Detail Drawer */}
      <SpotDrawer
        spot={selectedSpot}
        isOpen={isDrawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          selectSpot(null);
        }}
      />

      {/* Multi-step Booking Wizard Modal */}
      {isBookingModalOpen && activeBookingSpot && (
        <BookingWizard
          spot={activeBookingSpot}
          isOpen={isBookingModalOpen}
          onClose={closeBookingModal}
        />
      )}

      {/* Tablet / Mobile Slide-over Filter Drawer */}
      <AnimatePresence>
        {tabletFilterOpen && (
          <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setTabletFilterOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Slide-over Content */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-xs h-full bg-surface border-r border-border p-5 overflow-y-auto z-10 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                <span className="font-bold text-sm text-text">Refine Results</span>
                <button
                  type="button"
                  onClick={() => setTabletFilterOpen(false)}
                  className="p-1 rounded-lg text-muted hover:text-text"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <FilterSidebar />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}