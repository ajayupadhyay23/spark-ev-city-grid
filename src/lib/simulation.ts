/**
 * @file src/lib/simulation.ts
 * @description Background IoT sensor simulation that perturbs spot capacities and charger statuses.
 * @purpose Generates authentic real-time activity in the application without requiring physical hardware sensors.
 * Demonstrates live availability polling, animated number counters, and pulsating marker indicators.
 * @connections
 * - Reads and mutates /src/lib/db.ts
 * - Polled by /src/app/api/availability/route.ts
 * - Events fed to the landing page Developer Events Panel
 */

import { getAllSpots } from "./db";
import { ChargerStatus } from "@/types";

export interface SimulationEvent {
  timestamp: string;
  type: "slot.freed" | "slot.occupied" | "charger.busy" | "charger.available";
  spotId: string;
  spotName: string;
  details: string;
}

// In-memory queue of recent simulated IoT events
declare global {
  // eslint-disable-next-line no-var
  var __simEvents: SimulationEvent[] | undefined;
  // eslint-disable-next-line no-var
  var __lastSimTime: number | undefined;
}

if (!globalThis.__simEvents) {
  globalThis.__simEvents = [
    {
      timestamp: new Date().toISOString(),
      type: "slot.freed",
      spotId: "park_sec17_multilevel",
      spotName: "Sector 17 Multi-Level Plaza",
      details: "{ spotId: 'park_sec17_multilevel', free: 45 }",
    },
    {
      timestamp: new Date(Date.now() - 3000).toISOString(),
      type: "charger.busy",
      spotId: "ev_sec17_superhub",
      spotName: "Sector 17 Smart Grid EV Superhub",
      details: "{ id: 'c17_3', type: 'CCS2', kW: 60 }",
    },
  ];
  globalThis.__lastSimTime = Date.now();
}

/**
 * Runs a simulation cycle to perturb slot counts and charger statuses.
 * Throttled to execute at most once every 3 seconds to avoid erratic flashing.
 */
export function stepSimulation(): SimulationEvent[] {
  const now = Date.now();
  const lastTime = globalThis.__lastSimTime || 0;

  // Throttle simulation steps
  if (now - lastTime < 3000) {
    return globalThis.__simEvents || [];
  }
  globalThis.__lastSimTime = now;

  const spots = getAllSpots();
  if (spots.length === 0) return [];

  // Pick 2 random spots to modify
  const countToChange = Math.floor(Math.random() * 3) + 1;
  const newEvents: SimulationEvent[] = [];

  for (let i = 0; i < countToChange; i++) {
    const randomIndex = Math.floor(Math.random() * spots.length);
    const spot = spots[randomIndex];

    // 50% chance of slot increment, 50% decrement
    const delta = Math.random() > 0.5 ? 1 : -1;
    const previousFree = spot.freeSlots;
    const newFree = Math.max(0, Math.min(spot.totalSlots, spot.freeSlots + delta));

    if (newFree !== previousFree) {
      spot.freeSlots = newFree;
      spot.updatedAt = new Date().toISOString();

      const eventType = delta > 0 ? "slot.freed" : "slot.occupied";
      const event: SimulationEvent = {
        timestamp: new Date().toISOString(),
        type: eventType,
        spotId: spot.id,
        spotName: spot.name,
        details: `{ spotId: '${spot.id}', free: ${newFree} }`,
      };
      newEvents.push(event);
    }

    // If EV station, occasionally flip a charger status
    if (spot.type === "ev" && spot.chargers && spot.chargers.length > 0) {
      if (Math.random() > 0.6) {
        const cIndex = Math.floor(Math.random() * spot.chargers.length);
        const charger = spot.chargers[cIndex];
        const nextStatus: ChargerStatus = charger.status === "available" ? "occupied" : "available";
        charger.status = nextStatus;

        newEvents.push({
          timestamp: new Date().toISOString(),
          type: nextStatus === "occupied" ? "charger.busy" : "charger.available",
          spotId: spot.id,
          spotName: spot.name,
          details: `{ id: '${charger.id}', type: '${charger.type}', kW: ${charger.powerKw}, status: '${nextStatus}' }`,
        });
      }
    }
  }

  // Prepend new events and keep at most 20 recent records
  const currentEvents = globalThis.__simEvents || [];
  globalThis.__simEvents = [...newEvents, ...currentEvents].slice(0, 20);

  return globalThis.__simEvents;
}

export function getRecentSimulationEvents(): SimulationEvent[] {
  return globalThis.__simEvents || [];
}
