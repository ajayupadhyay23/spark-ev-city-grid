"use client";

/**
 * @file src/components/spots/FilterSidebar.tsx
 * @description Collapsible accordion filter sidebar for Finder (/finder).
 * @purpose Implements fine-grained search controls organized into collapsible accordions:
 * Category, Location, Sort, Hourly Rate, Distance Radius, Structure, Charger Type, and Amenities.
 * Integrates with useGeolocation for 1-click GPS detection with loading spinners and error guidance.
 *
 * @connections
 * - Interacts with /src/store/useAppStore.ts for filter state
 * - Uses /src/data/india-locations.json for cascading State & District lists
 * - Uses /src/hooks/useGeolocation.ts for device positioning
 */

import React, { useState, useMemo } from "react";
import {
  Search,
  MapPin,
  SlidersHorizontal,
  RotateCcw,
  Zap,
  Car,
  Layers,
  ChevronDown,
  Globe,
  Check,
  Loader2,
  Navigation,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useGeolocation } from "@/hooks/useGeolocation";
import indiaLocations from "@/data/india-locations.json";
import {
  ALL_AMENITIES,
  ALL_CHARGER_TYPES,
  ALL_CHARGING_SPEEDS,
  ALL_PARKING_TYPES,
} from "@/lib/constants";
import { Amenity, ChargerType, ChargingSpeed, ParkingType } from "@/types";

export default function FilterSidebar() {
  const filters = useAppStore((state) => state.filters);
  const updateFilter = useAppStore((state) => state.updateFilter);
  const resetFilters = useAppStore((state) => state.resetFilters);
  const isGpsActive = useAppStore((state) => state.isGpsActive);

  const { requestLocation, isLocating, toggleWatchPosition, isWatching } = useGeolocation();

  // Accordion section collapse state
  const [openSections, setOpenSections] = useState({
    type: true,
    location: true,
    sort: true,
    price: true,
    distance: true,
    structure: false,
    chargers: false,
    amenities: false,
  });

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // State & District Cascading Dropdowns
  const selectedStateObj = useMemo(() => {
    const sName = filters.selectedState || "Chandigarh (UT)";
    return indiaLocations.states.find((s) => s.name === sName);
  }, [filters.selectedState]);

  const districtsList = selectedStateObj ? selectedStateObj.districts : [];

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newState = e.target.value;
    updateFilter("selectedState", newState);
    const sObj = indiaLocations.states.find((s) => s.name === newState);
    if (sObj && sObj.districts.length > 0) {
      updateFilter("selectedDistrict", sObj.districts[0]);
    }
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateFilter("selectedDistrict", e.target.value);
  };

  const toggleArrayItem = <T,>(array: T[], item: T): T[] => {
    return array.includes(item) ? array.filter((i) => i !== item) : [...array, item];
  };

  return (
    <div className="w-full space-y-4 text-xs text-text pb-8">
      {/* 1. Header with Reset Action */}
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <span className="font-bold text-sm text-text flex items-center gap-1.5">
          <SlidersHorizontal className="w-4 h-4 text-rust" />
          Filter Parameters
        </span>
        <button
          type="button"
          onClick={resetFilters}
          className="text-[11px] font-mono text-muted hover:text-rust flex items-center gap-1 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      </div>

      {/* 2. Location & Dataset Accordion */}
      <div className="rounded-xl border border-border bg-surface-subtle overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection("location")}
          className="w-full p-3 flex items-center justify-between text-left font-bold text-xs hover:bg-border/30 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-cyan-400" /> Territory & Dataset
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-muted transition-transform ${
              openSections.location ? "rotate-180" : ""
            }`}
          />
        </button>

        {openSections.location && (
          <div className="p-3 pt-0 space-y-2.5 border-t border-border/50">
            {/* Dataset Mode */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-surface rounded-lg border border-border">
              <button
                type="button"
                onClick={() => updateFilter("dataSource", "demo")}
                className={`py-1 px-2 rounded font-mono text-[10px] font-semibold transition-all ${
                  filters.dataSource !== "live_osm"
                    ? "bg-rust text-white shadow-glow-rust"
                    : "text-muted hover:text-text"
                }`}
              >
                Demo Hubs
              </button>
              <button
                type="button"
                onClick={() => updateFilter("dataSource", "live_osm")}
                className={`py-1 px-2 rounded font-mono text-[10px] font-semibold transition-all ${
                  filters.dataSource === "live_osm"
                    ? "bg-cyan-500 text-black font-bold shadow-glow-ev"
                    : "text-muted hover:text-text"
                }`}
              >
                Live OSM Grid
              </button>
            </div>

            {/* State Selector */}
            <div className="space-y-1">
              <span className="text-[10px] text-muted font-mono">State / UT</span>
              <select
                value={filters.selectedState || "Chandigarh (UT)"}
                onChange={handleStateChange}
                className="w-full bg-surface border border-border rounded-lg px-2 py-1.5 text-text text-xs focus:outline-none focus:border-rust"
              >
                {indiaLocations.states.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* District Selector */}
            <div className="space-y-1">
              <span className="text-[10px] text-muted font-mono">District</span>
              <select
                value={filters.selectedDistrict || "Chandigarh"}
                onChange={handleDistrictChange}
                className="w-full bg-surface border border-border rounded-lg px-2 py-1.5 text-text text-xs focus:outline-none focus:border-rust"
              >
                {districtsList.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* GPS Detection Button */}
            <div className="pt-1 flex flex-col gap-1.5">
              <button
                type="button"
                onClick={requestLocation}
                disabled={isLocating}
                className={`w-full py-1.5 px-3 rounded-lg border text-text flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 text-[11px] font-semibold ${
                  isGpsActive
                    ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                    : "border-border bg-surface hover:bg-border"
                }`}
              >
                {isLocating ? (
                  <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                ) : (
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                )}
                <span>
                  {isLocating ? "Detecting GPS..." : isGpsActive ? "Live GPS Active" : "Use My Current Location"}
                </span>
              </button>

              <button
                type="button"
                onClick={toggleWatchPosition}
                className={`w-full py-1 px-2 rounded-lg border text-[10px] font-mono flex items-center justify-center gap-1 transition-all ${
                  isWatching
                    ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-400 font-bold"
                    : "border-border text-muted hover:text-text"
                }`}
              >
                <Navigation className={`w-3 h-3 ${isWatching ? "animate-pulse text-cyan-400" : ""}`} />
                <span>{isWatching ? "Follow Me Active" : "Toggle Follow Me Mode"}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Category & Vacancy Accordion */}
      <div className="rounded-xl border border-border bg-surface-subtle overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection("type")}
          className="w-full p-3 flex items-center justify-between text-left font-bold text-xs hover:bg-border/30 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Hub Category & Vacancy
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-muted transition-transform ${
              openSections.type ? "rotate-180" : ""
            }`}
          />
        </button>

        {openSections.type && (
          <div className="p-3 pt-0 space-y-2.5 border-t border-border/50">
            <div className="grid grid-cols-3 gap-1 p-1 bg-surface rounded-lg border border-border">
              <button
                type="button"
                onClick={() => updateFilter("type", "all")}
                className={`py-1.5 rounded text-[11px] font-semibold transition-all ${
                  filters.type === "all"
                    ? "bg-surface-2 text-text font-bold shadow-sm"
                    : "text-muted hover:text-text"
                }`}
              >
                All Hubs
              </button>
              <button
                type="button"
                onClick={() => updateFilter("type", "parking")}
                className={`py-1.5 rounded text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                  filters.type === "parking"
                    ? "bg-amber-500/20 text-amber-400 font-bold shadow-glow-parking"
                    : "text-muted hover:text-text"
                }`}
              >
                <Car className="w-3 h-3 text-amber-400" />
                <span>Parking</span>
              </button>
              <button
                type="button"
                onClick={() => updateFilter("type", "ev")}
                className={`py-1.5 rounded text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                  filters.type === "ev"
                    ? "bg-cyan-500/20 text-cyan-400 font-bold shadow-glow-ev"
                    : "text-muted hover:text-text"
                }`}
              >
                <Zap className="w-3 h-3 text-cyan-400" />
                <span>EV</span>
              </button>
            </div>

            {/* Vacant Only Switch */}
            <label className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border cursor-pointer">
              <span className="text-[11px] text-text font-medium">Show Vacant Bays Only</span>
              <input
                type="checkbox"
                checked={filters.onlyAvailable}
                onChange={(e) => updateFilter("onlyAvailable", e.target.checked)}
                className="w-4 h-4 rounded text-rust focus:ring-rust"
              />
            </label>
          </div>
        )}
      </div>

      {/* 4. Sorting Accordion */}
      <div className="rounded-xl border border-border bg-surface-subtle overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection("sort")}
          className="w-full p-3 flex items-center justify-between text-left font-bold text-xs hover:bg-border/30 transition-colors"
        >
          <span className="flex items-center gap-1.5">Sort Priority</span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-muted transition-transform ${
              openSections.sort ? "rotate-180" : ""
            }`}
          />
        </button>

        {openSections.sort && (
          <div className="p-3 pt-0 border-t border-border/50">
            <select
              value={filters.sortBy}
              onChange={(e) =>
                updateFilter(
                  "sortBy",
                  e.target.value as "nearest" | "cheapest" | "availability"
                )
              }
              className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-text text-xs focus:outline-none focus:border-rust"
            >
              <option value="nearest">Nearest (by Distance)</option>
              <option value="cheapest">Cheapest (Lowest Rate)</option>
              <option value="availability">Most Available (Max Slots)</option>
            </select>
          </div>
        )}
      </div>

      {/* 5. Max Rate Slider Accordion */}
      <div className="rounded-xl border border-border bg-surface-subtle overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection("price")}
          className="w-full p-3 flex items-center justify-between text-left font-bold text-xs hover:bg-border/30 transition-colors"
        >
          <div className="flex items-center justify-between w-full pr-2">
            <span>Max Price Filter</span>
            <span className="font-mono text-rust font-bold">₹{filters.maxPrice}</span>
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 text-muted transition-transform ${
              openSections.price ? "rotate-180" : ""
            }`}
          />
        </button>

        {openSections.price && (
          <div className="p-3 pt-0 border-t border-border/50 space-y-1">
            <input
              type="range"
              min={10}
              max={300}
              step={10}
              value={filters.maxPrice}
              onChange={(e) => updateFilter("maxPrice", Number(e.target.value))}
              className="w-full accent-rust cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-muted">
              <span>₹10/hr</span>
              <span>₹300/hr</span>
            </div>
          </div>
        )}
      </div>

      {/* 6. Distance Radius Accordion */}
      <div className="rounded-xl border border-border bg-surface-subtle overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection("distance")}
          className="w-full p-3 flex items-center justify-between text-left font-bold text-xs hover:bg-border/30 transition-colors"
        >
          <div className="flex items-center justify-between w-full pr-2">
            <span>Search Radius</span>
            <span className="font-mono text-cyan-400 font-bold">{filters.maxDistanceKm} km</span>
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 text-muted transition-transform ${
              openSections.distance ? "rotate-180" : ""
            }`}
          />
        </button>

        {openSections.distance && (
          <div className="p-3 pt-0 border-t border-border/50 space-y-1">
            <input
              type="range"
              min={2}
              max={50}
              step={2}
              value={filters.maxDistanceKm}
              onChange={(e) => updateFilter("maxDistanceKm", Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-muted">
              <span>2 km</span>
              <span>50 km</span>
            </div>
          </div>
        )}
      </div>

      {/* 7. Structure Type Accordion */}
      <div className="rounded-xl border border-border bg-surface-subtle overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection("structure")}
          className="w-full p-3 flex items-center justify-between text-left font-bold text-xs hover:bg-border/30 transition-colors"
        >
          <span>Structure Type</span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-muted transition-transform ${
              openSections.structure ? "rotate-180" : ""
            }`}
          />
        </button>

        {openSections.structure && (
          <div className="p-3 pt-0 border-t border-border/50 flex flex-wrap gap-1.5">
            {ALL_PARKING_TYPES.map((type) => {
              const active = filters.parkingTypes.includes(type);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() =>
                    updateFilter("parkingTypes", toggleArrayItem(filters.parkingTypes, type))
                  }
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono capitalize transition-all border ${
                    active
                      ? "bg-amber-500/20 text-amber-400 border-amber-500/40 font-bold"
                      : "bg-surface border-border text-muted hover:text-text"
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 8. EV Connector Standard Accordion */}
      <div className="rounded-xl border border-border bg-surface-subtle overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection("chargers")}
          className="w-full p-3 flex items-center justify-between text-left font-bold text-xs hover:bg-border/30 transition-colors"
        >
          <span>EV Connector Standard</span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-muted transition-transform ${
              openSections.chargers ? "rotate-180" : ""
            }`}
          />
        </button>

        {openSections.chargers && (
          <div className="p-3 pt-0 border-t border-border/50 space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {ALL_CHARGER_TYPES.map((type) => {
                const active = filters.chargerTypes.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() =>
                      updateFilter("chargerTypes", toggleArrayItem(filters.chargerTypes, type))
                    }
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all border ${
                      active
                        ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/40 font-bold"
                        : "bg-surface border-border text-muted hover:text-text"
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>

            <div className="pt-1 border-t border-border/50 flex flex-wrap gap-1.5">
              {ALL_CHARGING_SPEEDS.map((speed) => {
                const active = filters.chargingSpeeds.includes(speed);
                return (
                  <button
                    key={speed}
                    type="button"
                    onClick={() =>
                      updateFilter("chargingSpeeds", toggleArrayItem(filters.chargingSpeeds, speed))
                    }
                    className={`px-2 py-0.5 rounded text-[10px] font-mono capitalize transition-all border ${
                      active
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold"
                        : "bg-surface border-border text-muted hover:text-text"
                    }`}
                  >
                    {speed}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 9. Amenities Accordion */}
      <div className="rounded-xl border border-border bg-surface-subtle overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection("amenities")}
          className="w-full p-3 flex items-center justify-between text-left font-bold text-xs hover:bg-border/30 transition-colors"
        >
          <span>Facility Amenities</span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-muted transition-transform ${
              openSections.amenities ? "rotate-180" : ""
            }`}
          />
        </button>

        {openSections.amenities && (
          <div className="p-3 pt-0 border-t border-border/50 flex flex-wrap gap-1.5">
            {ALL_AMENITIES.map((amenity) => {
              const active = filters.amenities.includes(amenity);
              return (
                <button
                  key={amenity}
                  type="button"
                  onClick={() =>
                    updateFilter("amenities", toggleArrayItem(filters.amenities, amenity))
                  }
                  className={`px-2 py-1 rounded-lg text-[10px] font-mono capitalize transition-all border ${
                    active
                      ? "bg-rust/20 text-rust border-rust/40 font-bold"
                      : "bg-surface border-border text-muted hover:text-text"
                  }`}
                >
                  {amenity.replace("-", " ")}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
