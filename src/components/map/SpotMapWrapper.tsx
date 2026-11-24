"use client";

/**
 * @file src/components/map/SpotMapWrapper.tsx
 * @description Dynamic client-only wrapper for the Leaflet SpotMap component.
 * @purpose Leaflet accesses window, document, and navigator objects immediately upon evaluation.
 * Next.js SSR crashes if Leaflet is evaluated on the server.
 * Wrapping it with next/dynamic and { ssr: false } cleanly circumvents this issue and renders
 * a high-fidelity radar skeleton while spatial assets load.
 *
 * @connections
 * - Used in /src/app/finder/page.tsx
 */

import dynamic from "next/dynamic";
import React from "react";
import { Loader2, Radio } from "lucide-react";

const SpotMap = dynamic(() => import("./SpotMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[420px] rounded-2xl bg-surface-subtle border border-border flex flex-col items-center justify-center text-muted gap-3 p-6 animate-pulse">
      <div className="relative flex items-center justify-center">
        <Radio className="w-10 h-10 text-cyan-400 animate-spin" />
        <span className="absolute w-12 h-12 rounded-full border border-cyan-400/40 animate-ping" />
      </div>
      <div className="text-center space-y-1">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-text">
          Initializing Spatial Grid & Satellite Sensors...
        </span>
        <p className="text-[11px] text-muted">
          Loading CartoDB live vectors and capacity telemetry
        </p>
      </div>
    </div>
  ),
});

export default SpotMap;
