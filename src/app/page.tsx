"use client";

/**
 * @file src/app/page.tsx
 * @description Landing page implementing the cinematic SaaS dark aesthetic and architectural hero.
 * @purpose Introduces drivers to the smart parking and EV charging grid with high-impact visuals,
 * animated stat counters, 3D tilted dashboard preview, developer telemetry streaming, and FAQ accordion.
 * @connections
 * - Renders /src/components/landing/... components
 * - Navigates to /finder, /bookings, /dashboard
 */

import React from "react";
import Link from "next/link";
import ArchHero from "@/components/landing/ArchHero";
import LogoMarquee from "@/components/landing/LogoMarquee";
import DashboardMockup from "@/components/landing/DashboardMockup";
import DevEventsPanel from "@/components/landing/DevEventsPanel";
import FaqAccordion from "@/components/landing/FaqAccordion";
import RevealOnScroll from "@/components/landing/RevealOnScroll";
import { Compass, Zap, Shield, ArrowRight, Heart } from "lucide-react";

export default function HomePage() {
  return (
    <main className="flex-1 flex flex-col">
      {/* 1. Architectural Arch Hero Section */}
      <ArchHero />

      {/* 2. Infinite Municipal & EV Partner Marquee */}
      <LogoMarquee />

      {/* 3. 3D Perspective Live Dashboard Preview */}
      <RevealOnScroll>
        <DashboardMockup />
      </RevealOnScroll>

      {/* 4. Feature Highlights Grid */}
      <section className="py-20 px-4 max-w-6xl mx-auto w-full">
        <RevealOnScroll>
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-mono uppercase tracking-widest text-rust font-bold">
              Core Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold font-sans text-white tracking-tight mt-2">
              Built for drivers who value zero friction.
            </h2>
            <p className="text-neutral-400 text-sm mt-3 leading-relaxed">
              From IoT induction ground loops to multi-standard EV DC fast chargers,
              experience complete urban mobility transparency.
            </p>
          </div>
        </RevealOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <RevealOnScroll delay={0.1}>
            <div className="p-6 rounded-2xl bg-[#0e0e14]/90 border border-white/10 hover:border-amber-500/40 hover:shadow-glow-parking transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Live Slot Availability</h3>
              <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                Telemetry streams update free bay counts every 5 seconds. View color-coded capacity
                pins and navigation routes before starting your engine.
              </p>
            </div>
          </RevealOnScroll>

          <RevealOnScroll delay={0.2}>
            <div className="p-6 rounded-2xl bg-[#0e0e14]/90 border border-white/10 hover:border-cyan-500/40 hover:shadow-glow-ev transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Multi-Protocol EV Hubs</h3>
              <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                Filter by connector standard (CCS2, Type 2, GB/T, CHAdeMO) and power tiers
                up to 240kW ultra-fast DC. Never arrive at an occupied plug.
              </p>
            </div>
          </RevealOnScroll>

          <RevealOnScroll delay={0.3}>
            <div className="p-6 rounded-2xl bg-[#0e0e14]/90 border border-white/10 hover:border-rust/40 hover:shadow-glow-rust transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-rust/10 border border-rust/30 text-rust flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Guaranteed Barrier Passes</h3>
              <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                Reserve your spot in advance with digital QR passes. Motorized bollards and barrier gates
                auto-lift upon plate recognition scanning.
              </p>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* 5. Developer & Architecture Telemetry Section */}
      <RevealOnScroll>
        <DevEventsPanel />
      </RevealOnScroll>

      {/* 6. Accessible Driver FAQ Accordion */}
      <RevealOnScroll>
        <FaqAccordion />
      </RevealOnScroll>

      {/* 7. Bottom CTA Banner */}
      <section className="py-20 px-4 max-w-4xl mx-auto w-full text-center">
        <RevealOnScroll>
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-[#12121c] to-[#08080c] border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-rust/20 blur-[120px] pointer-events-none" />

            <h2 className="text-2xl sm:text-4xl font-bold font-sans text-white tracking-tight relative z-10">
              Ready to park without the hassle?
            </h2>
            <p className="text-neutral-400 text-xs sm:text-sm max-w-lg mx-auto mt-3 relative z-10">
              Discover Chandigarh’s 35 live parking lots and ultra-fast EV charging hubs right now.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
              <Link
                href="/finder"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-sm font-semibold text-white bg-rust hover:bg-rust-hover shadow-glow-rust transition-all active:scale-95"
              >
                <span>Launch Spot Radar</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-sm font-medium text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
              >
                <span>Explore Operator Dashboard</span>
              </Link>
            </div>
          </div>
        </RevealOnScroll>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-white/10 bg-[#040405] text-xs text-neutral-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Smart Parking & EV Charging Grid • Chandigarh Pilot</span>
          </div>

          <div className="flex items-center gap-6 text-[11px]">
            <Link href="/finder" className="hover:text-white transition-colors">
              Radar
            </Link>
            <Link href="/bookings" className="hover:text-white transition-colors">
              My Bookings
            </Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">
              Operator Analytics
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
