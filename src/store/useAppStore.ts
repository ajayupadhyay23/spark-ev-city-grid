/**
 * @file src/store/useAppStore.ts
 * @description Central Zustand store for map state, spot discovery, filtering, and booking dialogues.
 * @purpose Using Zustand instead of React Context to avoid re-rendering the entire component tree
 * whenever an individual filter (e.g. price slider or search input) or live slot count updates.
 * @connections
 * - Used across /src/app/finder/page.tsx, /src/components/map/SpotMap.tsx, /src/components/spots/...
 */

import { create } from "zustand";
import { DEFAULT_FILTERS } from "@/lib/constants";
import { FinderFilters, GeoLocation, Spot } from "@/types";

interface AppState {
  // Filters applied in the Finder view
  filters: FinderFilters;
  // Current search results returned from API
  spots: Spot[];
  // Spot currently focused or opened in drawer
  selectedSpot: Spot | null;
  // Slide-over drawer visibility
  isDrawerOpen: boolean;
  // Loading status during API requests
  isLoadingSpots: boolean;
  // Booking modal wizard visibility & target spot
  isBookingModalOpen: boolean;
  activeBookingSpot: Spot | null;
  // Live reactive slot counts polled from /api/availability
  liveCounts: Record<string, number>;
  // Active navigation route to render on map
  navigationRoute: { destination: GeoLocation; spotName: string } | null;
  // Card currently hovered by user
  hoveredSpotId: string | null;
  // Card currently in view while scrolling results feed
  activeInViewSpotId: string | null;
  // Whether results are dynamically filtered to visible map viewport
  isFilterByMapArea: boolean;
  // Current bounding box of map viewport
  mapBounds: { north: number; south: number; east: number; west: number } | null;
  // Whether user has actively granted and turned on device GPS
  isGpsActive: boolean;

  // Actions
  setFilters: (filters: FinderFilters) => void;
  updateFilter: <K extends keyof FinderFilters>(key: K, value: FinderFilters[K]) => void;
  resetFilters: () => void;
  setSpots: (spots: Spot[]) => void;
  selectSpot: (spot: Spot | null) => void;
  setDrawerOpen: (open: boolean) => void;
  openBookingModal: (spot: Spot) => void;
  closeBookingModal: () => void;
  updateLiveCounts: (counts: Record<string, number>) => void;
  setNavigationRoute: (route: { destination: GeoLocation; spotName: string } | null) => void;
  setHoveredSpotId: (id: string | null) => void;
  setActiveInViewSpotId: (id: string | null) => void;
  setIsFilterByMapArea: (enabled: boolean) => void;
  setMapBounds: (bounds: { north: number; south: number; east: number; west: number } | null) => void;
  setIsGpsActive: (active: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  filters: DEFAULT_FILTERS,
  spots: [],
  selectedSpot: null,
  isDrawerOpen: false,
  isLoadingSpots: false,
  isBookingModalOpen: false,
  activeBookingSpot: null,
  liveCounts: {},
  navigationRoute: null,
  hoveredSpotId: null,
  activeInViewSpotId: null,
  isFilterByMapArea: false,
  mapBounds: null,
  isGpsActive: false,

  setFilters: (filters) => set({ filters }),

  updateFilter: (key, value) =>
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: value,
      },
    })),

  resetFilters: () => set({ filters: DEFAULT_FILTERS }),

  setSpots: (spots) => set({ spots }),

  selectSpot: (spot) =>
    set({
      selectedSpot: spot,
      isDrawerOpen: spot !== null,
    }),

  setDrawerOpen: (open) =>
    set((state) => ({
      isDrawerOpen: open,
      selectedSpot: open ? state.selectedSpot : null,
    })),

  openBookingModal: (spot) =>
    set({
      activeBookingSpot: spot,
      isBookingModalOpen: true,
      isDrawerOpen: false, // Close drawer so wizard takes center stage
    }),

  closeBookingModal: () =>
    set({
      isBookingModalOpen: false,
      activeBookingSpot: null,
    }),

  updateLiveCounts: (counts) =>
    set((state) => {
      // Merge live counts and update the spots list in-place so cards react immediately
      const updatedSpots = state.spots.map((spot) => {
        if (counts[spot.id] !== undefined) {
          return { ...spot, freeSlots: counts[spot.id] };
        }
        return spot;
      });

      const updatedSelected =
        state.selectedSpot && counts[state.selectedSpot.id] !== undefined
          ? { ...state.selectedSpot, freeSlots: counts[state.selectedSpot.id] }
          : state.selectedSpot;

      return {
        liveCounts: { ...state.liveCounts, ...counts },
        spots: updatedSpots,
        selectedSpot: updatedSelected,
      };
    }),

  setNavigationRoute: (route) => set({ navigationRoute: route }),
  setHoveredSpotId: (id) => set({ hoveredSpotId: id }),
  setActiveInViewSpotId: (id) => set({ activeInViewSpotId: id }),
  setIsFilterByMapArea: (enabled) => set({ isFilterByMapArea: enabled }),
  setMapBounds: (bounds) => set({ mapBounds: bounds }),
  setIsGpsActive: (active) => set({ isGpsActive: active }),
}));
