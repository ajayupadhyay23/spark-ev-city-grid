/**
 * @file src/hooks/useLiveAvailability.ts
 * @description Hook managing real-time slot availability polling and simulation stats.
 * @purpose Polls /api/availability every 6 seconds to update slot counts in the Zustand store,
 * providing the lively reactive feel required by the real-time simulation specification.
 * @connections
 * - Mutates state in /src/store/useAppStore.ts
 * - Used in /src/app/finder/page.tsx and /src/app/page.tsx
 */

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { SimulationEvent } from "@/lib/simulation";

interface AvailabilityStats {
  totalSpots: number;
  freeSpots: number;
  occupiedSpots: number;
  chargersOnline: number;
}

export function useLiveAvailability(intervalMs = 6000) {
  const updateLiveCounts = useAppStore((state) => state.updateLiveCounts);
  const [stats, setStats] = useState<AvailabilityStats>({
    totalSpots: 1850,
    freeSpots: 640,
    occupiedSpots: 1210,
    chargersOnline: 78,
  });
  const [recentEvents, setRecentEvents] = useState<SimulationEvent[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchAvailability() {
      try {
        setIsUpdating(true);
        const res = await fetch("/api/availability");
        const data = await res.json();

        if (isMounted && data.success) {
          if (data.counts) {
            updateLiveCounts(data.counts);
          }
          if (data.stats) {
            setStats(data.stats);
          }
          if (data.recentEvents) {
            setRecentEvents(data.recentEvents);
          }
        }
      } catch (err) {
        console.warn("[useLiveAvailability] Polling error:", err);
      } finally {
        if (isMounted) {
          setTimeout(() => setIsUpdating(false), 800);
        }
      }
    }

    // Initial fetch
    fetchAvailability();

    // Polling interval
    const interval = setInterval(fetchAvailability, intervalMs);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [intervalMs, updateLiveCounts]);

  return { stats, recentEvents, isUpdating };
}
