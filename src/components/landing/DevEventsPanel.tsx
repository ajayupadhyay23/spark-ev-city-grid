"use client";

/**
 * @file src/components/landing/DevEventsPanel.tsx
 * @description Developer & Telemetry section displaying streaming IoT bay events and system guarantees.
 * @purpose Illustrates how smart sensors communicate with the backend via open APIs and WebSocket streaming.
 * Includes a glowing dual-tone border (Electric Blue on left, Warm Orange on right) and typewriter monospace feed.
 * @connections
 * - Used in /src/app/page.tsx
 * - Pulls simulation events from /src/hooks/useLiveAvailability.ts
 */

import React, { useState, useEffect } from "react";
import { Terminal, Shield, Cpu, RefreshCw } from "lucide-react";
import { useLiveAvailability } from "@/hooks/useLiveAvailability";

// Seed telemetry logs with authentic spotIds matching the real database
const DEFAULT_LOGS = [
  "// sensor.boot    -> { city: 'Chandigarh', nodes: 35, protocol: 'OCPP 2.0.1' }",
  "// slot.freed     -> { spotId: 'park_sec17_multilevel', free: 46 }",
  "// charger.busy   -> { id: 'c17_3', spotId: 'ev_sec17_superhub', kW: 60, status: 'occupied' }",
  "// booking.paid   -> { spotId: 'park_elante_basement', amount: 86, method: 'wallet' }",
  "// barrier.raise  -> { token: 'PASS:park_sec17_multilevel', gate: 'North-Gate-01' }",
  "// pricing.eval   -> { spotId: 'ev_itpark_zeon', isPeak: true, surgeMultiplier: 1.25 }",
];

export default function DevEventsPanel() {
  const { recentEvents } = useLiveAvailability();
  const [logs, setLogs] = useState<string[]>(DEFAULT_LOGS);

  // Append new live IoT events dynamically as background sensor simulation steps
  useEffect(() => {
    if (recentEvents.length > 0) {
      const formatted = recentEvents.map(
        (e) => `// ${e.type.padEnd(14, " ")} -> ${e.details}`
      );
      setLogs((prev) => {
        const combined = [...formatted, ...prev];
        return Array.from(new Set(combined)).slice(0, 10);
      });
    }
  }, [recentEvents]);

  return (
    <section id="developers" className="py-20 px-4 max-w-6xl mx-auto">
      {/* Dual Glow Border Container (Blue left, Orange right) */}
      <div className="relative rounded-2xl p-[1px] bg-gradient-to-r from-cyan-500 via-border to-amber-500 shadow-2xl">
        <div className="rounded-[15px] bg-surface p-6 sm:p-8 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Feature rows with thin dividers */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-amber-500 font-bold flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-amber-500" />
                Developer & Architecture
              </span>
              {/* Exact Requested Heading */}
              <h3 className="text-2xl sm:text-3xl font-bold font-sans text-text mt-2">
                One city grid. Every bay, every charger, live.
              </h3>
              {/* Exact Requested Paragraph */}
              <p className="text-muted text-xs sm:text-sm mt-2 leading-relaxed">
                Municipal barriers, induction loops and private charger hardware report to
                one open API. Drivers see the truth in seconds, operators stay in control.
              </p>
            </div>

            <div className="divide-y divide-border text-xs space-y-4 pt-2">
              <div className="pt-4 flex items-start gap-3">
                <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-text">Safe Simulation Sandbox</h4>
                  <p className="text-muted text-[11px] mt-0.5">
                    Demo payments that never move real money; authenticated JWT barrier passes.
                  </p>
                </div>
              </div>

              <div className="pt-4 flex items-start gap-3">
                <RefreshCw className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-text">Autonomous State Synchronization</h4>
                  <p className="text-muted text-[11px] mt-0.5">
                    Live bay sensors perturb slot counts every 5 seconds to simulate real urban flux.
                  </p>
                </div>
              </div>

              <div className="pt-4 flex items-start gap-3">
                <Terminal className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-text">Lightweight REST & Webhooks</h4>
                  <p className="text-muted text-[11px] mt-0.5">
                    Next.js Route Handlers with Zod validation, Overpass OSM caching, and error guarantees.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Monospace Live Stream Terminal */}
          <div className="lg:col-span-7">
            <div className="rounded-xl border border-border bg-surface-subtle p-4 sm:p-5 font-mono text-xs shadow-inner overflow-hidden">
              {/* Terminal header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-border text-muted text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-text font-semibold">iot-stream://chd-grid/telemetry</span>
                </div>
                <span className="text-[10px] text-muted font-bold">LIVE FEED</span>
              </div>

              {/* Streaming Lines */}
              <div className="space-y-2 h-64 overflow-y-auto font-mono text-[11px] scrollbar-thin text-text">
                {logs.map((log, index) => {
                  const isFreed = log.includes("slot.freed");
                  const isBusy = log.includes("charger.busy");
                  const isPaid = log.includes("booking.paid");

                  return (
                    <div
                      key={index}
                      className={`leading-relaxed transition-opacity duration-300 ${
                        index === 0 ? "opacity-100 font-semibold" : "opacity-75"
                      } ${
                        isFreed
                          ? "text-emerald-400"
                          : isBusy
                          ? "text-cyan-400"
                          : isPaid
                          ? "text-amber-400"
                          : "text-muted"
                      }`}
                    >
                      {log}
                    </div>
                  );
                })}
              </div>

              {/* Terminal prompt cursor */}
              <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 text-[11px] text-muted">
                <span className="text-cyan-400">&gt;</span>
                <span className="animate-pulse">Listening for bay ultrasonic triggers...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
