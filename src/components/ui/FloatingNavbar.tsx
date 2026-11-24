"use client";

/**
 * @file src/components/ui/FloatingNavbar.tsx
 * @description Scroll-aware floating glass pill navbar with role-based routing and clean link separation.
 * @purpose Solves text wrapping with whitespace-nowrap, separates Landing page marketing links
 * from App navigation links. Only displays "Operator View" if the authenticated session has the 'operator' role.
 * Hides wallet for non-customers, adds profile and wallet links, and displays a user menu with role badge.
 * @connections
 * - Reads session from NextAuth useSession()
 * - Reads wallet balance from /src/store/useWalletStore.ts
 * - Uses /src/hooks/useScrollSpy.ts for section tracking on homepage
 */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import {
  Zap,
  Compass,
  Calendar,
  BarChart3,
  Camera,
  Menu,
  X,
  Wallet,
  User,
  LogOut,
  ChevronDown,
  Shield,
  CreditCard,
} from "lucide-react";
import { useScrollSpy } from "@/hooks/useScrollSpy";
import { useWalletStore } from "@/store/useWalletStore";
import ThemeToggle from "./ThemeToggle";

const LANDING_SECTIONS = ["hero", "preview", "developers", "faq"];

export default function FloatingNavbar() {
  const pathname = usePathname();
  const isLandingPage = pathname === "/";
  const { data: session, status } = useSession();
  const wallet = useWalletStore((state) => state.wallet);

  const [hasScrolled, setHasScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const activeSection = useScrollSpy(LANDING_SECTIONS, 160);
  const userRole = session?.user?.role;
  const isOperator = userRole === "operator";
  const isGate = userRole === "gate" || userRole === "operator";
  const isCustomer = userRole === "customer" || !userRole;

  useEffect(() => {
    function handleScroll() {
      if (window.scrollY > 60) {
        setHasScrolled(true);
      } else {
        setHasScrolled(false);
      }
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToAnchor = (id: string) => {
    setMobileMenuOpen(false);
    if (!isLandingPage) return;
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 flex justify-center px-4 ${
          hasScrolled || !isLandingPage ? "pt-2.5 sm:pt-3" : "pt-5 bg-transparent"
        }`}
      >
        <motion.nav
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className={`flex items-center justify-between transition-all duration-300 w-full ${
            hasScrolled || !isLandingPage
              ? "max-w-5xl px-4 py-2 rounded-full bg-surface/90 border border-border shadow-glass backdrop-blur-xl"
              : "max-w-6xl px-4 py-2"
          }`}
        >
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus:outline-none rounded-full px-1 shrink-0"
          >
            <div className="relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-rust to-amber-500 text-white shadow-glow-rust group-hover:scale-105 transition-transform">
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white" />
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            </div>
            <div className="flex flex-col">
              <span className="font-sans font-bold text-xs sm:text-sm tracking-tight text-text flex items-center gap-1 whitespace-nowrap">
                SPARK<span className="text-rust">.EV</span>
              </span>
              <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-muted font-mono -mt-1 whitespace-nowrap">
                City Grid
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-1 text-xs">
            {isLandingPage ? (
              /* Case 1: Landing Page Links Only */
              <>
                <button
                  type="button"
                  onClick={() => scrollToAnchor("hero")}
                  className={`relative px-3 py-1.5 rounded-full font-medium transition-colors whitespace-nowrap ${
                    activeSection === "hero" ? "text-text font-bold" : "text-muted hover:text-text"
                  }`}
                >
                  Overview
                  {activeSection === "hero" && (
                    <motion.div
                      layoutId="activePill"
                      className="absolute inset-0 bg-border rounded-full -z-10"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => scrollToAnchor("preview")}
                  className={`relative px-3 py-1.5 rounded-full font-medium transition-colors whitespace-nowrap ${
                    activeSection === "preview" ? "text-text font-bold" : "text-muted hover:text-text"
                  }`}
                >
                  Live Radar
                  {activeSection === "preview" && (
                    <motion.div
                      layoutId="activePill"
                      className="absolute inset-0 bg-border rounded-full -z-10"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => scrollToAnchor("developers")}
                  className={`relative px-3 py-1.5 rounded-full font-medium transition-colors whitespace-nowrap ${
                    activeSection === "developers" ? "text-text font-bold" : "text-muted hover:text-text"
                  }`}
                >
                  Telemetry
                  {activeSection === "developers" && (
                    <motion.div
                      layoutId="activePill"
                      className="absolute inset-0 bg-border rounded-full -z-10"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => scrollToAnchor("faq")}
                  className={`relative px-3 py-1.5 rounded-full font-medium transition-colors whitespace-nowrap ${
                    activeSection === "faq" ? "text-text font-bold" : "text-muted hover:text-text"
                  }`}
                >
                  FAQ
                  {activeSection === "faq" && (
                    <motion.div
                      layoutId="activePill"
                      className="absolute inset-0 bg-border rounded-full -z-10"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              </>
            ) : (
              /* Case 2: App Pages Links */
              <>
                <Link
                  href="/finder"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-colors whitespace-nowrap ${
                    pathname === "/finder"
                      ? "text-cyan-400 bg-cyan-500/10 border border-cyan-500/30"
                      : "text-muted hover:text-text"
                  }`}
                >
                  <Compass className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Finder</span>
                </Link>

                <Link
                  href="/bookings"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-colors whitespace-nowrap ${
                    pathname === "/bookings"
                      ? "text-amber-400 bg-amber-500/10 border border-amber-500/30"
                      : "text-muted hover:text-text"
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>My Bookings</span>
                </Link>

                {/* Show Gate Scanner if role is gate or operator */}
                {isGate && (
                  <Link
                    href="/gate"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-colors whitespace-nowrap ${
                      pathname === "/gate"
                        ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/30"
                        : "text-muted hover:text-text"
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Gate Terminal</span>
                  </Link>
                )}

                {/* Show Operator View ONLY if role is operator */}
                {isOperator && (
                  <Link
                    href="/operator"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-colors whitespace-nowrap ${
                      pathname.startsWith("/operator")
                        ? "text-rust bg-rust/10 border border-rust/30 font-bold"
                        : "text-muted hover:text-text"
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-rust" />
                    <span>Operator Suite</span>
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Right Controls: Wallet, Theme, User Menu, and CTA */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Wallet pill: ONLY visible for customers, hidden for operator/gate */}
            {isCustomer && status === "authenticated" && (
              <Link
                href="/wallet"
                title="Customer Digital Wallet"
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-subtle border border-border text-xs font-mono text-text hover:border-amber-500/40 transition-colors whitespace-nowrap"
              >
                <Wallet className="w-3 h-3 text-amber-400" />
                <span>₹{wallet.balance}</span>
              </Link>
            )}

            {/* Light / Dark Mode Toggle */}
            <ThemeToggle />

            {/* Landing Page: "Find Spot" Action CTA */}
            {isLandingPage ? (
              <Link
                href="/finder"
                className="relative inline-flex items-center justify-center px-4 py-1.5 text-xs font-semibold text-white bg-rust hover:bg-rust-hover rounded-full shadow-glow-rust transition-all active:scale-95 whitespace-nowrap"
              >
                Find Spot
              </Link>
            ) : null}

            {/* User Profile / Auth State Menu */}
            {status === "authenticated" && session.user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1.5 p-1 rounded-full bg-surface-subtle hover:bg-border border border-border text-xs text-text transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-rust/20 border border-rust/40 text-rust-light font-bold text-[11px] flex items-center justify-center">
                    {session.user.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <ChevronDown className="w-3 h-3 text-muted mr-1" />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-52 rounded-2xl bg-surface border border-border p-2 shadow-2xl z-50 text-xs"
                    >
                      <div className="px-3 py-2 border-b border-border">
                        <p className="font-bold text-text truncate">{session.user.name}</p>
                        <p className="text-[10px] text-muted truncate">{session.user.email}</p>
                        <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-mono uppercase font-bold bg-rust/10 text-rust border border-rust/30">
                          {session.user.role}
                        </span>
                      </div>

                      <div className="py-1">
                        {isCustomer && (
                          <>
                            <Link
                              href="/profile"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg text-text hover:bg-surface-subtle"
                            >
                              <User className="w-3.5 h-3.5 text-cyan-400" />
                              <span>Driver Profile</span>
                            </Link>

                            <Link
                              href="/wallet"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg text-text hover:bg-surface-subtle"
                            >
                              <Wallet className="w-3.5 h-3.5 text-amber-400" />
                              <span>Wallet & Balance</span>
                            </Link>

                            <Link
                              href="/bookings"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg text-text hover:bg-surface-subtle"
                            >
                              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                              <span>My Bookings</span>
                            </Link>
                          </>
                        )}

                        {isOperator && (
                          <Link
                            href="/operator"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-text hover:bg-surface-subtle font-bold"
                          >
                            <BarChart3 className="w-3.5 h-3.5 text-rust" />
                            <span>Operator Dashboard</span>
                          </Link>
                        )}

                        {isGate && (
                          <Link
                            href="/gate"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-text hover:bg-surface-subtle"
                          >
                            <Camera className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Gate Scanner</span>
                          </Link>
                        )}
                      </div>

                      <div className="pt-1 border-t border-border">
                        <button
                          type="button"
                          onClick={() => {
                            setUserMenuOpen(false);
                            signOut({ callbackUrl: "/" });
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-500/10 text-left transition-colors font-medium"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : status === "unauthenticated" ? (
              <Link
                href="/login"
                className="px-3.5 py-1.5 rounded-full border border-border text-xs font-semibold text-text hover:bg-surface-subtle transition-colors whitespace-nowrap"
              >
                Sign In
              </Link>
            ) : null}

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-full bg-surface-subtle border border-border text-text hover:bg-border transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </motion.nav>
      </header>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-x-4 top-20 z-40 p-4 rounded-3xl bg-surface border border-border shadow-2xl backdrop-blur-2xl lg:hidden text-xs space-y-3"
          >
            <div className="flex flex-col space-y-1">
              <Link
                href="/finder"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 p-2.5 rounded-xl text-text hover:bg-surface-subtle font-medium"
              >
                <Compass className="w-4 h-4 text-cyan-400" />
                <span>Finder Map</span>
              </Link>

              <Link
                href="/bookings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 p-2.5 rounded-xl text-text hover:bg-surface-subtle font-medium"
              >
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>My Bookings</span>
              </Link>

              {isCustomer && status === "authenticated" && (
                <>
                  <Link
                    href="/wallet"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl text-text hover:bg-surface-subtle font-medium"
                  >
                    <Wallet className="w-4 h-4 text-amber-400" />
                    <span>My Wallet (₹{wallet.balance})</span>
                  </Link>

                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl text-text hover:bg-surface-subtle font-medium"
                  >
                    <User className="w-4 h-4 text-cyan-400" />
                    <span>Driver Profile & Vehicles</span>
                  </Link>
                </>
              )}

              {isGate && (
                <Link
                  href="/gate"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl text-text hover:bg-surface-subtle font-medium"
                >
                  <Camera className="w-4 h-4 text-emerald-400" />
                  <span>Gate Scanner Terminal</span>
                </Link>
              )}

              {isOperator && (
                <Link
                  href="/operator"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl text-rust hover:bg-rust/10 font-bold"
                >
                  <BarChart3 className="w-4 h-4 text-rust" />
                  <span>Operator Control Suite</span>
                </Link>
              )}
            </div>

            <div className="pt-2 border-t border-border flex justify-between items-center">
              {status === "authenticated" && session.user ? (
                <div className="flex items-center justify-between w-full">
                  <div className="flex flex-col">
                    <span className="font-bold text-text">{session.user.name}</span>
                    <span className="text-[10px] text-muted">{session.user.role}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      signOut({ callbackUrl: "/" });
                    }}
                    className="p-2 rounded-xl bg-rose-500/10 text-rose-400 font-semibold"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2 rounded-xl bg-rust text-white text-center font-bold"
                >
                  Sign In
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
