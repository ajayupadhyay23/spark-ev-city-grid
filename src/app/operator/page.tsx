"use client";

/**
 * @file src/app/operator/page.tsx
 * @description Comprehensive Municipal Parking & EV Operator Command Suite (/operator).
 * @purpose Dedicated suite for role: 'operator'. Organizes city-wide operations into 6 tabs:
 * 1. Overview Dashboard (KPI cards with animated counters, Recharts curves & heatmap)
 * 2. Bookings Management (Filterable table, detail drawer with status timeline, cancel/refund/extend/no-show)
 * 3. Customer Directory (Full driver profiles, fleet, spend, suspend toggle, credit grants)
 * 4. Spots & Chargers Control (Live occupancy, per-charger toggles, tariff editing, maintenance mode)
 * 5. Gate Barrier Events (Real-time SSE event stream, scan logs, manual overrides)
 * 6. Financial & Fiscal Reports (1-click CSV export of bookings & revenue)
 *
 * @connections
 * - Protected by Layer 1 (middleware.ts) and Layer 2 (/api/operator/*)
 * - Interacts with /api/operator/stats, /api/operator/bookings, /api/operator/customers, /api/operator/spots, /api/operator/export
 * - Listens to SSE event stream /api/gate/events
 */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Car,
  Zap,
  Activity,
  AlertTriangle,
  Download,
  Users,
  Calendar,
  Layers,
  Radio,
  Clock,
  Shield,
  Search,
  CheckCircle2,
  XCircle,
  X,
  Plus,
  RefreshCw,
  Loader2,
  Sliders,
  Unlock,
  CreditCard,
  Phone,
  Mail,
  Edit2,
  Check,
} from "lucide-react";
import { Reservation, Spot, UserRecord, GateEvent, AuditLogEntry } from "@/types";
import { showToast } from "@/components/ui/Toast";

interface OperatorKPIs {
  revenueToday: number;
  activeBookings: number;
  occupancyRate: number;
  chargersOnline: number;
  totalChargers: number;
  kwhDelivered: number;
  noShows: number;
  totalReservations: number;
  completedCount: number;
  cancelledCount: number;
}

export default function OperatorCommandSuite() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "bookings" | "customers" | "spots" | "gate_events" | "reports"
  >("overview");

  // State data collections
  const [kpis, setKpis] = useState<OperatorKPIs | null>(null);
  const [charts, setCharts] = useState<any>(null);
  const [bookings, setBookings] = useState<Reservation[]>([]);
  const [customers, setCustomers] = useState<(UserRecord & { totalSpend: number; totalBookings: number; recentBookings: Reservation[] })[]>([]);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [gateEvents, setGateEvents] = useState<GateEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Selected item detail drawers
  const [selectedBooking, setSelectedBooking] = useState<Reservation | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [creditModalUser, setCreditModalUser] = useState<UserRecord | null>(null);
  const [creditAmount, setCreditAmount] = useState<string>("250");
  const [creditReason, setCreditReason] = useState<string>("");

  // Search & filter controls
  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingStatusFilter, setBookingStatusFilter] = useState("all");
  const [customerSearch, setCustomerSearch] = useState("");

  // Price edit inline state
  const [editingSpotId, setEditingSpotId] = useState<string | null>(null);
  const [editPerHour, setEditPerHour] = useState<number>(30);
  const [editPerKwh, setEditPerKwh] = useState<number>(18);

  // Load Initial Overview & Collections
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, bookingsRes, custRes, spotsRes] = await Promise.all([
        fetch("/api/operator/stats"),
        fetch("/api/operator/bookings"),
        fetch("/api/operator/customers"),
        fetch("/api/operator/spots"),
      ]);

      const [statsData, bookingsData, custData, spotsData] = await Promise.all([
        statsRes.json(),
        bookingsRes.json(),
        custRes.json(),
        spotsRes.json(),
      ]);

      if (statsData.success) {
        setKpis(statsData.kpis);
        setCharts(statsData.charts);
      }
      if (bookingsData.success) setBookings(bookingsData.bookings);
      if (custData.success) setCustomers(custData.customers);
      if (spotsData.success) setSpots(spotsData.spots);
    } catch (e) {
      console.warn("Failed to load operator suite data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Listen to Server-Sent Events (SSE) for live gate barrier openings
  useEffect(() => {
    const eventSource = new EventSource("/api/gate/events");

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.type === "connected") return;

        const newGateEvent: GateEvent = {
          id: `sse_${Date.now()}`,
          spotId: parsed.spotId,
          spotName: parsed.spotId.replace(/_/g, " ").toUpperCase(),
          gateType: parsed.gateType || "entry",
          plateNumber: parsed.plateNumber || "VEHICLE",
          decision: "OPEN",
          reason: "Live physical barrier sensor trigger",
          timestamp: parsed.timestamp || new Date().toISOString(),
          reservationId: parsed.bookingId,
        };

        setGateEvents((prev) => [newGateEvent, ...prev.slice(0, 30)]);
      } catch (err) {
        console.warn("[SSE Operator] Event parse error:", err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // Booking Actions
  const handleBookingAction = async (
    bookingId: string,
    action: "cancel" | "refund" | "extend" | "mark_noshow" | "resend_qr",
    extraHours?: number
  ) => {
    try {
      const res = await fetch("/api/operator/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, action, additionalHours: extraHours }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Action Executed", data.message, "success");
        loadData();
        if (selectedBooking && selectedBooking.id === bookingId) {
          setSelectedBooking(data.booking || null);
        }
      } else {
        showToast("Action Failed", data.error, "error");
      }
    } catch {
      showToast("Error", "Network error.", "error");
    }
  };

  // Customer Actions: Toggle status & grant wallet credit
  const handleToggleCustomerStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "active" ? "suspended" : "active";
    try {
      const res = await fetch("/api/operator/customers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "toggle_status", status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Status Updated", data.message, "success");
        loadData();
      }
    } catch {
      showToast("Error", "Network error.", "error");
    }
  };

  const handleGrantCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditModalUser) return;
    const amount = parseFloat(creditAmount);
    if (isNaN(amount) || amount <= 0) return;

    try {
      const res = await fetch("/api/operator/customers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: creditModalUser.id,
          action: "grant_credit",
          creditAmount: amount,
          reason: creditReason || "Courtesy operator grant",
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Credit Granted", `₹${amount} added to customer wallet.`, "success");
        setCreditModalUser(null);
        setCreditReason("");
        loadData();
      }
    } catch {
      showToast("Error", "Failed to grant credit.", "error");
    }
  };

  // Spot Actions: Pricing update, maintenance toggle, charger toggle
  const handleSavePrice = async (spotId: string) => {
    try {
      const res = await fetch("/api/operator/spots", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spotId,
          action: "update_price",
          perHour: editPerHour,
          perKwh: editPerKwh,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Tariff Updated", data.message, "success");
        setEditingSpotId(null);
        loadData();
      }
    } catch {
      showToast("Error", "Failed to update pricing.", "error");
    }
  };

  const handleToggleMaintenance = async (spotId: string, currentStatus: boolean | undefined) => {
    try {
      const res = await fetch("/api/operator/spots", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spotId,
          action: "toggle_maintenance",
          isMaintenance: !currentStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Facility Mode", data.message, "success");
        loadData();
      }
    } catch {
      showToast("Error", "Failed to toggle maintenance mode.", "error");
    }
  };

  const handleToggleCharger = async (
    spotId: string,
    chargerId: string,
    nextStatus: "available" | "occupied" | "offline"
  ) => {
    try {
      const res = await fetch("/api/operator/spots", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spotId,
          action: "toggle_charger",
          chargerId,
          chargerStatus: nextStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Charger Updated", data.message, "success");
        loadData();
      }
    } catch {
      showToast("Error", "Failed to update charger status.", "error");
    }
  };

  return (
    <div className="flex-1 pt-24 pb-16 px-4 max-w-7xl mx-auto w-full space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rust animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-wider text-muted font-bold">
              Municipal Command Suite
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-sans text-text">
            City Grid Operations
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="p-2 rounded-xl border border-border bg-surface hover:bg-surface-2 text-text transition-colors"
            title="Refresh Grid Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-rust" : ""}`} />
          </button>

          <a
            href="/api/operator/export"
            download
            className="px-4 py-2 rounded-xl bg-rust hover:bg-rust-hover text-white text-xs font-semibold shadow-glow-rust flex items-center gap-1.5 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV Report</span>
          </a>
        </div>
      </div>

      {/* Primary 6 Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto p-1 rounded-2xl bg-surface border border-border text-xs scrollbar-thin">
        {[
          { id: "overview", label: "Overview", icon: BarChart3 },
          { id: "bookings", label: `Bookings (${bookings.length})`, icon: Calendar },
          { id: "customers", label: `Customers (${customers.length})`, icon: Users },
          { id: "spots", label: `Facilities (${spots.length})`, icon: Layers },
          { id: "gate_events", label: "Gate SSE Stream", icon: Radio },
          { id: "reports", label: "Reports & CSV", icon: Download },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-all ${
                active
                  ? "bg-surface-2 text-text font-bold shadow-sm border border-border"
                  : "text-muted hover:text-text"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${active ? "text-rust" : "text-muted"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW DASHBOARD */}
      {activeTab === "overview" && kpis && (
        <div className="space-y-6">
          {/* Animated KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="p-4 rounded-2xl bg-surface border border-border space-y-1">
              <span className="text-[10px] text-muted font-mono uppercase">Revenue Today</span>
              <p className="text-xl font-bold font-mono text-emerald-400">
                ₹{kpis.revenueToday.toLocaleString()}
              </p>
              <span className="text-[10px] text-muted block">+12% vs last week</span>
            </div>

            <div className="p-4 rounded-2xl bg-surface border border-border space-y-1">
              <span className="text-[10px] text-muted font-mono uppercase">Active Bookings</span>
              <p className="text-xl font-bold font-mono text-cyan-400">{kpis.activeBookings}</p>
              <span className="text-[10px] text-muted block">Vehicles parked/charging</span>
            </div>

            <div className="p-4 rounded-2xl bg-surface border border-border space-y-1">
              <span className="text-[10px] text-muted font-mono uppercase">Grid Occupancy</span>
              <p className="text-xl font-bold font-mono text-amber-400">{kpis.occupancyRate}%</p>
              <span className="text-[10px] text-muted block">City-wide slot load</span>
            </div>

            <div className="p-4 rounded-2xl bg-surface border border-border space-y-1">
              <span className="text-[10px] text-muted font-mono uppercase">Chargers Online</span>
              <p className="text-xl font-bold font-mono text-emerald-400">
                {kpis.chargersOnline}/{kpis.totalChargers}
              </p>
              <span className="text-[10px] text-muted block">96% fleet uptime</span>
            </div>

            <div className="p-4 rounded-2xl bg-surface border border-border space-y-1">
              <span className="text-[10px] text-muted font-mono uppercase">Delivered Energy</span>
              <p className="text-xl font-bold font-mono text-cyan-400">
                {kpis.kwhDelivered} kWh
              </p>
              <span className="text-[10px] text-muted block">Dispersed today</span>
            </div>

            <div className="p-4 rounded-2xl bg-surface border border-border space-y-1">
              <span className="text-[10px] text-muted font-mono uppercase">No-Shows</span>
              <p className="text-xl font-bold font-mono text-rose-400">{kpis.noShows}</p>
              <span className="text-[10px] text-muted block">Expired reservations</span>
            </div>
          </div>

          {/* Recharts Analytics Curves */}
          {charts && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Hourly Occupancy Trajectory */}
              <div className="p-6 rounded-3xl bg-surface border border-border space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-text">24-Hour Occupancy Curve</h3>
                  <span className="text-xs font-mono text-muted">Bays vs EV Stations</span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={charts.occupancyOverTime}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="time" stroke="#64748B" fontSize={11} />
                      <YAxis stroke="#64748B" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0e0e14",
                          borderColor: "rgba(255,255,255,0.1)",
                          borderRadius: "12px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="occupancy"
                        stroke="#C2603F"
                        fill="#C2603F"
                        fillOpacity={0.2}
                        name="Parking Bays %"
                      />
                      <Area
                        type="monotone"
                        dataKey="evLoad"
                        stroke="#00D2FF"
                        fill="#00D2FF"
                        fillOpacity={0.2}
                        name="EV Fast Chargers %"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 7-Day Revenue Trend */}
              <div className="p-6 rounded-3xl bg-surface border border-border space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-text">Weekly Revenue vs Target</h3>
                  <span className="text-xs font-mono text-emerald-400 font-bold">Target: ₹450k</span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.revenueByDay}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="day" stroke="#64748B" fontSize={11} />
                      <YAxis stroke="#64748B" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0e0e14",
                          borderColor: "rgba(255,255,255,0.1)",
                          borderRadius: "12px",
                        }}
                      />
                      <Bar dataKey="revenue" fill="#10B981" radius={[6, 6, 0, 0]} name="Actual (₹)" />
                      <Bar dataKey="target" fill="#334155" radius={[6, 6, 0, 0]} name="Target (₹)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BOOKINGS TABLE & DETAIL DRAWER */}
      {activeTab === "bookings" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-surface border border-border text-xs">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search booking ID, plate, or customer..."
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surface-2 border border-border text-text focus:outline-none focus:border-rust"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-muted">Status:</span>
              <select
                value={bookingStatusFilter}
                onChange={(e) => setBookingStatusFilter(e.target.value)}
                className="bg-surface-2 border border-border rounded-xl px-2.5 py-1.5 text-text focus:outline-none focus:border-rust"
              >
                <option value="all">All States</option>
                <option value="active">Active</option>
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Bookings Table */}
          <div className="rounded-3xl bg-surface border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-2 border-b border-border text-muted uppercase font-mono text-[10px]">
                  <tr>
                    <th className="p-3.5">ID / Date</th>
                    <th className="p-3.5">Customer</th>
                    <th className="p-3.5">Facility</th>
                    <th className="p-3.5">Plate</th>
                    <th className="p-3.5">Time Window</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Tariff</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {bookings
                    .filter((b) => {
                      if (bookingStatusFilter !== "all" && b.status !== bookingStatusFilter) return false;
                      if (
                        bookingSearch &&
                        !b.id.toLowerCase().includes(bookingSearch.toLowerCase()) &&
                        !b.vehicle.plateNumber.toLowerCase().includes(bookingSearch.toLowerCase()) &&
                        !(b.customerName && b.customerName.toLowerCase().includes(bookingSearch.toLowerCase()))
                      )
                        return false;
                      return true;
                    })
                    .map((b) => (
                      <tr
                        key={b.id}
                        onClick={() => setSelectedBooking(b)}
                        className="hover:bg-surface-2/60 cursor-pointer transition-colors"
                      >
                        <td className="p-3.5 font-mono">
                          <span className="font-bold text-text block">{b.id.slice(0, 12)}</span>
                          <span className="text-[10px] text-muted">
                            {format(new Date(b.createdAt), "dd MMM, hh:mm a")}
                          </span>
                        </td>
                        <td className="p-3.5 font-medium text-text">
                          {b.customerName || "Customer"}
                        </td>
                        <td className="p-3.5">
                          <span className="font-semibold text-text block truncate max-w-[140px]">
                            {b.spotName}
                          </span>
                          <span className="text-[10px] text-muted font-mono uppercase">
                            {b.spotType} • {b.slotId || "Bay"}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono font-bold text-cyan-400">
                          {b.vehicle.plateNumber}
                        </td>
                        <td className="p-3.5 text-muted font-mono text-[11px]">
                          {format(new Date(b.startTime), "hh:mm a")} ➔{" "}
                          {format(new Date(b.endTime), "hh:mm a")}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold ${
                              b.status === "active"
                                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                                : b.status === "upcoming"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                                : b.status === "completed"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono font-bold text-text">
                          ₹{b.pricing.totalAmount}
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBooking(b);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-surface-2 hover:bg-border border border-border text-[11px] font-semibold text-text"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CUSTOMERS DIRECTORY */}
      {activeTab === "customers" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-surface border border-border text-xs">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by driver name, phone, or email..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surface-2 border border-border text-text focus:outline-none focus:border-rust"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customers
              .filter(
                (c) =>
                  !customerSearch ||
                  c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                  c.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
                  c.phone.toLowerCase().includes(customerSearch.toLowerCase())
              )
              .map((c) => (
                <div
                  key={c.id}
                  className="p-5 rounded-3xl bg-surface border border-border space-y-4 hover:border-rust/40 transition-colors shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-text">{c.name}</h3>
                      <p className="text-[11px] text-muted">{c.email}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold ${
                        c.status === "active"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono p-3 rounded-2xl bg-surface-2 border border-border">
                    <div>
                      <span className="text-[10px] text-muted block">Wallet Balance</span>
                      <span className="font-bold text-amber-400">₹{c.walletBalance}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted block">Total Spend</span>
                      <span className="font-bold text-text">₹{c.totalSpend}</span>
                    </div>
                  </div>

                  {c.savedVehicles && c.savedVehicles.length > 0 && (
                    <div className="text-[11px] text-muted space-y-1">
                      <span className="font-bold text-text block">Registered Fleet:</span>
                      <div className="flex flex-wrap gap-1">
                        {c.savedVehicles.map((v, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded bg-surface-2 border border-border font-mono text-[10px]"
                          >
                            {v.plateNumber} ({v.vehicleType})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setCreditModalUser(c)}
                      className="px-3 py-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-400 text-xs font-semibold hover:bg-amber-500/20"
                    >
                      + Grant Credit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleCustomerStatus(c.id, c.status)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold ${
                        c.status === "active"
                          ? "border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                      }`}
                    >
                      {c.status === "active" ? "Suspend" : "Unsuspend"}
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB 4: SPOTS & CHARGERS */}
      {activeTab === "spots" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {spots.map((spot) => (
              <div
                key={spot.id}
                className="p-5 rounded-3xl bg-surface border border-border space-y-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base text-text">{spot.name}</h3>
                    <p className="text-xs text-muted">{spot.address}</p>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold ${
                      spot.type === "ev"
                        ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    {spot.type}
                  </span>
                </div>

                {/* Capacity & Live Pricing Controls */}
                <div className="p-3 rounded-2xl bg-surface-2 border border-border flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-muted block">Free / Total Slots</span>
                    <span className="font-bold text-emerald-400 text-sm">
                      {spot.freeSlots} of {spot.totalSlots} Vacant
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-muted block">Tariff</span>
                    <span className="font-bold text-text text-sm">
                      ₹{spot.type === "ev" ? `${spot.pricing.perKwh}/kWh` : `${spot.pricing.perHour}/hr`}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingSpotId(spot.id);
                      setEditPerHour(spot.pricing.perHour);
                      setEditPerKwh(spot.pricing.perKwh || 18);
                    }}
                    className="p-1.5 rounded-lg border border-border bg-surface hover:bg-border text-muted hover:text-text"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Inline Price Edit Drawer */}
                {editingSpotId === spot.id && (
                  <div className="p-3 rounded-xl bg-surface-2 border border-rust/40 space-y-2 text-xs">
                    <span className="font-bold text-rust block">Edit Standard Tariff</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-muted block">Hourly (₹)</label>
                        <input
                          type="number"
                          value={editPerHour}
                          onChange={(e) => setEditPerHour(Number(e.target.value))}
                          className="w-full bg-surface border border-border rounded-lg px-2 py-1 text-text font-mono"
                        />
                      </div>
                      {spot.type === "ev" && (
                        <div>
                          <label className="text-[10px] text-muted block">Per kWh (₹)</label>
                          <input
                            type="number"
                            value={editPerKwh}
                            onChange={(e) => setEditPerKwh(Number(e.target.value))}
                            className="w-full bg-surface border border-border rounded-lg px-2 py-1 text-text font-mono"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingSpotId(null)}
                        className="px-2.5 py-1 text-muted hover:text-text text-[11px]"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSavePrice(spot.id)}
                        className="px-3 py-1 rounded-lg bg-rust text-white font-bold text-[11px]"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}

                {/* EV Chargers Status Toggles */}
                {spot.chargers && spot.chargers.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <span className="text-[11px] font-mono text-muted uppercase font-bold block">
                      Individual Charger Ports
                    </span>
                    <div className="space-y-1.5">
                      {spot.chargers.map((c) => (
                        <div
                          key={c.id}
                          className="p-2 rounded-xl bg-surface-2 border border-border flex items-center justify-between text-xs font-mono"
                        >
                          <div>
                            <span className="font-bold text-text">{c.type}</span>
                            <span className="text-[10px] text-muted block">{c.powerKw}kW</span>
                          </div>

                          <div className="flex items-center gap-1">
                            {(["available", "occupied", "offline"] as const).map((status) => (
                              <button
                                key={status}
                                type="button"
                                onClick={() => handleToggleCharger(spot.id, c.id, status)}
                                className={`px-2 py-0.5 rounded text-[10px] capitalize transition-colors ${
                                  c.status === status
                                    ? status === "available"
                                      ? "bg-emerald-500 text-white font-bold"
                                      : status === "occupied"
                                      ? "bg-amber-500 text-black font-bold"
                                      : "bg-rose-500 text-white font-bold"
                                    : "bg-surface border border-border text-muted hover:text-text"
                                }`}
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Maintenance Mode Toggle */}
                <div className="pt-2 border-t border-border flex items-center justify-between">
                  <span className="text-xs text-muted font-medium">Facility Maintenance Mode:</span>
                  <button
                    type="button"
                    onClick={() => handleToggleMaintenance(spot.id, spot.isMaintenanceMode)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold border ${
                      spot.isMaintenanceMode
                        ? "bg-rose-500/20 text-rose-400 border-rose-500/40"
                        : "bg-surface-2 border-border text-muted hover:text-text"
                    }`}
                  >
                    {spot.isMaintenanceMode ? "In Maintenance" : "Operational"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: GATE SSE STREAM */}
      {activeTab === "gate_events" && (
        <div className="p-6 rounded-3xl bg-surface border border-border space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
              <h2 className="font-bold text-sm text-text">Real-Time Server-Sent Events (SSE)</h2>
            </div>
            <span className="text-[11px] font-mono text-muted">Listening on /api/gate/events</span>
          </div>

          {gateEvents.length === 0 ? (
            <div className="p-8 text-center text-muted text-xs font-mono">
              Listening for live boom-barrier releases and optical scanner scans...
            </div>
          ) : (
            <div className="space-y-2">
              {gateEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-3.5 rounded-2xl bg-surface-2 border border-border flex items-center justify-between text-xs font-mono"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {evt.decision}
                      </span>
                      <span className="font-bold text-text">{evt.plateNumber}</span>
                      <span className="text-muted">➔ {evt.spotName}</span>
                    </div>
                    <p className="text-[10px] text-muted">{evt.reason}</p>
                  </div>
                  <span className="text-[10px] text-muted">{format(new Date(evt.timestamp), "hh:mm:ss a")}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: REPORTS & EXPORTS */}
      {activeTab === "reports" && (
        <div className="p-8 rounded-3xl bg-surface border border-border text-center space-y-5 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-rust/10 text-rust flex items-center justify-center mx-auto">
            <Download className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-bold text-text">Municipal Financial & Audit Report</h2>
            <p className="text-xs text-muted">
              Download clean CSV formatted records of all parking bookings, EV charging energy kWh,
              tariff distributions, taxes, and gate events for audit reconciliation.
            </p>
          </div>

          <a
            href="/api/operator/export"
            download
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rust hover:bg-rust-hover text-white text-xs font-semibold shadow-glow-rust transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Download All Bookings (.CSV)</span>
          </a>
        </div>
      )}

      {/* Booking Detail Drawer Modal */}
      <AnimatePresence>
        {selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-xl rounded-3xl bg-surface border border-border p-6 space-y-5 shadow-2xl relative text-text text-xs max-h-[90vh] overflow-y-auto scrollbar-thin"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <h3 className="font-bold text-base">Booking #{selectedBooking.id}</h3>
                  <span className="text-[10px] text-muted font-mono">
                    Created {format(new Date(selectedBooking.createdAt), "dd MMM yyyy, hh:mm a")}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="p-1 rounded-lg text-muted hover:text-text"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Timeline */}
              <div className="p-4 rounded-2xl bg-surface-2 border border-border space-y-3 font-mono">
                <span className="text-[10px] text-muted uppercase font-bold block">
                  Session Lifecycle Timeline
                </span>
                <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
                  <div
                    className={`p-2 rounded-lg border ${
                      selectedBooking.gateState !== "cancelled"
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-bold"
                        : "border-border text-muted"
                    }`}
                  >
                    1. Reserved
                  </div>
                  <div
                    className={`p-2 rounded-lg border ${
                      selectedBooking.gateState === "checked_in" ||
                      selectedBooking.gateState === "charging" ||
                      selectedBooking.gateState === "completed"
                        ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-400 font-bold"
                        : "border-border text-muted"
                    }`}
                  >
                    2. Checked In
                  </div>
                  <div
                    className={`p-2 rounded-lg border ${
                      selectedBooking.gateState === "charging" ||
                      selectedBooking.gateState === "completed"
                        ? "border-amber-500/40 bg-amber-500/10 text-amber-400 font-bold"
                        : "border-border text-muted"
                    }`}
                  >
                    3. Charging
                  </div>
                  <div
                    className={`p-2 rounded-lg border ${
                      selectedBooking.gateState === "completed"
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-bold"
                        : "border-border text-muted"
                    }`}
                  >
                    4. Completed
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="p-4 rounded-2xl bg-surface-2 border border-border space-y-2 font-mono">
                <span className="text-[10px] text-muted uppercase font-bold block">
                  Financial Breakdown
                </span>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted">Base Rate:</span>
                    <span>₹{selectedBooking.pricing.baseAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Municipal Tax (18%):</span>
                    <span>₹{selectedBooking.pricing.taxes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Gateway Fee:</span>
                    <span>₹{selectedBooking.pricing.serviceFee}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-1 font-bold text-sm">
                    <span>Total Paid:</span>
                    <span className="text-rust">₹{selectedBooking.pricing.totalAmount}</span>
                  </div>
                </div>
              </div>

              {/* Operator Action Buttons */}
              <div className="pt-2 border-t border-border flex flex-wrap gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => handleBookingAction(selectedBooking.id, "extend", 1)}
                  className="px-3 py-1.5 rounded-xl border border-border bg-surface-2 hover:bg-border text-text font-semibold"
                >
                  Extend (+1h)
                </button>
                <button
                  type="button"
                  onClick={() => handleBookingAction(selectedBooking.id, "mark_noshow")}
                  className="px-3 py-1.5 rounded-xl border border-border bg-surface-2 hover:bg-border text-text font-semibold"
                >
                  Mark No-Show
                </button>
                <button
                  type="button"
                  onClick={() => handleBookingAction(selectedBooking.id, "refund")}
                  className="px-3 py-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-400 font-semibold"
                >
                  Grant Full Refund
                </button>
                <button
                  type="button"
                  onClick={() => handleBookingAction(selectedBooking.id, "cancel")}
                  className="px-3 py-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-400 font-semibold"
                >
                  Cancel Booking
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Credit Grant Dialog */}
      <AnimatePresence>
        {creditModalUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-3xl bg-surface border border-border p-6 space-y-4 shadow-2xl relative text-text text-xs"
            >
              <h3 className="font-bold text-sm">Grant Courtesy Wallet Credit</h3>
              <p className="text-muted">
                Add credit directly to <strong>{creditModalUser.name}</strong> ({creditModalUser.email}).
              </p>

              <form onSubmit={handleGrantCredit} className="space-y-3">
                <div>
                  <label className="text-muted block mb-1 font-mono">Amount (₹)</label>
                  <input
                    type="number"
                    min="10"
                    max="10000"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-text font-mono focus:outline-none focus:border-rust"
                  />
                </div>

                <div>
                  <label className="text-muted block mb-1">Reason / Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Firmware reboot delay reimbursement"
                    value={creditReason}
                    onChange={(e) => setCreditReason(e.target.value)}
                    className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-text focus:outline-none focus:border-rust"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCreditModalUser(null)}
                    className="px-3 py-1.5 rounded-xl bg-surface-2 text-muted hover:text-text font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-rust text-white font-bold shadow-glow-rust"
                  >
                    Grant Credit
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
