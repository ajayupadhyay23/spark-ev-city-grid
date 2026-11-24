"use client";

/**
 * @file src/components/ui/Toast.tsx
 * @description Global notification toast manager for success messages, errors, and live alerts.
 * @purpose Dispatches transient feedback when drivers complete bookings, top-up wallets, or hit validation errors.
 * @connections
 * - Dispatched via window events from /src/components/booking/... and /src/app/bookings/page.tsx
 * - Mounted in /src/app/layout.tsx
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  description?: string;
  message?: string;
}

// Global dispatcher helper supporting both object and (title, desc, type) signatures
export function showToast(
  titleOrMessage: string | Omit<ToastMessage, "id">,
  description?: string,
  type: "success" | "error" | "info" = "info"
) {
  if (typeof window !== "undefined") {
    let payload: Omit<ToastMessage, "id">;
    if (typeof titleOrMessage === "string") {
      payload = { title: titleOrMessage, description, type };
    } else {
      payload = {
        ...titleOrMessage,
        description: titleOrMessage.description || titleOrMessage.message,
      };
    }
    const event = new CustomEvent("spark:toast", {
      detail: { ...payload, id: Math.random().toString(36).substring(2, 9) },
    });
    window.dispatchEvent(event);
  }
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    function handleToast(e: Event) {
      const customEvent = e as CustomEvent<ToastMessage>;
      setToasts((prev) => [...prev, customEvent.detail]);

      // Auto-dismiss after 4 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== customEvent.detail.id));
      }, 4000);
    }

    window.addEventListener("spark:toast", handleToast);
    return () => window.removeEventListener("spark:toast", handleToast);
  }, []);

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-2xl backdrop-blur-md ${
              toast.type === "success"
                ? "bg-[#0b1712]/95 border-emerald-500/30 text-emerald-100"
                : toast.type === "error"
                ? "bg-[#1f0e11]/95 border-rose-500/30 text-rose-100"
                : "bg-[#0f121b]/95 border-sky-500/30 text-sky-100"
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {toast.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {toast.type === "error" && <AlertCircle className="w-5 h-5 text-rose-400" />}
              {toast.type === "info" && <Info className="w-5 h-5 text-sky-400" />}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold leading-tight">{toast.title}</p>
              {(toast.description || toast.message) && (
                <p className="text-[11px] text-neutral-300 mt-0.5 leading-snug">{toast.description || toast.message}</p>
              )}
            </div>

            <button
              onClick={() => dismiss(toast.id)}
              className="text-neutral-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
