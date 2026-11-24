"use client";

/**
 * @file src/components/landing/DashboardMockup.tsx
 * @description Interactive 3D perspective preview of the actual Smart Parking application dashboard.
 * @purpose Renders an authentic live React simulation of the app interface instead of static screenshots.
 * Enters with a 3D perspective tilt (rotateX 12deg -> 0deg) as it scrolls into view, showcasing
 * sidebar navigation, live stats, search bar, and dynamic status pills.
 * @connections
 * - Used in /src/app/page.tsx
 * - Pulls live counts from /src/hooks/useLiveAvailability.ts
 * - Uses /src/hooks/useCountUp.ts
 */

import React, { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Compass,
  Zap,
  Calendar,
  Wallet,
  Search,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowUpRight,
} from "lucide-react";
import { useLiveAvailability } from "@/hooks/useLiveAvailability";
import { useCountUp } from "@/hooks/useCountUp";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";

export default function DashboardMockup() {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotionSafe();
  const { stats } = useLiveAvailability();

  // Scroll-linked 3D perspective rotation
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "center center"],
  });

  const rotateX = useTransform(scrollYProgress, [0, 1], [14, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.94, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.4], [0.4, 1]);

  const freeCount = useCountUp(stats.freeSpots, 1500);
  const chargersCount = useCountUp(stats.chargersOnline, 1500);

  return (
    <section id="preview" ref={containerRef} className="py-20 px-4 max-w-6xl mx-auto perspective-1000">
      {/* Section Header: Headline Left, Paragraph Right */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end mb-12">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-bold">
            Interactive Pilot
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-sans font-bold text-white tracking-tight mt-2">
            See every free spot, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-amber-400">
              live in real time.
            </span>
          </h2>
        </div>
        <p className="text-neutral-400 text-sm sm:text-base leading-relaxed">
          Drivers no longer circle crowded market corridors or arrive at occupied EV chargers.
          Our unified radar aggregates parking garages, street bays, and fast-charging points into
          one real-time interface.
        </p>
      </div>

      {/* 3D Perspective Container with Glowing Top Border */}
      <motion.div
        style={{
          rotateX: prefersReduced ? 0 : rotateX,
          scale: prefersReduced ? 1 : scale,
          opacity,
          transformPerspective: 1200,
        }}
        className="relative rounded-2xl border border-white/10 bg-[#0c0c12] shadow-[0_20px_80px_rgba(0,0,0,0.8)] overflow-hidden transition-shadow"
      >
        {/* Glowing Top-Edge Gradient Border (Blue -> Purple) */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-cyan-500 via-indigo-500 to-amber-500 shadow-[0_0_15px_#00D2FF]" />

        {/* Mock Application Window Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#08080c]/90">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
            <span className="ml-3 text-xs font-mono text-neutral-400">
              radar.smartparking.city/chd
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              FEED ONLINE
            </span>
          </div>
        </div>

        {/* Mockup Body: Sidebar + Main Content Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[460px]">
          {/* Mock Sidebar */}
          <div className="hidden md:flex md:col-span-3 border-r border-white/10 p-4 flex-col justify-between bg-[#08080d]/60">
            <div className="space-y-4">
              <div className="text-[11px] font-mono text-neutral-500 uppercase tracking-widest px-2">
                City Radar
              </div>
              <nav className="space-y-1 text-xs">
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/10 text-white font-medium">
                  <Compass className="w-4 h-4 text-cyan-400" />
                  <span>Overview Map</span>
                </div>
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-neutral-400 hover:text-white transition-colors">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span>EV Superchargers</span>
                </div>
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-neutral-400 hover:text-white transition-colors">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>Reservations</span>
                </div>
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-neutral-400 hover:text-white transition-colors">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  <span>Prepaid Wallet</span>
                </div>
              </nav>
            </div>

            <div className="p-3 rounded-xl bg-gradient-to-tr from-rust/20 to-transparent border border-rust/30">
              <p className="text-xs font-semibold text-white">Peak Hour Alert</p>
              <p className="text-[11px] text-neutral-400 mt-1">
                Dynamic 1.25x surge pricing in effect in Sector 17 commercial core.
              </p>
            </div>
          </div>

          {/* Mock Main Dashboard View */}
          <div className="col-span-1 md:col-span-9 p-4 sm:p-6 space-y-6 bg-[#0c0c12]/95">
            {/* Search / Ask Bar */}
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                readOnly
                value="Find EV fast charger near Sector 17 or Elante..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-24 py-2.5 text-xs text-neutral-300 font-sans cursor-pointer focus:outline-none"
              />
              <Link
                href="/finder"
                className="absolute right-2 px-3 py-1 rounded-lg bg-rust hover:bg-rust-hover text-white text-[11px] font-semibold flex items-center gap-1 transition-colors"
              >
                Search <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Top Stat Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                <span className="text-[11px] text-neutral-400 font-mono">Vacant Parking</span>
                <p className="text-xl font-bold font-mono text-emerald-400 mt-1">{freeCount} bays</p>
                <div className="text-[10px] text-emerald-500/80 flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3 h-3" /> High capacity
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                <span className="text-[11px] text-neutral-400 font-mono">Active EV Plugs</span>
                <p className="text-xl font-bold font-mono text-cyan-400 mt-1">{chargersCount} online</p>
                <div className="text-[10px] text-cyan-500/80 flex items-center gap-1 mt-0.5">
                  <Zap className="w-3 h-3" /> 150kW CCS2 available
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                <span className="text-[11px] text-neutral-400 font-mono">Average Rate</span>
                <p className="text-xl font-bold font-mono text-amber-400 mt-1">₹30 / hr</p>
                <div className="text-[10px] text-amber-500/80 flex items-center gap-1 mt-0.5">
                  <Flame className="w-3 h-3" /> Off-peak discounts
                </div>
              </div>
            </div>

            {/* Live Results Table with Status Pills */}
            <div className="rounded-xl border border-white/10 overflow-hidden bg-black/20">
              <div className="px-4 py-2.5 border-b border-white/10 bg-white/[0.02] flex items-center justify-between text-xs font-mono text-neutral-400">
                <span>Facility</span>
                <span>Type</span>
                <span>Availability</span>
                <span>Rate</span>
              </div>

              <div className="divide-y divide-white/5 text-xs">
                <div className="px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                  <div>
                    <p className="font-semibold text-white">Sector 17 Multi-Level Plaza</p>
                    <p className="text-[11px] text-neutral-500">Sector 17-B, 1.2 km away</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    PARKING
                  </span>
                  <div className="flex items-center gap-1.5 text-emerald-400 font-mono">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    45 Free
                  </div>
                  <span className="font-mono text-neutral-300">₹30/hr</span>
                </div>

                <div className="px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                  <div>
                    <p className="font-semibold text-white">Smart Grid EV Superhub</p>
                    <p className="text-[11px] text-neutral-500">Sector 17-C, 1.4 km away</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    EV CHARGER
                  </span>
                  <div className="flex items-center gap-1.5 text-cyan-400 font-mono">
                    <Zap className="w-3.5 h-3.5" />
                    5/8 Plugs
                  </div>
                  <span className="font-mono text-neutral-300">₹18/kWh</span>
                </div>

                <div className="px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                  <div>
                    <p className="font-semibold text-white">Shastri Market Public Ground</p>
                    <p className="text-[11px] text-neutral-500">Sector 22-C, 2.1 km away</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    PARKING
                  </span>
                  <div className="flex items-center gap-1.5 text-amber-400 font-mono">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    8 Free (Few)
                  </div>
                  <span className="font-mono text-neutral-300">₹20/hr</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
