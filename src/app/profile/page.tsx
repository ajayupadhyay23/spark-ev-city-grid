"use client";

/**
 * @file src/app/profile/page.tsx
 * @description Driver Customer Profile page.
 * @purpose Manages customer profile credentials, saved vehicle fleet (plate, type, connector standard),
 * payment instruments, and alert notification preferences.
 *
 * @connections
 * - Authenticated customer session from NextAuth
 * - Interacts with /api/auth/profile
 */

import React, { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  User,
  Car,
  Mail,
  Phone,
  Shield,
  CreditCard,
  Bell,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowLeft,
  Save,
  Zap,
} from "lucide-react";
import { VehicleDetails, ChargerType } from "@/types";
import { showToast } from "@/components/ui/Toast";

export default function ProfilePage() {
  const { data: session } = useSession();

  const [name, setName] = useState(session?.user?.name || "Rahul Verma");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [email] = useState(session?.user?.email || "customer@demo.com");

  // Saved vehicles state
  const [vehicles, setVehicles] = useState<VehicleDetails[]>([
    {
      id: "veh_1",
      plateNumber: "CH01-AB-1234",
      vehicleType: "Car",
      modelName: "Tata Nexon EV Max",
      connectorType: "CCS2",
      isDefault: true,
    },
    {
      id: "veh_2",
      plateNumber: "CH01-BK-9988",
      vehicleType: "SUV",
      modelName: "Hyundai Creta",
      isDefault: false,
    },
  ]);

  // New vehicle form state
  const [newPlate, setNewPlate] = useState("");
  const [newType, setNewType] = useState<VehicleDetails["vehicleType"]>("Car");
  const [newModel, setNewModel] = useState("");
  const [newConnector, setNewConnector] = useState<ChargerType>("CCS2");
  const [showAddVehicle, setShowAddVehicle] = useState(false);

  // Notification preferences
  const [notifications, setNotifications] = useState({
    email: true,
    sms: true,
    bookingReminders: true,
  });

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlate.trim()) {
      showToast("Required Field", "Please enter vehicle registration plate number.", "error");
      return;
    }

    const newVeh: VehicleDetails = {
      id: `veh_${Date.now()}`,
      plateNumber: newPlate.toUpperCase().trim(),
      vehicleType: newType,
      modelName: newModel.trim() || undefined,
      connectorType: newConnector,
      isDefault: vehicles.length === 0,
    };

    setVehicles([...vehicles, newVeh]);
    setNewPlate("");
    setNewModel("");
    setShowAddVehicle(false);
    showToast("Vehicle Registered", `${newVeh.plateNumber} added to your fleet.`, "success");
  };

  const handleDeleteVehicle = (id: string | undefined) => {
    if (!id) return;
    setVehicles(vehicles.filter((v) => v.id !== id));
    showToast("Vehicle Removed", "Vehicle deleted from profile.", "info");
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    showToast("Profile Updated", "Account details saved successfully.", "success");
  };

  return (
    <div className="flex-1 pt-24 pb-16 px-4 max-w-4xl mx-auto w-full space-y-6">
      {/* Back button */}
      <Link
        href="/finder"
        className="inline-flex items-center gap-2 text-xs font-mono text-muted hover:text-text transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Grid Radar</span>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-sans text-text">Driver Profile</h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Manage your personal credentials, registered vehicle fleet, and notifications
          </p>
        </div>

        <span className="px-3 py-1 rounded-full bg-rust/10 border border-rust/30 text-rust font-mono text-xs font-bold self-start sm:self-auto">
          Role: {session?.user?.role || "Customer"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Details Form */}
        <div className="p-6 rounded-3xl bg-surface border border-border space-y-5 shadow-sm">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <User className="w-4 h-4 text-rust" />
            <h2 className="font-bold text-sm text-text">Personal Information</h2>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div>
              <label className="block text-muted font-medium mb-1">Full Legal Name</label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-muted absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded-xl pl-9 pr-3 py-2 text-text focus:outline-none focus:border-rust"
                />
              </div>
            </div>

            <div>
              <label className="block text-muted font-medium mb-1">Email Address (Read-only)</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-muted absolute left-3 top-2.5" />
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full bg-surface-2 border border-border rounded-xl pl-9 pr-3 py-2 text-muted opacity-80 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-muted font-medium mb-1">Mobile Phone Number</label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-muted absolute left-3 top-2.5" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded-xl pl-9 pr-3 py-2 text-text focus:outline-none focus:border-rust"
                />
              </div>
            </div>

            <button
              type="submit"
              className="py-2 px-4 rounded-xl bg-rust hover:bg-rust-hover text-white font-semibold shadow-glow-rust flex items-center gap-1.5 transition-all active:scale-95 text-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </form>
        </div>

        {/* Notifications & Security */}
        <div className="p-6 rounded-3xl bg-surface border border-border space-y-5 shadow-sm">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Bell className="w-4 h-4 text-cyan-400" />
            <h2 className="font-bold text-sm text-text">Notification Preferences</h2>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-3 rounded-xl bg-surface-2 border border-border cursor-pointer">
              <div>
                <span className="font-bold text-text block">Session Expiry SMS Alerts</span>
                <span className="text-[11px] text-muted">Receive SMS 15 mins before booking ends</span>
              </div>
              <input
                type="checkbox"
                checked={notifications.sms}
                onChange={(e) => setNotifications({ ...notifications, sms: e.target.checked })}
                className="w-4 h-4 rounded text-rust focus:ring-rust"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-surface-2 border border-border cursor-pointer">
              <div>
                <span className="font-bold text-text block">Digital Receipts via Email</span>
                <span className="text-[11px] text-muted">Receive VAT invoice and barrier token PDF</span>
              </div>
              <input
                type="checkbox"
                checked={notifications.email}
                onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })}
                className="w-4 h-4 rounded text-rust focus:ring-rust"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-surface-2 border border-border cursor-pointer">
              <div>
                <span className="font-bold text-text block">EV Full Charge Push Notification</span>
                <span className="text-[11px] text-muted">Alert when battery reaches target kWh</span>
              </div>
              <input
                type="checkbox"
                checked={notifications.bookingReminders}
                onChange={(e) => setNotifications({ ...notifications, bookingReminders: e.target.checked })}
                className="w-4 h-4 rounded text-rust focus:ring-rust"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Saved Vehicle Fleet Section */}
      <div className="p-6 rounded-3xl bg-surface border border-border space-y-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <Car className="w-4 h-4 text-amber-400" />
            <h2 className="font-bold text-sm text-text">Registered Vehicles ({vehicles.length})</h2>
          </div>

          <button
            type="button"
            onClick={() => setShowAddVehicle(!showAddVehicle)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-surface-2 hover:bg-border text-xs text-text transition-colors self-start sm:self-auto font-semibold"
          >
            <Plus className="w-3.5 h-3.5 text-rust" />
            <span>{showAddVehicle ? "Close Form" : "Register Vehicle"}</span>
          </button>
        </div>

        {/* Add Vehicle Inline Form */}
        {showAddVehicle && (
          <form
            onSubmit={handleAddVehicle}
            className="p-4 rounded-2xl bg-surface-2 border border-border space-y-3 text-xs"
          >
            <h3 className="font-bold text-text">Add New Vehicle</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-muted mb-1 font-mono">Plate Number</label>
                <input
                  type="text"
                  required
                  placeholder="CH01-AB-1234"
                  value={newPlate}
                  onChange={(e) => setNewPlate(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl px-2.5 py-1.5 text-text font-mono uppercase focus:outline-none focus:border-rust"
                />
              </div>

              <div>
                <label className="block text-muted mb-1">Vehicle Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as VehicleDetails["vehicleType"])}
                  className="w-full bg-surface border border-border rounded-xl px-2.5 py-1.5 text-text focus:outline-none focus:border-rust"
                >
                  <option value="Car">Car</option>
                  <option value="SUV">SUV</option>
                  <option value="Two-Wheeler">Two-Wheeler</option>
                  <option value="Commercial">Commercial</option>
                </select>
              </div>

              <div>
                <label className="block text-muted mb-1">Model Name</label>
                <input
                  type="text"
                  placeholder="e.g. Tata Nexon EV"
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl px-2.5 py-1.5 text-text focus:outline-none focus:border-rust"
                />
              </div>

              <div>
                <label className="block text-muted mb-1">EV Connector</label>
                <select
                  value={newConnector}
                  onChange={(e) => setNewConnector(e.target.value as ChargerType)}
                  className="w-full bg-surface border border-border rounded-xl px-2.5 py-1.5 text-text focus:outline-none focus:border-rust font-mono"
                >
                  <option value="CCS2">CCS2</option>
                  <option value="Type 2">Type 2</option>
                  <option value="CHAdeMO">CHAdeMO</option>
                  <option value="GB/T">GB/T</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="py-1.5 px-4 rounded-xl bg-rust text-white font-semibold text-xs shadow-glow-rust"
            >
              Add Vehicle
            </button>
          </form>
        )}

        {/* Vehicles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {vehicles.map((v) => (
            <div
              key={v.id}
              className="p-4 rounded-2xl bg-surface-2 border border-border flex items-center justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-text">{v.plateNumber}</span>
                  {v.isDefault && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-muted text-[11px]">
                  {v.modelName || v.vehicleType} • {v.vehicleType}
                </p>
                {v.connectorType && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono text-cyan-400">
                    <Zap className="w-3 h-3" /> {v.connectorType}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleDeleteVehicle(v.id)}
                className="p-2 rounded-xl text-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Remove vehicle"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
