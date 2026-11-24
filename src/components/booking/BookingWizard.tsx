"use client";

/**
 * @file src/components/booking/BookingWizard.tsx
 * @description Multi-step reservation wizard modal with animated slide transitions and validation.
 * @purpose Coordinates Steps 1 through 5 of reserving a parking spot or EV charging connector.
 * Validates each step, handles simulated gateway latency, and persists confirmation to the backend.
 * @connections
 * - Reads & updates /src/store/useAppStore.ts
 * - Calls /api/reservations to create booking records
 * - Calls /api/payments for gateway simulation
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Check, Zap } from "lucide-react";
import { Spot, VehicleDetails, PaymentMethod, Reservation } from "@/types";
import { useAppStore } from "@/store/useAppStore";
import { useWalletStore } from "@/store/useWalletStore";
import { DEFAULT_USER_ID } from "@/lib/constants";
import { calculateBookingPrice } from "@/lib/pricing";
import { slideWizardStepVariant } from "@/lib/animations";
import StepDateTime from "./StepDateTime";
import StepVehicle from "./StepVehicle";
import StepPricingSummary from "./StepPricingSummary";
import StepPayment from "./StepPayment";
import StepSuccess from "./StepSuccess";
import { showToast } from "@/components/ui/Toast";

interface BookingWizardProps {
  spot: Spot | null;
  isOpen: boolean;
  onClose: () => void;
}

const STEP_TITLES = [
  "Schedule Time",
  "Vehicle & Plug",
  "Fare Summary",
  "Digital Payment",
  "Gate Pass",
];

export default function BookingWizard({ spot, isOpen, onClose }: BookingWizardProps) {
  const updateLiveCounts = useAppStore((state) => state.updateLiveCounts);
  const refreshWallet = useWalletStore((state) => state.refreshBalance);

  // Wizard Navigation State
  const [step, setStep] = useState<number>(1);
  const [direction, setDirection] = useState<number>(1); // 1 = forward, -1 = backward

  // Form State
  const [startTime, setStartTime] = useState<string>(() => {
    // Default start time: 30 minutes from now
    const d = new Date(Date.now() + 30 * 60 * 1000);
    return d.toISOString();
  });
  const [durationHours, setDurationHours] = useState<number>(2);
  const [targetKwh, setTargetKwh] = useState<number>(30);
  const [vehicle, setVehicle] = useState<VehicleDetails>({
    plateNumber: "CH01AB9988",
    vehicleType: "Car",
    modelName: "Tata Nexon EV",
  });
  const [selectedChargerId, setSelectedChargerId] = useState<string | undefined>(undefined);
  const [selectedChargerPrice, setSelectedChargerPrice] = useState<number | undefined>(undefined);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("wallet");

  // Async Processing State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [confirmedReservation, setConfirmedReservation] = useState<Reservation | null>(null);

  if (!isOpen || !spot) return null;

  // Calculate pricing breakdown
  const computedPricing = calculateBookingPrice(
    spot,
    new Date(startTime),
    durationHours,
    targetKwh,
    selectedChargerPrice
  );

  // Step 1 Validation
  const validateStep1 = (): boolean => {
    setStepError(null);
    const start = new Date(startTime).getTime();
    if (isNaN(start) || start < Date.now() - 5 * 60 * 1000) {
      setStepError("Arrival time must be set in the future.");
      return false;
    }
    if (durationHours < 1 || durationHours > 24) {
      setStepError("Duration must be between 1 and 24 hours.");
      return false;
    }
    return true;
  };

  // Step 2 Validation
  const validateStep2 = (): boolean => {
    setStepError(null);
    if (!vehicle.plateNumber || vehicle.plateNumber.trim().length < 4) {
      setStepError("Please provide a valid vehicle license plate number (e.g. CH01AB1234).");
      return false;
    }
    if (spot.type === "ev" && !selectedChargerId) {
      // Pick first available charger if driver didn't manually pick
      const firstAvail = spot.chargers?.find((c) => c.status === "available");
      if (firstAvail) {
        setSelectedChargerId(firstAvail.id);
        setSelectedChargerPrice(firstAvail.pricePerKwh);
      } else {
        setStepError("No EV chargers are currently available at this facility.");
        return false;
      }
    }
    return true;
  };

  // Step Navigation Forward
  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;

    setDirection(1);
    setStep((prev) => Math.min(5, prev + 1));
  };

  // Step Navigation Backward
  const handleBack = () => {
    if (step <= 1) return;
    setStepError(null);
    setPaymentError(null);
    setDirection(-1);
    setStep((prev) => Math.max(1, prev - 1));
  };

  // Execute Payment & Reservation Creation
  const handleConfirmAndPay = async () => {
    setIsProcessing(true);
    setPaymentError(null);

    try {
      // 1. Simulate Payment Gateway Call
      const payRes = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId: `draft_${Date.now()}`,
          amount: computedPricing.totalAmount,
          method: paymentMethod,
          paymentDetails: {
            cardNumber: "4532888899991234",
            upiId: "driver@okhdfcbank",
            walletUserId: DEFAULT_USER_ID,
          },
        }),
      });

      const payData = await payRes.json();
      if (!payData.success) {
        setPaymentError(payData.error || "Simulated payment declined.");
        setIsProcessing(false);
        return;
      }

      // 2. Submit Reservation Payload to Backend
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spotId: spot.id,
          userId: DEFAULT_USER_ID,
          startTime,
          durationHours,
          vehicle: {
            ...vehicle,
            plateNumber: vehicle.plateNumber.toUpperCase().trim(),
          },
          chargerId: selectedChargerId,
          targetKwh: spot.type === "ev" ? targetKwh : undefined,
          paymentMethod,
        }),
      });

      const resData = await res.json();

      if (!resData.success) {
        setPaymentError(resData.error || "Failed to finalize reservation record.");
        setIsProcessing(false);
        return;
      }

      // Refresh stores
      if (paymentMethod === "wallet") {
        await refreshWallet();
      }

      // Update slot availability in store
      updateLiveCounts({ [spot.id]: Math.max(0, spot.freeSlots - 1) });

      setConfirmedReservation(resData.reservation);
      setDirection(1);
      setStep(5);
      showToast({
        type: "success",
        title: "Reservation Confirmed!",
        description: `Spot reserved at ${spot.name}. Gate pass ready.`,
      });
    } catch (err) {
      console.error("[BookingWizard] Error:", err);
      setPaymentError("A network error occurred while processing reservation.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark Blur Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-md"
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-lg rounded-2xl bg-[#0d0d14] border border-white/10 shadow-[0_25px_70px_rgba(0,0,0,0.8)] overflow-hidden z-10 flex flex-col max-h-[90vh]"
      >
        {/* Glowing Top Accent Border */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-rust via-amber-400 to-cyan-400" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-rust">
              {spot.type === "ev" ? <Zap className="w-4 h-4 text-cyan-400" /> : <Check className="w-4 h-4 text-amber-400" />}
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white leading-tight">
                {step === 5 ? "Booking Confirmation" : `Reserve: ${spot.name}`}
              </h2>
              <p className="text-[11px] text-neutral-400 font-mono">
                Step {step} of 5: {STEP_TITLES[step - 1]}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close booking wizard"
            className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="grid grid-cols-5 gap-1 px-4 sm:px-5 pt-3">
          {[1, 2, 3, 4, 5].map((sIndex) => (
            <div
              key={sIndex}
              className={`h-1 rounded-full transition-colors duration-300 ${
                sIndex <= step ? "bg-gradient-to-r from-rust to-amber-400" : "bg-white/10"
              }`}
            />
          ))}
        </div>

        {/* Animated Slide Step Container */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 relative min-h-[340px]">
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={step}
              custom={direction}
              variants={slideWizardStepVariant}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full"
            >
              {step === 1 && (
                <StepDateTime
                  spot={spot}
                  startTime={startTime}
                  durationHours={durationHours}
                  targetKwh={targetKwh}
                  onStartTimeChange={setStartTime}
                  onDurationChange={setDurationHours}
                  onTargetKwhChange={setTargetKwh}
                  error={stepError}
                />
              )}

              {step === 2 && (
                <StepVehicle
                  spot={spot}
                  vehicle={vehicle}
                  selectedChargerId={selectedChargerId}
                  onVehicleChange={(updates) => setVehicle((prev) => ({ ...prev, ...updates }))}
                  onChargerSelect={(id, connector) => {
                    setSelectedChargerId(id);
                    setVehicle((prev) => ({ ...prev, connectorType: connector }));
                    const c = spot.chargers?.find((item) => item.id === id);
                    if (c) setSelectedChargerPrice(c.pricePerKwh);
                  }}
                  error={stepError}
                />
              )}

              {step === 3 && (
                <StepPricingSummary
                  spot={spot}
                  startTime={startTime}
                  durationHours={durationHours}
                  vehicle={vehicle}
                  targetKwh={targetKwh}
                  selectedChargerPrice={selectedChargerPrice}
                />
              )}

              {step === 4 && (
                <StepPayment
                  totalAmount={computedPricing.totalAmount}
                  paymentMethod={paymentMethod}
                  onPaymentMethodChange={setPaymentMethod}
                  isProcessing={isProcessing}
                  paymentError={paymentError}
                  onRetry={handleConfirmAndPay}
                />
              )}

              {step === 5 && confirmedReservation && (
                <StepSuccess reservation={confirmedReservation} onClose={onClose} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Wizard Footer Controls (Steps 1 to 4) */}
        {step < 5 && (
          <div className="p-4 border-t border-white/10 bg-[#09090e] flex items-center justify-between gap-3">
            <button
              onClick={handleBack}
              disabled={step === 1 || isProcessing}
              className="py-2 px-3 rounded-xl border border-white/10 text-neutral-300 hover:text-white hover:bg-white/5 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-neutral-400 hidden sm:inline">
                Est: ₹{computedPricing.totalAmount}
              </span>

              {step < 4 ? (
                <button
                  onClick={handleNext}
                  className="py-2 px-5 rounded-xl bg-rust hover:bg-rust-hover text-white text-xs font-semibold shadow-glow-rust flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <span>Continue</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleConfirmAndPay}
                  disabled={isProcessing}
                  className="py-2.5 px-6 rounded-xl bg-rust hover:bg-rust-hover text-white text-xs font-semibold shadow-glow-rust flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                >
                  <span>Pay ₹{computedPricing.totalAmount}</span>
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
