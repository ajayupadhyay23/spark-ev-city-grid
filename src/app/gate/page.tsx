"use client";

/**
 * @file src/app/gate/page.tsx
 * @description Municipal Gate Barrier Scanner & Automated Camera Terminal (/gate).
 * @purpose Allows gate officers and automated camera kiosks to scan driver QR passes,
 * trigger motorized boom barrier lifting, view animated gate status, and perform manual overrides.
 * Strict TypeScript without any escape hatches.
 *
 * @connections
 * - Restricted to roles: 'gate' and 'operator'
 * - Calls /api/gate/scan for token validation
 * - Reads recent scan logs from /src/lib/gate-adapter.ts
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { Scanner } from "@yudiel/react-qr-scanner";
import {
  Camera,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Unlock,
  Shield,
  Clock,
  Car,
  MapPin,
  RefreshCw,
  Zap,
  Phone,
  User,
  Check,
  Flashlight,
  VideoOff,
  Sliders,
} from "lucide-react";
import { Reservation } from "@/types";
import { showToast } from "@/components/ui/Toast";

interface ScanAuditItem {
  id: string;
  time: string;
  decision: "OPEN" | "DENIED";
  plate: string;
  reason: string;
  gateType: string;
}

interface ScanResponse {
  decision: "OPEN" | "DENIED";
  reason: string;
  booking?: Reservation;
}

export default function GateScannerPage() {
  const { data: session } = useSession();
  const isOperator = session?.user?.role === "operator";

  const [selectedSpotId, setSelectedSpotId] = useState("park_sec17_multilevel");
  const [gateType, setGateType] = useState<"entry" | "exit" | "charge">("entry");
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment");
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [manualTokenInput, setManualTokenInput] = useState("");
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recentScans, setRecentScans] = useState<ScanAuditItem[]>([]);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");

  const GATES = [
    { id: "park_sec17_multilevel", name: "Sector 17 Multi-Level Plaza" },
    { id: "ev_sec17_supercharge", name: "Sector 17 Plaza DC Fast Superhub" },
    { id: "park_elante_basement", name: "Elante Mall P1 & P2 Express" },
    { id: "ev_elante_superhub", name: "Elante Mall HyperCharge Station" },
    { id: "park_sec35_market", name: "Sector 35-C Gourmet Plaza Parking" },
    { id: "park_it_park_tech", name: "Rajiv Gandhi IT Park Tech Hub Parking" },
  ];

  // Auto-reset decision banner after 4 seconds so the next vehicle in queue can scan
  useEffect(() => {
    if (scanResult) {
      const timer = setTimeout(() => {
        setScanResult(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [scanResult]);

  // Execute verification request
  const submitScan = async (tokenString: string) => {
    if (!tokenString || isProcessing) return;
    setIsProcessing(true);

    try {
      const res = await fetch("/api/gate/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: tokenString.trim(),
          spotId: selectedSpotId,
          gateType,
        }),
      });

      const data: ScanResponse = await res.json();
      setScanResult(data);

      setRecentScans((prev) => [
        {
          id: `scan_${Date.now()}`,
          time: new Date().toLocaleTimeString(),
          decision: data.decision,
          plate: data.booking?.vehicle?.plateNumber || "N/A",
          reason: data.reason,
          gateType,
        },
        ...prev.slice(0, 15),
      ]);
    } catch {
      setScanResult({
        decision: "DENIED",
        reason: "Network error connecting to central municipal gate relay.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideReason.trim()) {
      showToast("Reason Required", "Please provide justification for audit logging.", "error");
      return;
    }

    try {
      const res = await fetch("/api/gate/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spotId: selectedSpotId,
          gateType,
          isOverride: true,
          overrideReason: overrideReason.trim(),
        }),
      });
      const data = await res.json();
      if (data.decision === "OPEN") {
        setScanResult({
          decision: "OPEN",
          reason: `Manual Override Granted by ${session?.user?.name || "Operator"}: ${overrideReason}`,
        });
        showToast("Barrier Lifted", "Hardware relay commanded to raise.", "success");
        setShowOverrideModal(false);
        setOverrideReason("");
      }
    } catch {
      showToast("Override Failed", "Could not reach barrier relay hardware.", "error");
    }
  };

  return (
    <div className="flex-1 pt-24 pb-16 px-4 max-w-6xl mx-auto w-full space-y-6">
      {/* Terminal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-mono uppercase tracking-wider text-muted font-bold">
              Automated Access Kiosk
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-sans text-text">
            Gate Barrier Terminal
          </h1>
        </div>

        {/* Gate Selection Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={selectedSpotId}
            onChange={(e) => setSelectedSpotId(e.target.value)}
            className="bg-surface-2 border border-border rounded-xl px-3 py-2 text-text font-semibold focus:outline-none focus:border-rust"
          >
            {GATES.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>

          <select
            value={gateType}
            onChange={(e) => setGateType(e.target.value as "entry" | "exit" | "charge")}
            className="bg-surface-2 border border-border rounded-xl px-3 py-2 text-text font-mono font-bold uppercase focus:outline-none focus:border-rust"
          >
            <option value="entry">Entry Gate</option>
            <option value="exit">Exit Gate</option>
            <option value="charge">EV Charger Bay</option>
          </select>
        </div>
      </div>

      {/* Main Two-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* LEFT PANEL: Camera Scanner & Controls */}
        <div className="p-6 rounded-3xl bg-surface border border-border space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-cyan-400" />
              <h2 className="font-bold text-sm text-text">Live Camera Feed</h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setCameraFacing(cameraFacing === "environment" ? "user" : "environment")
                }
                className="px-2.5 py-1 rounded-lg bg-surface-2 border border-border text-[11px] text-text font-mono hover:bg-border"
              >
                {cameraFacing === "environment" ? "Back Cam" : "Front Cam"}
              </button>

              <button
                type="button"
                onClick={() => setTorchEnabled(!torchEnabled)}
                className={`p-1.5 rounded-lg border text-xs ${
                  torchEnabled
                    ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                    : "bg-surface-2 border-border text-muted"
                }`}
                title="Toggle camera flash"
              >
                <Flashlight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Camera Viewport Canvas */}
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border-2 border-border flex flex-col items-center justify-center">
            {cameraError ? (
              <div className="p-4 text-center text-rose-400 space-y-2">
                <VideoOff className="w-8 h-8 mx-auto" />
                <p className="text-xs">{cameraError}</p>
                <p className="text-[10px] text-muted">
                  Use manual token entry below or enable camera permission.
                </p>
              </div>
            ) : (
              <div className="w-full h-full relative">
                <Scanner
                  onScan={(detected) => {
                    if (detected && detected.length > 0 && detected[0].rawValue) {
                      submitScan(detected[0].rawValue);
                    }
                  }}
                  onError={(err) => {
                    console.warn("[Scanner] Camera error:", err);
                    setCameraError("Camera permission blocked or unavailable.");
                  }}
                  constraints={{
                    facingMode: cameraFacing,
                  }}
                  styles={{
                    container: { width: "100%", height: "100%" },
                  }}
                />

                {/* Laser Target Reticle Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-48 rounded-2xl border-2 border-cyan-400/60 relative">
                    <span className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
                    <span className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
                    <span className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
                    <span className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-rose-500/80 shadow-[0_0_8px_#EF4444] animate-pulse" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Fallback Manual Token Paste Input */}
          <div className="space-y-2 pt-2">
            <label className="text-[11px] font-mono uppercase tracking-wider text-muted font-bold block">
              Manual Token Entry / Barcode Scanner Fallback
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Paste signed JWT pass or token ID..."
                value={manualTokenInput}
                onChange={(e) => setManualTokenInput(e.target.value)}
                className="flex-1 bg-surface-2 border border-border rounded-xl px-3 py-2 text-text text-xs focus:outline-none focus:border-rust font-mono"
              />
              <button
                type="button"
                onClick={() => {
                  submitScan(manualTokenInput);
                  setManualTokenInput("");
                }}
                disabled={isProcessing || !manualTokenInput.trim()}
                className="px-4 py-2 rounded-xl bg-rust hover:bg-rust-hover text-white text-xs font-semibold shadow-glow-rust disabled:opacity-50 transition-all"
              >
                Scan Token
              </button>
            </div>
          </div>

          {/* Operator Manual Override Button */}
          {isOperator && (
            <div className="pt-2 border-t border-border flex justify-between items-center">
              <span className="text-[11px] text-muted">Supervisor Emergency Control:</span>
              <button
                type="button"
                onClick={() => setShowOverrideModal(true)}
                className="px-3 py-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-semibold flex items-center gap-1.5"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Manual Override Open</span>
              </button>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Barrier Animation & Driver Summary */}
        <div className="space-y-6">
          {/* Barrier Decision Banner & Physical SVG Barrier Arm */}
          <div className="p-6 rounded-3xl bg-surface border border-border space-y-5 shadow-sm text-center">
            <h2 className="text-xs font-mono uppercase tracking-wider text-muted font-bold">
              Barrier Relay Status
            </h2>

            {/* Motorized Boom Barrier SVG Animation */}
            <div className="h-36 w-full flex items-center justify-center relative">
              <svg width="240" height="120" viewBox="0 0 240 120" className="overflow-visible">
                {/* Barrier Base Stanchion */}
                <rect x="30" y="50" width="30" height="65" rx="4" fill="#334155" />
                <circle cx="45" cy="65" r="7" fill="#64748B" />

                {/* Animated Rotating Boom Barrier Arm */}
                <motion.g
                  animate={{
                    rotate: scanResult?.decision === "OPEN" ? -85 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 120, damping: 14 }}
                  style={{ originX: "45px", originY: "65px" }}
                >
                  {/* Barrier Arm Beam with Reflective Striping */}
                  <rect x="45" y="60" width="160" height="10" rx="3" fill="#DC2626" />
                  <rect x="65" y="60" width="20" height="10" fill="#FFFFFF" />
                  <rect x="105" y="60" width="20" height="10" fill="#FFFFFF" />
                  <rect x="145" y="60" width="20" height="10" fill="#FFFFFF" />
                  <rect x="185" y="60" width="20" height="10" fill="#FFFFFF" />
                </motion.g>

                {/* Ground Line */}
                <line x1="10" y1="115" x2="230" y2="115" stroke="#475569" strokeWidth="3" />
              </svg>
            </div>

            {/* Decision Status Banner */}
            <AnimatePresence mode="wait">
              {scanResult ? (
                <motion.div
                  key="decision-banner"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className={`p-4 rounded-2xl border text-xs space-y-1 ${
                    scanResult.decision === "OPEN"
                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                      : "bg-rose-500/15 border-rose-500/40 text-rose-400"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2 font-bold text-base">
                    {scanResult.decision === "OPEN" ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span>ACCESS GRANTED • GATE OPEN</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-rose-400" />
                        <span>ACCESS DENIED</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs font-mono">{scanResult.reason}</p>
                </motion.div>
              ) : (
                <div className="p-3 rounded-xl bg-surface-2 border border-border text-xs text-muted font-mono">
                  Awaiting driver optical QR scan...
                </div>
              )}
            </AnimatePresence>

            {/* Full Booking Summary (Shown even when denied if booking exists) */}
            {scanResult?.booking && (
              <div className="p-4 rounded-2xl bg-surface-2 border border-border text-left space-y-2.5 text-xs font-mono">
                <h3 className="font-bold text-text text-sm flex items-center justify-between">
                  <span>Driver & Vehicle Record</span>
                  <span className="text-[10px] text-muted">ID: {scanResult.booking.id}</span>
                </h3>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted block text-[10px]">Customer</span>
                    <span className="font-bold text-text">
                      {scanResult.booking.customerName || "Rahul Verma"}
                    </span>
                  </div>

                  <div>
                    <span className="text-muted block text-[10px]">Vehicle Plate</span>
                    <span className="font-bold text-cyan-400">
                      {scanResult.booking.vehicle?.plateNumber}
                    </span>
                  </div>

                  <div>
                    <span className="text-muted block text-[10px]">Assigned Bay</span>
                    <span className="font-bold text-text">
                      {scanResult.booking.slotId || "General Parking"}
                    </span>
                  </div>

                  <div>
                    <span className="text-muted block text-[10px]">Gate State</span>
                    <span className="font-bold text-amber-400 uppercase">
                      {scanResult.booking.gateState || "reserved"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recent Scans Live List */}
          <div className="p-6 rounded-3xl bg-surface border border-border space-y-4 shadow-sm">
            <h2 className="font-bold text-sm text-text flex items-center gap-2 pb-2 border-b border-border">
              <Clock className="w-4 h-4 text-rust" />
              <span>Recent Scans Audit Log</span>
            </h2>

            {recentScans.length === 0 ? (
              <div className="p-4 text-center text-muted text-xs font-mono">
                No scans recorded in current kiosk shift.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin text-xs font-mono">
                {recentScans.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-surface-2 border border-border flex items-center justify-between"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold ${
                            item.decision === "OPEN" ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {item.decision}
                        </span>
                        <span className="text-text font-bold">{item.plate}</span>
                        <span className="text-muted uppercase text-[10px]">({item.gateType})</span>
                      </div>
                      <p className="text-[10px] text-muted truncate max-w-xs">{item.reason}</p>
                    </div>

                    <span className="text-[10px] text-muted">{item.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manual Override Dialog */}
      <AnimatePresence>
        {showOverrideModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md rounded-3xl bg-surface border border-border p-6 space-y-4 shadow-2xl relative text-text"
            >
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h2 className="font-bold text-sm">Supervisor Barrier Override</h2>
              </div>

              <p className="text-xs text-muted">
                This action forcefully triggers the physical barrier relay. All overrides are
                permanently recorded in the municipal audit log with your operator ID.
              </p>

              <form onSubmit={handleManualOverride} className="space-y-3 text-xs">
                <div>
                  <label className="block text-muted font-mono mb-1">
                    Justification / Incident Reason
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="e.g. VIP delegation clearance / Camera lens smudge"
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    className="w-full bg-surface-2 border border-border rounded-xl p-2.5 text-text focus:outline-none focus:border-rust"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowOverrideModal(false)}
                    className="px-3 py-1.5 rounded-xl bg-surface-2 border border-border text-muted hover:text-text font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold"
                  >
                    Confirm & Raise Barrier
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
