"use client";

/**
 * @file src/components/landing/ArchHero.tsx
 * @description Hero section featuring the signature tall glowing architectural arch and mixed-typography headline.
 * @purpose Serves as the high-impact visual centerpiece of the landing experience.
 * Incorporates pure CSS/SVG charging-bay pillars lit in Electric Blue (EV) and Warm Orange (Parking),
 * breathing light cycles, and animated stat counters.
 * @connections
 * - Used on /src/app/page.tsx
 * - Uses /src/hooks/useCountUp.ts for animated telemetry numbers
 * - Pulls live counts from /src/hooks/useLiveAvailability.ts
 */

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Compass, ShieldCheck, Zap } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";
import { useLiveAvailability } from "@/hooks/useLiveAvailability";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";

export default function ArchHero() {
  const prefersReduced = useReducedMotionSafe();
  const { stats } = useLiveAvailability();

  // Animated stat counters
  const totalCount = useCountUp(stats.totalSpots, 1800);
  const freeCount = useCountUp(stats.freeSpots, 1800);
  const chargersCount = useCountUp(stats.chargersOnline, 1800);

  // Staggered headline entrance variants
  const headlineItemVariants = {
    hidden: { opacity: 0, y: 20, filter: "blur(6px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <section id="hero" className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden flex flex-col items-center">
      {/* 1. Main Content Container */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center flex flex-col items-center">
        {/* Pulsing Live Sensor Pilot Tag */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-neutral-300 text-xs font-mono mb-8 backdrop-blur-md shadow-glass"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-neutral-400">CHANDIGARH LIVE GRID:</span>
          <span className="text-white font-semibold">{freeCount} Available Now</span>
        </motion.div>

        {/* 2. Headline with 3 Mixed Fonts (Cormorant Garamond italic, Blackletter, Inter small caps) */}
        <motion.div
          initial="hidden"
          animate="visible"
          transition={{ staggerChildren: 0.14 }}
          className="flex flex-col items-center select-none"
        >
          {/* Line 1: Small italic serif */}
          <motion.span
            variants={headlineItemVariants}
            className="font-serif italic text-2xl sm:text-3xl md:text-4xl text-neutral-300 tracking-wide"
          >
            Find
          </motion.span>

          {/* Line 2: BIG blackletter for "Parking" */}
          <motion.h1
            variants={headlineItemVariants}
            className="font-blackletter text-6xl sm:text-7xl md:text-8xl lg:text-9xl text-white tracking-wider leading-[0.9] text-transparent bg-clip-text bg-gradient-to-b from-white via-neutral-100 to-neutral-400 drop-shadow-2xl"
          >
            Parking
          </motion.h1>

          {/* Line 3: Spaced small caps with dual electric glows */}
          <motion.div
            variants={headlineItemVariants}
            className="flex items-center gap-3 my-1 sm:my-2"
          >
            <span className="h-px w-8 sm:w-16 bg-gradient-to-r from-transparent to-cyan-400/80" />
            <span className="font-sans font-black text-xs sm:text-sm md:text-base tracking-[0.3em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-amber-400">
              & EV CHARGING
            </span>
            <span className="h-px w-8 sm:w-16 bg-gradient-to-l from-transparent to-amber-400/80" />
          </motion.div>

          {/* Line 4: BIG blackletter for "Instantly" */}
          <motion.span
            variants={headlineItemVariants}
            className="font-blackletter text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-neutral-200 tracking-wider leading-[0.9]"
          >
            Instantly
          </motion.span>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-6 max-w-xl text-sm sm:text-base text-neutral-400 font-sans leading-relaxed"
        >
          Real-time sensor occupancy, charger plug statuses, predictive dynamic pricing,
          and instant slot reservations with zero waiting.
        </motion.p>

        {/* CTAs with Signature Rust Accent (#C2603F) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.6 }}
          className="mt-8 flex flex-col sm:flex-row items-center gap-4"
        >
          <Link
            href="/finder"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full text-sm font-semibold text-white bg-rust hover:bg-rust-hover shadow-glow-rust transition-all duration-200 active:scale-95 group focus:outline-none focus:ring-2 focus:ring-rust"
          >
            <Compass className="w-4 h-4 transition-transform group-hover:rotate-45" />
            <span>Find a Spot Now</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href="/finder?type=ev"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-sm font-medium text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200"
          >
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>Locate EV Chargers</span>
          </Link>
        </motion.div>
      </div>

      {/* 3. TALL ARCH SECTION (Section 2 Spec) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-4xl mx-auto mt-14 px-4 sm:px-6"
      >
        {/* Breathing Edge Glows (Blue Left, Orange Right) */}
        <div
          aria-hidden="true"
          className={`absolute -left-10 top-1/4 w-48 sm:w-72 h-72 sm:h-96 rounded-full bg-cyan-500/25 blur-[100px] pointer-events-none ${
            prefersReduced ? "" : "animate-breathe-blue"
          }`}
        />
        <div
          aria-hidden="true"
          className={`absolute -right-10 top-1/4 w-48 sm:w-72 h-72 sm:h-96 rounded-full bg-amber-500/25 blur-[100px] pointer-events-none ${
            prefersReduced ? "" : "animate-breathe-orange"
          }`}
        />

        {/* Arch Shaped Container (border-radius: 999px 999px 0 0) */}
        <div className="relative w-full h-[340px] sm:h-[420px] md:h-[480px] rounded-t-[200px] sm:rounded-t-[280px] md:rounded-t-[340px] border-t border-x border-white/15 bg-gradient-to-b from-[#0a0a10] via-[#08080c] to-[#050506] overflow-hidden shadow-2xl flex flex-col justify-end p-6">
          {/* Subtle Arch Top Inset Glow */}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/[0.08] to-transparent pointer-events-none" />

          {/* Stylized Parking Garage / Charging Bay Scene (Pure CSS/SVG) */}
          <div className="absolute inset-0 flex items-center justify-between px-8 sm:px-16 pointer-events-none select-none">
            {/* Left Pillar: Lit Electric Blue for EV Charging */}
            <div className="relative w-12 sm:w-16 h-72 rounded-t-lg bg-gradient-to-b from-neutral-800 to-neutral-900 border-l border-cyan-400/50 shadow-glow-ev flex flex-col items-center justify-around py-4">
              <span className="w-1.5 h-16 rounded-full bg-cyan-400 shadow-[0_0_12px_#00D2FF]" />
              <Zap className="w-5 h-5 text-cyan-400 fill-cyan-400/30" />
              <div className="w-full h-px bg-cyan-500/30" />
            </div>

            {/* Center: Holographic Parking Guidance Lines */}
            <div className="flex flex-col items-center justify-center gap-3 opacity-60">
              <div className="w-24 sm:w-40 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
              <div className="w-32 sm:w-56 h-0.5 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
              <div className="w-40 sm:w-72 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
            </div>

            {/* Right Pillar: Lit Warm Orange for Parking */}
            <div className="relative w-12 sm:w-16 h-72 rounded-t-lg bg-gradient-to-b from-neutral-800 to-neutral-900 border-r border-amber-400/50 shadow-glow-parking flex flex-col items-center justify-around py-4">
              <span className="w-1.5 h-16 rounded-full bg-amber-400 shadow-[0_0_12px_#FF7A00]" />
              <span className="font-mono text-xs font-bold text-amber-400 border border-amber-400/50 px-1 rounded">
                P
              </span>
              <div className="w-full h-px bg-amber-500/30" />
            </div>
          </div>

          {/* Glowing Floor Reflection that blends Blue -> Pink -> Orange at bottom */}
          <div
            aria-hidden="true"
            className="absolute bottom-0 inset-x-0 h-36 bg-gradient-to-r from-cyan-500/25 via-pink-500/15 to-amber-500/25 blur-2xl pointer-events-none"
          />

          {/* Floating Live Telemetry Cards on Floor of Arch */}
          <div className="relative z-10 grid grid-cols-3 gap-2 sm:gap-4 max-w-2xl mx-auto w-full mb-2 sm:mb-4">
            <div className="p-3 sm:p-4 rounded-xl bg-[#0d0d12]/90 border border-white/10 backdrop-blur-md text-center">
              <p className="text-[10px] sm:text-xs text-neutral-400 font-mono uppercase tracking-wider">
                Total Grid
              </p>
              <p className="text-lg sm:text-2xl font-bold font-mono text-white mt-0.5">
                {totalCount}
              </p>
              <span className="text-[10px] text-neutral-500 font-sans">Monitored Slots</span>
            </div>

            <div className="p-3 sm:p-4 rounded-xl bg-[#0d0d12]/90 border border-emerald-500/30 backdrop-blur-md text-center shadow-lg">
              <p className="text-[10px] sm:text-xs text-emerald-400 font-mono uppercase tracking-wider flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Vacant
              </p>
              <p className="text-lg sm:text-2xl font-bold font-mono text-emerald-300 mt-0.5">
                {freeCount}
              </p>
              <span className="text-[10px] text-neutral-500 font-sans">Ready to Park</span>
            </div>

            <div className="p-3 sm:p-4 rounded-xl bg-[#0d0d12]/90 border border-cyan-500/30 backdrop-blur-md text-center">
              <p className="text-[10px] sm:text-xs text-cyan-400 font-mono uppercase tracking-wider flex items-center justify-center gap-1">
                <Zap className="w-3 h-3 text-cyan-400" />
                Active EV
              </p>
              <p className="text-lg sm:text-2xl font-bold font-mono text-cyan-300 mt-0.5">
                {chargersCount}
              </p>
              <span className="text-[10px] text-neutral-500 font-sans">Online Plugs</span>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
