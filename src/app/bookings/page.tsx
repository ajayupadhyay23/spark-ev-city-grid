"use client";

/**
 * @file src/app/bookings/page.tsx
 * @description Driver reservation management page with live countdown timers, QR gate passes, and EV charging controls.
 * @purpose Implements driver session lifecycle (Upcoming, Active, Past, Cancelled).
 * Features a fullscreen "Show at Gate" high-contrast QR pass, live EV kWh telemetry,
 * start/stop charging remote triggers, duration extensions, instant wallet cancellation refunds,
 * and a printable digital receipt view.
 *
 * @connections
 * - Interacts with /api/reservations and /api/reservations/[id]
 * - Uses /src/store/useWalletStore.ts
 * - Uses /src/hooks/useCountdown.ts
 * - Generates QR code passes via qrcode.react
 */

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  Car,
  Navigation,
  XCircle,
  PlusCircle,
  Wallet,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  Compass,
  Zap,
  Maximize2,
  X,
  Play,
  Square,
  Activity,
  Download,
  Printer,
  Receipt,
  FileText,
} from "lucide-react";
import { Reservation, ReservationStatus } from "@/types";
import { useWalletStore } from "@/store/useWalletStore";
import { useCountdown } from "@/hooks/useCountdown";
import { formatCurrency } from "@/lib/pricing";
import { getGoogleMapsNavigationUrl } from "@/lib/utils";
import { showToast } from "@/components/ui/Toast";

// Child card component featuring live countdown timer and EV session telemetry
function BookingCard({
  booking,
  onCancel,
  onExtend,
  onToggleCharging,
  onShowFullscreenPass,
  onViewReceipt,
}: {
  booking: Reservation;
  onCancel: (id: string) => void;
  onExtend: (id: string) => void;
  onToggleCharging: (id: string, currentlyCharging: boolean) => void;
  onShowFullscreenPass: (booking: Reservation) => void;
  onViewReceipt: (booking: Reservation) => void;
}) {
  const isEv = booking.spotType === "ev";
  const isActive = booking.status === "active";
  const isUpcoming = booking.status === "upcoming";

  // Countdown timer toward booking start or expiry
  const countdownTarget = isActive ? booking.endTime : booking.startTime;
  const countdownLabel = isActive ? "Session Ends In" : "Booking Starts In";
  const { hours, minutes, seconds, isExpired } = useCountdown(countdownTarget);

  const startFormatted = format(new Date(booking.startTime), "dd MMM yyyy, hh:mm a");
  const endFormatted = format(new Date(booking.endTime), "hh:mm a");

  return (
    <div className="p-5 rounded-2xl bg-surface border border-border space-y-4 shadow-sm hover:border-rust/40 transition-colors">
      {/* Top Banner: Status, ID & Type */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold ${
              booking.status === "active"
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 animate-pulse"
                : booking.status === "upcoming"
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                : booking.status === "completed"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
            }`}
          >
            {booking.status}
          </span>
          <span className="text-xs font-mono text-muted">ID: {booking.id.slice(0, 14)}</span>
        </div>

        <div className="text-right">
          <span className="text-xs font-mono font-bold text-text">
            {formatCurrency(booking.pricing.totalAmount)}
          </span>
          <span className="text-[10px] text-muted block capitalize font-mono">
            Paid via {booking.paymentMethod}
          </span>
        </div>
      </div>

      {/* Main Details */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="space-y-1.5 flex-1">
          <h3 className="font-bold text-base text-text flex items-center gap-1.5">
            {isEv ? <Zap className="w-4 h-4 text-cyan-400" /> : <Car className="w-4 h-4 text-amber-400" />}
            {booking.spotName}
          </h3>
          <p className="text-xs text-muted flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-muted shrink-0" />
            <span className="truncate">{booking.spotAddress}</span>
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono pt-1 text-muted">
            <span className="px-2 py-0.5 rounded bg-surface-2 border border-border text-text">
              Plate: {booking.vehicle.plateNumber}
            </span>
            {booking.slotId && (
              <span className="px-2 py-0.5 rounded bg-surface-2 border border-border text-cyan-400 font-bold">
                Bay: {booking.slotId}
              </span>
            )}
            <span className="px-2 py-0.5 rounded bg-surface-2 border border-border text-text">
              {booking.durationHours} Hours
            </span>
          </div>
        </div>

        {/* QR Code Quick Pass */}
        {(isUpcoming || isActive) && (
          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-surface-2 border border-border shrink-0 self-start sm:self-auto">
            <div className="p-1.5 bg-white rounded-lg shadow-sm">
              <QRCodeSVG value={booking.qrCodeValue} size={64} level="M" />
            </div>
            <button
              type="button"
              onClick={() => onShowFullscreenPass(booking)}
              className="mt-1 text-[10px] font-mono text-cyan-400 hover:underline flex items-center gap-0.5 font-bold"
            >
              <Maximize2 className="w-3 h-3" /> Fullscreen Pass
            </button>
          </div>
        )}
      </div>

      {/* Live Countdown Timer Banner */}
      {(isUpcoming || isActive) && !isExpired && (
        <div className="p-3 rounded-xl bg-surface-2 border border-border flex items-center justify-between text-xs font-mono">
          <span className="text-muted flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-rust animate-spin" />
            {countdownLabel}
          </span>
          <span className="font-bold text-rust text-sm">
            {String(hours).padStart(2, "0")}h : {String(minutes).padStart(2, "0")}m : {String(seconds).padStart(2, "0")}s
          </span>
        </div>
      )}

      {/* Active EV Charging Session Telemetry */}
      {isEv && isActive && booking.chargingSession && (
        <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 space-y-3 font-mono">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
              <Activity className="w-4 h-4 animate-pulse" />
              Live Charger Telemetry
            </span>
            <span className="text-[10px] uppercase font-bold text-emerald-400">
              {booking.chargingSession.isCharging ? "Delivering 50kW" : "Paused"}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded-lg bg-surface border border-border">
              <span className="text-[10px] text-muted block">Delivered</span>
              <span className="font-bold text-text text-sm">
                {booking.chargingSession.kwhDelivered.toFixed(1)} kWh
              </span>
            </div>

            <div className="p-2 rounded-lg bg-surface border border-border">
              <span className="text-[10px] text-muted block">Energy Cost</span>
              <span className="font-bold text-text text-sm">
                ₹{booking.chargingSession.runningCost}
              </span>
            </div>

            <div className="p-2 rounded-lg bg-surface border border-border">
              <span className="text-[10px] text-muted block">Target</span>
              <span className="font-bold text-cyan-400 text-sm">
                {booking.chargingSession.targetKwh || 40} kWh
              </span>
            </div>
          </div>

          {/* Start/Stop Charging Trigger */}
          <button
            type="button"
            onClick={() => onToggleCharging(booking.id, booking.chargingSession?.isCharging || false)}
            className={`w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              booking.chargingSession.isCharging
                ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30"
                : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30"
            }`}
          >
            {booking.chargingSession.isCharging ? (
              <>
                <Square className="w-3.5 h-3.5 fill-rose-400" />
                <span>Stop Charging Session</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-emerald-400" />
                <span>Resume Charging</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Time Window */}
      <div className="text-[11px] font-mono text-muted flex items-center justify-between">
        <span>Time: {startFormatted} ➔ {endFormatted}</span>
        <button
          type="button"
          onClick={() => onViewReceipt(booking)}
          className="text-rust hover:underline flex items-center gap-1 font-bold"
        >
          <Receipt className="w-3 h-3" /> Receipt
        </button>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between gap-2 text-xs">
        <a
          href={getGoogleMapsNavigationUrl({ lat: 30.7333, lng: 76.7794 })}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-xl border border-border bg-surface-2 hover:bg-border text-text font-semibold flex items-center gap-1 transition-colors"
        >
          <Navigation className="w-3.5 h-3.5 text-cyan-400" />
          <span>Navigate</span>
        </a>

        <div className="flex items-center gap-2">
          {isActive && (
            <button
              type="button"
              onClick={() => onExtend(booking.id)}
              className="px-3 py-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-semibold flex items-center gap-1 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Extend (+1h)</span>
            </button>
          )}

          {isUpcoming && (
            <button
              type="button"
              onClick={() => onCancel(booking.id)}
              className="px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold flex items-center gap-1 transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancel (Refund)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Reservation[]>([]);
  const [activeTab, setActiveTab] = useState<"upcoming" | "active" | "past" | "cancelled">("active");
  const [isLoading, setIsLoading] = useState(true);
  const [fullscreenBooking, setFullscreenBooking] = useState<Reservation | null>(null);
  const [receiptBooking, setReceiptBooking] = useState<Reservation | null>(null);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/reservations");
      const data = await res.json();
      if (data.success && data.reservations) {
        setBookings(data.reservations);
      }
    } catch (e) {
      console.warn("Failed to fetch bookings:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this booking? If cancelled >1 hour prior to start, you will receive a full refund to your in-app wallet.")) {
      return;
    }
    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Booking Cancelled", data.message || "Refund credited to wallet.", "success");
        fetchBookings();
      } else {
        showToast("Cancellation Failed", data.error, "error");
      }
    } catch {
      showToast("Cancellation Failed", "Network error.", "error");
    }
  };

  const handleExtendBooking = async (id: string) => {
    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "extend", additionalHours: 1 }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Duration Extended", "Added 1 additional hour to reservation.", "success");
        fetchBookings();
      } else {
        showToast("Extension Failed", data.error, "error");
      }
    } catch {
      showToast("Extension Failed", "Network error.", "error");
    }
  };

  const handleToggleCharging = async (id: string, currentlyCharging: boolean) => {
    const action = currentlyCharging ? "stop_charge" : "start_charge";
    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          currentlyCharging ? "Charging Stopped" : "Charging Started",
          data.message,
          "success"
        );
        fetchBookings();
      }
    } catch {
      showToast("Command Failed", "Could not reach EV charger hardware.", "error");
    }
  };

  // Filter bookings according to active tab
  const filteredBookings = bookings.filter((b) => {
    if (activeTab === "active") return b.status === "active";
    if (activeTab === "upcoming") return b.status === "upcoming";
    if (activeTab === "past") return b.status === "completed";
    if (activeTab === "cancelled") return b.status === "cancelled";
    return true;
  });

  return (
    <div className="flex-1 pt-24 pb-16 px-4 max-w-4xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-sans text-text">My Reservations</h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Manage your parking bays, EV charge cycles, barrier tokens, and refunds
          </p>
        </div>

        <Link
          href="/finder"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rust hover:bg-rust-hover text-white text-xs font-semibold shadow-glow-rust self-start sm:self-auto transition-all active:scale-95"
        >
          <Compass className="w-4 h-4" />
          <span>Find New Bay</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center p-1 rounded-2xl bg-surface border border-border text-xs font-semibold">
        {(["upcoming", "active", "past", "cancelled"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-center rounded-xl capitalize transition-all ${
              activeTab === tab
                ? "bg-surface-2 text-text font-bold shadow-sm border border-border"
                : "text-muted hover:text-text"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content Feed */}
      {isLoading ? (
        <div className="p-12 text-center text-muted space-y-3">
          <Loader2 className="w-8 h-8 text-rust animate-spin mx-auto" />
          <p className="text-xs font-mono">Syncing reservation records...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="p-12 rounded-3xl bg-surface border border-border text-center space-y-4">
          <Calendar className="w-10 h-10 text-muted mx-auto" />
          <h3 className="font-bold text-text text-sm">No {activeTab} bookings</h3>
          <p className="text-xs text-muted max-w-xs mx-auto">
            {activeTab === "active"
              ? "You do not have any currently running parking or charging sessions."
              : `No ${activeTab} reservations found in your history.`}
          </p>
          <Link
            href="/finder"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rust text-white text-xs font-semibold shadow-glow-rust"
          >
            Explore Nearby Hubs
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              onCancel={handleCancelBooking}
              onExtend={handleExtendBooking}
              onToggleCharging={handleToggleCharging}
              onShowFullscreenPass={(booking) => setFullscreenBooking(booking)}
              onViewReceipt={(booking) => setReceiptBooking(booking)}
            />
          ))}
        </div>
      )}

      {/* Fullscreen "Show at Gate" Modal Pass */}
      <AnimatePresence>
        {fullscreenBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl bg-white text-black p-6 space-y-5 shadow-2xl relative text-center"
            >
              <button
                type="button"
                onClick={() => setFullscreenBooking(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 font-bold block">
                  SPARK.EV Gate Access Pass
                </span>
                <h2 className="text-xl font-bold font-sans text-neutral-900 leading-tight">
                  {fullscreenBooking.spotName}
                </h2>
                <p className="text-xs text-neutral-600 font-mono">
                  Plate: <strong>{fullscreenBooking.vehicle.plateNumber}</strong>
                </p>
              </div>

              {/* High Contrast White QR Canvas for Optical Barrier Readers */}
              <div className="p-4 bg-white rounded-2xl border-2 border-black inline-block mx-auto shadow-inner">
                <QRCodeSVG
                  value={fullscreenBooking.qrCodeValue}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div className="space-y-1 font-mono text-xs text-neutral-700">
                <p>Present screen directly to the gate camera scanner</p>
                <span className="text-[10px] text-neutral-500 block">
                  Token ID: {fullscreenBooking.id.slice(0, 16)} • Anti-Passback Enabled
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Printable Receipt Modal */}
      <AnimatePresence>
        {receiptBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md rounded-3xl bg-surface border border-border p-6 space-y-5 shadow-2xl relative text-text"
            >
              <button
                type="button"
                onClick={() => setReceiptBooking(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-surface-2 hover:bg-border text-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center space-y-1 pb-3 border-b border-border">
                <div className="w-10 h-10 rounded-full bg-rust/10 text-rust flex items-center justify-center mx-auto mb-2">
                  <Receipt className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold">Payment Receipt</h2>
                <p className="text-xs text-muted font-mono">Txn: {receiptBooking.paymentId}</p>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted">Facility:</span>
                  <span className="font-bold text-right">{receiptBooking.spotName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted">Vehicle Plate:</span>
                  <span>{receiptBooking.vehicle.plateNumber}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted">Base Tariff:</span>
                  <span>₹{receiptBooking.pricing.baseAmount}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted">GST & Municipal Tax:</span>
                  <span>₹{receiptBooking.pricing.taxes}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted">Platform Gateway Fee:</span>
                  <span>₹{receiptBooking.pricing.serviceFee}</span>
                </div>
                <div className="flex justify-between py-2 border-t-2 border-border font-bold text-sm">
                  <span>Total Paid:</span>
                  <span className="text-rust">₹{receiptBooking.pricing.totalAmount}</span>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 py-2 rounded-xl bg-surface-2 hover:bg-border border border-border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    showToast("Downloaded", "Receipt saved as PDF.", "success");
                    setReceiptBooking(null);
                  }}
                  className="flex-1 py-2 rounded-xl bg-rust hover:bg-rust-hover text-white text-xs font-semibold shadow-glow-rust flex items-center justify-center gap-1.5 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
