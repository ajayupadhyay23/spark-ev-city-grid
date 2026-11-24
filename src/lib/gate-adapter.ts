/**
 * @file src/lib/gate-adapter.ts
 * @description Physical Hardware Bridge Adapter and Scan Audit Logging.
 * @purpose Encapsulates IoT barrier hardware relays and OCPP smart charger commands behind clean interfaces.
 *
 * HOW REAL HARDWARE CONNECTS:
 * 1. Motorized Boom Barrier Relay:
 *    When `triggerBarrierOpen()` is called, a Modbus TCP/IP packet or HTTP GPIO relay trigger
 *    (e.g., `fetch('http://barrier-controller.local/api/relay/pulse', { method: 'POST' })`)
 *    energizes the physical boom barrier motor circuit for 3000ms.
 * 2. Smart EV Chargers (OCPP 2.0.1 Protocol):
 *    When `triggerRemoteStartTransaction()` is invoked, our Central System sends an
 *    OCPP JSON message over WebSocket to the charging station gateway:
 *    `[2, "<unique-msg-id>", "RequestStartTransaction", { "evseId": 1, "idToken": { "idToken": "VALID_PASS" } }]`
 *
 * @connections
 * - Used by /src/app/api/gate/scan/route.ts
 * - Polled by SSE stream in /src/app/api/gate/events/route.ts
 */

export interface GateScanAuditRecord {
  id: string;
  timestamp: string;
  spotId: string;
  gateType: "entry" | "exit" | "charge";
  plateNumber: string;
  decision: "OPEN" | "DENIED";
  reason: string;
  bookingId?: string;
  isOverride?: boolean;
}

export interface BarrierOpenEvent {
  timestamp: string;
  spotId: string;
  gateType: string;
  plateNumber: string;
  bookingId?: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __gateAuditLogs: GateScanAuditRecord[] | undefined;
  // eslint-disable-next-line no-var
  var __barrierSubscribers: Array<(event: BarrierOpenEvent) => void> | undefined;
}

if (!globalThis.__gateAuditLogs) {
  globalThis.__gateAuditLogs = [];
}

if (!globalThis.__barrierSubscribers) {
  globalThis.__barrierSubscribers = [];
}

/**
 * Appends a verified gate scan attempt to the live audit log.
 */
export function recordGateScan(record: Omit<GateScanAuditRecord, "id" | "timestamp">): GateScanAuditRecord {
  const item: GateScanAuditRecord = {
    id: `scan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    ...record,
  };

  globalThis.__gateAuditLogs!.unshift(item);
  if (globalThis.__gateAuditLogs!.length > 50) {
    globalThis.__gateAuditLogs!.pop();
  }

  // If barrier was instructed to open, notify all connected SSE stream listeners
  if (record.decision === "OPEN") {
    const event: BarrierOpenEvent = {
      timestamp: item.timestamp,
      spotId: record.spotId,
      gateType: record.gateType,
      plateNumber: record.plateNumber,
      bookingId: record.bookingId,
    };
    globalThis.__barrierSubscribers!.forEach((cb) => {
      try {
        cb(event);
      } catch (err) {
        // Safe listener failure
      }
    });
  }

  return item;
}

export function getRecentGateScans(): GateScanAuditRecord[] {
  return globalThis.__gateAuditLogs || [];
}

/**
 * Registers an active listener for Server-Sent Events (SSE).
 */
export function subscribeBarrierEvents(callback: (event: BarrierOpenEvent) => void): () => void {
  globalThis.__barrierSubscribers!.push(callback);
  return () => {
    globalThis.__barrierSubscribers = globalThis.__barrierSubscribers!.filter((cb) => cb !== callback);
  };
}

/**
 * Hardware Adapter Stubs (Replace with real Modbus/OCPP drivers in production)
 */
export async function triggerHardwareBarrierRelay(spotId: string, gateType: string): Promise<boolean> {
  console.log(`[HARDWARE_ADAPTER] Pulse 24V relay triggered for spot: ${spotId}, gate: ${gateType}`);
  // In real deployment: await fetch(`http://${barrierIp}/relay/pulse`);
  return true;
}

export async function triggerOcppRemoteStart(chargerId: string, idToken: string): Promise<boolean> {
  console.log(`[HARDWARE_ADAPTER] OCPP 2.0.1 RequestStartTransaction dispatched for charger: ${chargerId}`);
  return true;
}

export async function triggerOcppRemoteStop(chargerId: string): Promise<boolean> {
  console.log(`[HARDWARE_ADAPTER] OCPP 2.0.1 RequestStopTransaction dispatched for charger: ${chargerId}`);
  return true;
}
