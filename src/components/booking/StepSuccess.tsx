"use client";

/**
 * @file src/components/booking/StepSuccess.tsx
 * @description Step 5 of the booking wizard: Confirmed reservation receipt with digital QR gate pass.
 * @purpose Renders the entry pass barrier token using qrcode.react and provides instant navigation
 * shortcuts, printable receipts, and fullscreen kiosk display for barrier cameras.
 * @connections
 * - Used in /src/components/booking/BookingWizard.tsx
 * - Renders qrcode.react
 */

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import {
  CheckCircle2,
  Calendar,
  MapPin,
  Car,
  Printer,
  Navigation,
  ArrowRight,
  ShieldCheck,
  Maximize2,
  X,
} from "lucide-react";
import { Reservation } from "@/types";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/pricing";
import { getGoogleMapsNavigationUrl } from "@/lib/utils";

interface StepSuccessProps {
  reservation: Reservation;
  onClose: () => void;
}

export default function StepSuccess({ reservation, onClose }: StepSuccessProps) {
  const [fullscreenMode, setFullscreenMode] = useState(false);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const navUrl = getGoogleMapsNavigationUrl(
    { lat: 30.7333, lng: 76.7794 },
    reservation.spotName
  );

  return (
    <div className="space-y-6 text-xs text-text print:text-black">
      {/* Animated Success Checkmark */}
      <div className="flex flex-col items-center justify-center text-center pt-2">
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)]"
        >
          <CheckCircle2 className="w-9 h-9" />
        </motion.div>

        <h2 className="text-xl font-bold font-sans text-text mt-4 print:text-black">
          Spot Confirmed & Reserved!
        </h2>
        <p className="text-xs text-muted mt-1 font-mono">
          Booking ID: <span className="text-cyan-400 font-bold">{reservation.id}</span>
        </p>
      </div>

      {/* QR Code Pass Card */}
      <div className="p-5 rounded-2xl bg-surface-subtle border border-border flex flex-col items-center gap-4 text-center shadow-inner">
        <div className="p-3 bg-white rounded-xl shadow-lg">
          <QRCodeSVG
            value={reservation.qrCodeValue}
            size={140}
            level="H"
            includeMargin={false}
          />
        </div>

        <div>
          <span className="text-xs font-mono font-bold text-text uppercase tracking-wider block">
            Scan at Automated Barrier Gate
          </span>
          <span className="text-[10px] text-muted font-mono mt-0.5 block">
            {reservation.vehicle.plateNumber} • Authorized Pass
          </span>
        </div>

        <button
          type="button"
          onClick={() => setFullscreenMode(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-border text-[11px] font-mono text-muted hover:text-text transition-colors"
        >
          <Maximize2 className="w-3.5 h-3.5 text-rust" />
          <span>Fullscreen Kiosk Pass</span>
        </button>
      </div>

      {/* Reservation Details Card */}
      <div className="rounded-xl border border-border p-4 space-y-3 bg-surface-subtle">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-text text-sm">{reservation.spotName}</h3>
            <p className="text-[11px] text-muted flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-muted" />
              <span>{reservation.spotAddress}</span>
            </p>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            PAID
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border font-mono text-[11px]">
          <div>
            <span className="text-muted block">Check-in</span>
            <span className="text-text font-semibold">
              {format(new Date(reservation.startTime), "MMM dd, hh:mm a")}
            </span>
          </div>

          <div>
            <span className="text-muted block">Valid Until</span>
            <span className="text-text font-semibold">
              {format(new Date(reservation.endTime), "MMM dd, hh:mm a")}
            </span>
          </div>

          <div>
            <span className="text-muted block">Vehicle Reg</span>
            <span className="text-text font-semibold">{reservation.vehicle.plateNumber}</span>
          </div>

          <div>
            <span className="text-muted block">Total Amount</span>
            <span className="text-rust-light font-bold">
              {formatCurrency(reservation.pricing.totalAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-2.5 pt-2 print:hidden">
        <button
          type="button"
          onClick={handlePrint}
          className="flex-1 py-2.5 px-3 rounded-xl border border-border hover:bg-surface-subtle text-text flex items-center justify-center gap-2 transition-colors font-medium"
        >
          <Printer className="w-4 h-4 text-muted" />
          <span>Print / PDF</span>
        </button>

        <a
          href={navUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2.5 px-3 rounded-xl border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 flex items-center justify-center gap-2 transition-colors font-semibold"
        >
          <Navigation className="w-4 h-4 text-cyan-400" />
          <span>GPS Route</span>
        </a>

        <Link
          href="/bookings"
          onClick={onClose}
          className="flex-1 py-2.5 px-3 rounded-xl bg-rust hover:bg-rust-hover text-white flex items-center justify-center gap-2 font-semibold shadow-glow-rust transition-all"
        >
          <span>My Bookings</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Fullscreen Kiosk Pass Overlay */}
      <AnimatePresence>
        {fullscreenMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
          >
            <div className="relative w-full max-w-sm rounded-3xl bg-white text-black p-6 flex flex-col items-center text-center shadow-2xl">
              <button
                type="button"
                onClick={() => setFullscreenMode(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-black font-sans tracking-tight">Gate Entry Pass</h2>
              <p className="text-xs text-neutral-600 font-mono mt-0.5">{reservation.spotName}</p>

              <div className="my-5 p-4 bg-white rounded-2xl border-4 border-black shadow-lg">
                <QRCodeSVG value={reservation.qrCodeValue} size={200} level="H" />
              </div>

              <div className="w-full bg-neutral-100 rounded-2xl p-3 font-mono text-xs space-y-1 text-left">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Plate:</span>
                  <span className="font-bold text-black uppercase">{reservation.vehicle.plateNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Token ID:</span>
                  <span className="font-bold text-black">{reservation.id}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
