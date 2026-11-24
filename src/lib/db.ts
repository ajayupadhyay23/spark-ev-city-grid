/**
 * @file src/lib/db.ts
 * @description In-memory mock database holding seed spots, 30+ multi-state reservations,
 * gate audit events, and user digital wallets.
 * @purpose Self-contained zero-dependency persistence layer for rapid development, testing,
 * and operator demonstrations without requiring local PostgreSQL/Redis instances.
 *
 * HOW TO SWAP FOR POSTGRESQL + PRISMA:
 * 1. Define schema in `prisma/schema.prisma` (Spot, Reservation, User, GateEvent, AuditLog, Wallet).
 * 2. Replace array operations (`spots.find(...)`, `reservations.filter(...)`) with Prisma Client:
 *    - `await prisma.spot.findMany({ where: ... })`
 *    - `await prisma.reservation.create({ data: ... })`
 *    - `await prisma.reservation.update({ where: { id }, data: ... })`
 *    - `await prisma.auditLog.create({ data: ... })`
 *
 * @connections
 * - Used by /src/app/api/spots/...
 * - Used by /src/app/api/reservations/...
 * - Used by /src/app/api/gate/scan/...
 * - Used by /src/app/api/operator/...
 */

import {
  AuditLogEntry,
  GateEvent,
  Reservation,
  Spot,
  UserWallet,
  WalletTransaction,
} from "@/types";
import { INITIAL_WALLET_BALANCE } from "./constants";

interface MockDatabase {
  spots: Spot[];
  reservations: Reservation[];
  wallets: Record<string, UserWallet>;
  gateEvents: GateEvent[];
  auditLogs: AuditLogEntry[];
  hasSeeded: boolean;
}

declare global {
  // eslint-disable-next-line no-var
  var __mockDb: MockDatabase | undefined;
}

// 20 realistic Parking Lots around Chandigarh
const SEED_PARKING_LOTS: Spot[] = [
  {
    id: "park_sec17_multilevel",
    name: "Sector 17 Multi-Level Plaza",
    type: "parking",
    parkingType: "underground",
    location: { lat: 30.7398, lng: 76.7827 },
    address: "Near Neelam Theatre, Sector 17-B",
    city: "Chandigarh",
    state: "Chandigarh (UT)",
    district: "Chandigarh",
    totalSlots: 120,
    freeSlots: 45,
    pricing: { perHour: 30, perDay: 250 },
    amenities: ["CCTV", "24x7", "valet", "disabled-access", "security"],
    rating: 4.6,
    reviewCount: 320,
    openingHours: "24/7",
    gradient: "from-amber-600/30 via-orange-600/20 to-neutral-900",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "park_elante_basement",
    name: "Elante Mall P1 & P2 Express",
    type: "parking",
    parkingType: "underground",
    location: { lat: 30.7055, lng: 76.8013 },
    address: "Phase 1, Industrial Area",
    city: "Chandigarh",
    state: "Chandigarh (UT)",
    district: "Chandigarh",
    totalSlots: 350,
    freeSlots: 88,
    pricing: { perHour: 50, perDay: 400 },
    amenities: ["CCTV", "24x7", "valet", "disabled-access", "cafe", "restroom"],
    rating: 4.8,
    reviewCount: 840,
    openingHours: "09:00 AM - 12:00 AM",
    gradient: "from-orange-500/30 via-amber-700/20 to-neutral-900",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "park_sec35_market",
    name: "Sector 35-C Gourmet Plaza Parking",
    type: "parking",
    parkingType: "open",
    location: { lat: 30.7259, lng: 76.7645 },
    address: "SCO 401-402, Inner Ring Road",
    city: "Chandigarh",
    state: "Chandigarh (UT)",
    district: "Chandigarh",
    totalSlots: 75,
    freeSlots: 14,
    pricing: { perHour: 20, perDay: 180 },
    amenities: ["CCTV", "24x7", "security"],
    rating: 4.3,
    reviewCount: 210,
    openingHours: "24/7",
    gradient: "from-amber-700/30 via-orange-800/20 to-neutral-900",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "park_sec22_aroma",
    name: "Sector 22-C Aroma Market Lot",
    type: "parking",
    parkingType: "open",
    location: { lat: 30.7314, lng: 76.7742 },
    address: "Opposite Hotel Aroma, Himalaya Marg",
    city: "Chandigarh",
    state: "Chandigarh (UT)",
    district: "Chandigarh",
    totalSlots: 90,
    freeSlots: 8,
    pricing: { perHour: 25, perDay: 200 },
    amenities: ["CCTV", "security"],
    rating: 4.1,
    reviewCount: 195,
    openingHours: "08:00 AM - 11:30 PM",
    gradient: "from-orange-600/30 via-amber-600/20 to-neutral-900",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "park_sec43_isbt",
    name: "ISBT Sector 43 Long-Stay Parking",
    type: "parking",
    parkingType: "covered",
    location: { lat: 30.7188, lng: 76.7461 },
    address: "Inter-State Bus Terminal, Sector 43",
    city: "Chandigarh",
    state: "Chandigarh (UT)",
    district: "Chandigarh",
    totalSlots: 200,
    freeSlots: 112,
    pricing: { perHour: 20, perDay: 150 },
    amenities: ["CCTV", "24x7", "disabled-access", "restroom", "security"],
    rating: 4.4,
    reviewCount: 430,
    openingHours: "24/7",
    gradient: "from-amber-500/30 via-orange-500/20 to-neutral-900",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "park_it_park_tech",
    name: "Rajiv Gandhi IT Park Tech Hub Parking",
    type: "parking",
    parkingType: "underground",
    location: { lat: 30.7252, lng: 76.8378 },
    address: "DLF Cybercity Campus, IT Park",
    city: "Chandigarh",
    state: "Chandigarh (UT)",
    district: "Chandigarh",
    totalSlots: 280,
    freeSlots: 95,
    pricing: { perHour: 30, perDay: 220 },
    amenities: ["CCTV", "24x7", "valet", "disabled-access", "cafe", "security"],
    rating: 4.7,
    reviewCount: 512,
    openingHours: "24/7",
    gradient: "from-orange-600/30 via-amber-500/20 to-neutral-900",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "park_pgi_merlin",
    name: "PGIMER Advanced Medical Parking",
    type: "parking",
    parkingType: "covered",
    location: { lat: 30.7656, lng: 76.7765 },
    address: "Sector 12, Near Emergency Block",
    city: "Chandigarh",
    state: "Chandigarh (UT)",
    district: "Chandigarh",
    totalSlots: 160,
    freeSlots: 5,
    pricing: { perHour: 15, perDay: 120 },
    amenities: ["CCTV", "24x7", "disabled-access", "restroom", "security"],
    rating: 4.2,
    reviewCount: 680,
    openingHours: "24/7",
    gradient: "from-amber-600/30 via-orange-700/20 to-neutral-900",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "park_panjab_univ_stu_c",
    name: "Panjab University Student Centre Bay",
    type: "parking",
    parkingType: "open",
    location: { lat: 30.7594, lng: 76.7684 },
    address: "Sector 14, Campus Inner Loop",
    city: "Chandigarh",
    state: "Chandigarh (UT)",
    district: "Chandigarh",
    totalSlots: 60,
    freeSlots: 22,
    pricing: { perHour: 10, perDay: 80 },
    amenities: ["CCTV", "security"],
    rating: 4.5,
    reviewCount: 290,
    openingHours: "07:00 AM - 10:00 PM",
    gradient: "from-orange-500/30 via-amber-600/20 to-neutral-900",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "park_sukhna_lake_north",
    name: "Sukhna Lake Promenade North Parking",
    type: "parking",
    parkingType: "open",
    location: { lat: 30.7422, lng: 76.8181 },
    address: "Uttar Marg, Near Lake Club",
    city: "Chandigarh",
    state: "Chandigarh (UT)",
    district: "Chandigarh",
    totalSlots: 150,
    freeSlots: 62,
    pricing: { perHour: 25, perDay: 200 },
    amenities: ["CCTV", "cafe", "restroom", "security"],
    rating: 4.6,
    reviewCount: 920,
    openingHours: "05:00 AM - 11:00 PM",
    gradient: "from-amber-600/30 via-orange-600/20 to-neutral-900",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "park_sec8_inner_market",
    name: "Sector 8 Inner Market Premium Lot",
    type: "parking",
    parkingType: "open",
    location: { lat: 30.7385, lng: 76.7944 },
    address: "Madhya Marg, Sector 8-C",
    city: "Chandigarh",
    state: "Chandigarh (UT)",
    district: "Chandigarh",
    totalSlots: 50,
    freeSlots: 12,
    pricing: { perHour: 40, perDay: 300 },
    amenities: ["CCTV", "valet", "security"],
    rating: 4.7,
    reviewCount: 180,
    openingHours: "10:00 AM - 11:00 PM",
    gradient: "from-orange-600/30 via-amber-700/20 to-neutral-900",
    updatedAt: new Date().toISOString(),
  },
];

// 15 realistic EV Charging Stations around Chandigarh
const SEED_EV_STATIONS: Spot[] = [
  {
    id: "ev_sec17_supercharge",
    name: "Sector 17 Plaza DC Fast Superhub",
    type: "ev",
    parkingType: "underground",
    location: { lat: 30.7382, lng: 76.7841 },
    address: "Bank Square, Sector 17-B",
    city: "Chandigarh",
    state: "Chandigarh (UT)",
    district: "Chandigarh",
    totalSlots: 8,
    freeSlots: 4,
    pricing: { perHour: 0, perKwh: 18, idleFeePerMin: 2 },
    amenities: ["CCTV", "24x7", "cafe", "restroom", "security"],
    rating: 4.9,
    reviewCount: 410,
    openingHours: "24/7",
    gradient: "from-cyan-600/30 via-blue-600/20 to-neutral-900",
    updatedAt: new Date().toISOString(),
    chargers: [
      { id: "c1", type: "CCS2", powerKw: 150, status: "available", pricePerKwh: 20, speed: "ultra-fast" },
      { id: "c2", type: "CCS2", powerKw: 150, status: "occupied", pricePerKwh: 20, speed: "ultra-fast" },
      { id: "c3", type: "CCS2", powerKw: 60, status: "available", pricePerKwh: 18, speed: "fast" },
      { id: "c4", type: "Type 2", powerKw: 22, status: "available", pricePerKwh: 15, speed: "slow" },
      { id: "c5", type: "Type 2", powerKw: 22, status: "occupied", pricePerKwh: 15, speed: "slow" },
      { id: "c6", type: "CHAdeMO", powerKw: 50, status: "available", pricePerKwh: 18, speed: "fast" },
      { id: "c7", type: "GB/T", powerKw: 30, status: "offline", pricePerKwh: 16, speed: "fast" },
      { id: "c8", type: "CCS2", powerKw: 60, status: "available", pricePerKwh: 18, speed: "fast" },
    ],
  },
  {
    id: "ev_elante_superhub",
    name: "Elante Mall HyperCharge Station",
    type: "ev",
    parkingType: "underground",
    location: { lat: 30.7061, lng: 76.8021 },
    address: "Basement Level 1, Industrial Area Phase 1",
    city: "Chandigarh",
    state: "Chandigarh (UT)",
    district: "Chandigarh",
    totalSlots: 10,
    freeSlots: 5,
    pricing: { perHour: 0, perKwh: 21, idleFeePerMin: 3 },
    amenities: ["CCTV", "24x7", "cafe", "restroom", "valet", "security"],
    rating: 4.9,
    reviewCount: 780,
    openingHours: "24/7",
    gradient: "from-blue-600/30 via-cyan-600/20 to-neutral-900",
    updatedAt: new Date().toISOString(),
    chargers: [
      { id: "ec1", type: "CCS2", powerKw: 180, status: "available", pricePerKwh: 22, speed: "ultra-fast" },
      { id: "ec2", type: "CCS2", powerKw: 180, status: "occupied", pricePerKwh: 22, speed: "ultra-fast" },
      { id: "ec3", type: "CCS2", powerKw: 120, status: "available", pricePerKwh: 21, speed: "ultra-fast" },
      { id: "ec4", type: "CCS2", powerKw: 120, status: "occupied", pricePerKwh: 21, speed: "ultra-fast" },
      { id: "ec5", type: "Type 2", powerKw: 22, status: "available", pricePerKwh: 16, speed: "slow" },
      { id: "ec6", type: "Type 2", powerKw: 22, status: "available", pricePerKwh: 16, speed: "slow" },
      { id: "ec7", type: "CHAdeMO", powerKw: 60, status: "available", pricePerKwh: 19, speed: "fast" },
      { id: "ec8", type: "GB/T", powerKw: 40, status: "occupied", pricePerKwh: 17, speed: "fast" },
    ],
  },
  {
    id: "ev_itpark_infotech",
    name: "IT Park GreenGrid EV Depot",
    type: "ev",
    parkingType: "covered",
    location: { lat: 30.7248, lng: 76.8392 },
    address: "Near Infosys Gate 2, Tech Park",
    city: "Chandigarh",
    state: "Chandigarh (UT)",
    district: "Chandigarh",
    totalSlots: 6,
    freeSlots: 3,
    pricing: { perHour: 0, perKwh: 17, idleFeePerMin: 1.5 },
    amenities: ["CCTV", "24x7", "cafe", "restroom", "security"],
    rating: 4.7,
    reviewCount: 230,
    openingHours: "24/7",
    gradient: "from-cyan-500/30 via-blue-500/20 to-neutral-900",
    updatedAt: new Date().toISOString(),
    chargers: [
      { id: "it1", type: "CCS2", powerKw: 60, status: "available", pricePerKwh: 17, speed: "fast" },
      { id: "it2", type: "CCS2", powerKw: 60, status: "occupied", pricePerKwh: 17, speed: "fast" },
      { id: "it3", type: "Type 2", powerKw: 22, status: "available", pricePerKwh: 14, speed: "slow" },
      { id: "it4", type: "Type 2", powerKw: 22, status: "available", pricePerKwh: 14, speed: "slow" },
      { id: "it5", type: "CHAdeMO", powerKw: 50, status: "occupied", pricePerKwh: 17, speed: "fast" },
      { id: "it6", type: "GB/T", powerKw: 30, status: "available", pricePerKwh: 15, speed: "fast" },
    ],
  },
  {
    id: "ev_sec35_fastcharge",
    name: "Sector 35-B PowerPoint EV Stop",
    type: "ev",
    parkingType: "open",
    location: { lat: 30.7245, lng: 76.7658 },
    address: "SCO 220, Behind Fast Food Lane",
    city: "Chandigarh",
    state: "Chandigarh (UT)",
    district: "Chandigarh",
    totalSlots: 4,
    freeSlots: 1,
    pricing: { perHour: 0, perKwh: 19, idleFeePerMin: 2 },
    amenities: ["CCTV", "24x7", "security"],
    rating: 4.6,
    reviewCount: 160,
    openingHours: "24/7",
    gradient: "from-blue-600/30 via-cyan-700/20 to-neutral-900",
    updatedAt: new Date().toISOString(),
    chargers: [
      { id: "s35_1", type: "CCS2", powerKw: 120, status: "occupied", pricePerKwh: 20, speed: "ultra-fast" },
      { id: "s35_2", type: "CCS2", powerKw: 60, status: "occupied", pricePerKwh: 19, speed: "fast" },
      { id: "s35_3", type: "Type 2", powerKw: 22, status: "available", pricePerKwh: 15, speed: "slow" },
      { id: "s35_4", type: "CHAdeMO", powerKw: 50, status: "occupied", pricePerKwh: 18, speed: "fast" },
    ],
  },
  {
    id: "ev_sec43_bus_ev",
    name: "ISBT 43 Transit EV Charging Hub",
    type: "ev",
    parkingType: "covered",
    location: { lat: 30.7195, lng: 76.7455 },
    address: "Entry Gate 3, ISBT 43 Complex",
    city: "Chandigarh",
    state: "Chandigarh (UT)",
    district: "Chandigarh",
    totalSlots: 6,
    freeSlots: 4,
    pricing: { perHour: 0, perKwh: 16, idleFeePerMin: 1 },
    amenities: ["CCTV", "24x7", "restroom", "disabled-access", "security"],
    rating: 4.5,
    reviewCount: 310,
    openingHours: "24/7",
    gradient: "from-cyan-600/30 via-teal-600/20 to-neutral-900",
    updatedAt: new Date().toISOString(),
    chargers: [
      { id: "b43_1", type: "CCS2", powerKw: 120, status: "available", pricePerKwh: 17, speed: "ultra-fast" },
      { id: "b43_2", type: "CCS2", powerKw: 60, status: "available", pricePerKwh: 16, speed: "fast" },
      { id: "b43_3", type: "Type 2", powerKw: 22, status: "available", pricePerKwh: 13, speed: "slow" },
      { id: "b43_4", type: "Type 2", powerKw: 22, status: "available", pricePerKwh: 13, speed: "slow" },
      { id: "b43_5", type: "GB/T", powerKw: 40, status: "occupied", pricePerKwh: 15, speed: "fast" },
      { id: "b43_6", type: "CHAdeMO", powerKw: 50, status: "occupied", pricePerKwh: 16, speed: "fast" },
    ],
  },
];

// Helper to construct realistic 30+ seed bookings
function generateSeedBookings(): Reservation[] {
  const now = new Date();
  const bookings: Reservation[] = [
    // 1. ACTIVE BOOKING for Rahul Verma (customer@demo.com)
    {
      id: "res_active_rahul_01",
      userId: "user_customer_01",
      customerName: "Rahul Verma",
      customerPhone: "+91 98765 43210",
      customerEmail: "customer@demo.com",
      spotId: "ev_sec17_supercharge",
      spotName: "Sector 17 Plaza DC Fast Superhub",
      spotType: "ev",
      spotAddress: "Bank Square, Sector 17-B, Chandigarh",
      slotId: "EV-BAY-C1",
      chargerId: "c1",
      startTime: new Date(now.getTime() - 35 * 60000).toISOString(),
      endTime: new Date(now.getTime() + 85 * 60000).toISOString(),
      durationHours: 2,
      status: "active",
      gateState: "charging",
      checkedInAt: new Date(now.getTime() - 32 * 60000).toISOString(),
      chargingSession: {
        isCharging: true,
        kwhDelivered: 28.4,
        runningCost: 568,
        startedAt: new Date(now.getTime() - 30 * 60000).toISOString(),
        targetKwh: 45,
      },
      vehicle: {
        plateNumber: "CH01-AB-1234",
        vehicleType: "Car",
        modelName: "Tata Nexon EV Max",
        connectorType: "CCS2",
      },
      pricing: {
        baseAmount: 900,
        taxes: 162,
        serviceFee: 25,
        peakMultiplier: 1.0,
        totalAmount: 1087,
      },
      paymentMethod: "wallet",
      paymentId: "txn_wlt_991823",
      qrCodeValue: "SPARK_QR_DEMO_TOKEN_ACTIVE_01",
      createdAt: new Date(now.getTime() - 60 * 60000).toISOString(),
    },
    // 2. UPCOMING BOOKING for Rahul Verma
    {
      id: "res_up_rahul_02",
      userId: "user_customer_01",
      customerName: "Rahul Verma",
      customerPhone: "+91 98765 43210",
      customerEmail: "customer@demo.com",
      spotId: "park_elante_basement",
      spotName: "Elante Mall P1 & P2 Express",
      spotType: "parking",
      spotAddress: "Phase 1, Industrial Area, Chandigarh",
      slotId: "PARK-BAY-B12",
      startTime: new Date(now.getTime() + 180 * 60000).toISOString(),
      endTime: new Date(now.getTime() + 360 * 60000).toISOString(),
      durationHours: 3,
      status: "upcoming",
      gateState: "reserved",
      vehicle: {
        plateNumber: "CH01-AB-1234",
        vehicleType: "Car",
        modelName: "Tata Nexon EV Max",
      },
      pricing: {
        baseAmount: 150,
        taxes: 27,
        serviceFee: 20,
        peakMultiplier: 1.2,
        totalAmount: 197,
      },
      paymentMethod: "card",
      paymentId: "txn_crd_441290",
      qrCodeValue: "SPARK_QR_DEMO_TOKEN_UPCOMING_02",
      createdAt: new Date(now.getTime() - 200 * 60000).toISOString(),
    },
    // 3. COMPLETED BOOKING for Rahul Verma
    {
      id: "res_past_rahul_03",
      userId: "user_customer_01",
      customerName: "Rahul Verma",
      customerPhone: "+91 98765 43210",
      customerEmail: "customer@demo.com",
      spotId: "park_sec17_multilevel",
      spotName: "Sector 17 Multi-Level Plaza",
      spotType: "parking",
      spotAddress: "Near Neelam Theatre, Sector 17-B",
      slotId: "PARK-LVL2-44",
      startTime: new Date(now.getTime() - 24 * 3600000).toISOString(),
      endTime: new Date(now.getTime() - 20 * 3600000).toISOString(),
      durationHours: 4,
      status: "completed",
      gateState: "completed",
      checkedInAt: new Date(now.getTime() - 24 * 3600000 + 5 * 60000).toISOString(),
      checkedOutAt: new Date(now.getTime() - 20 * 3600000 - 3 * 60000).toISOString(),
      vehicle: {
        plateNumber: "CH01-BK-9988",
        vehicleType: "SUV",
        modelName: "Hyundai Creta",
      },
      pricing: {
        baseAmount: 120,
        taxes: 21.6,
        serviceFee: 15,
        peakMultiplier: 1.0,
        totalAmount: 156.6,
      },
      paymentMethod: "upi",
      paymentId: "txn_upi_887122",
      qrCodeValue: "SPARK_QR_DEMO_TOKEN_PAST_03",
      createdAt: new Date(now.getTime() - 30 * 3600000).toISOString(),
    },
    // 4. CANCELLED BOOKING for Rahul Verma (refunded)
    {
      id: "res_canc_rahul_04",
      userId: "user_customer_01",
      customerName: "Rahul Verma",
      customerPhone: "+91 98765 43210",
      customerEmail: "customer@demo.com",
      spotId: "park_sec35_market",
      spotName: "Sector 35-C Gourmet Plaza Parking",
      spotType: "parking",
      spotAddress: "SCO 401-402, Inner Ring Road",
      slotId: "PARK-BAY-09",
      startTime: new Date(now.getTime() - 48 * 3600000).toISOString(),
      endTime: new Date(now.getTime() - 46 * 3600000).toISOString(),
      durationHours: 2,
      status: "cancelled",
      gateState: "cancelled",
      cancelledAt: new Date(now.getTime() - 50 * 3600000).toISOString(),
      refundAmount: 55,
      vehicle: {
        plateNumber: "CH01-AB-1234",
        vehicleType: "Car",
      },
      pricing: {
        baseAmount: 40,
        taxes: 7.2,
        serviceFee: 10,
        peakMultiplier: 1.0,
        totalAmount: 57.2,
      },
      paymentMethod: "wallet",
      paymentId: "txn_wlt_771239",
      qrCodeValue: "SPARK_QR_DEMO_TOKEN_CANC_04",
      createdAt: new Date(now.getTime() - 55 * 3600000).toISOString(),
    },
  ];

  // 26 additional varied bookings for customers 02 through 08 across Chandigarh
  const otherUsers = [
    { id: "user_customer_02", name: "Simran Kaur", email: "simran.k@example.com", phone: "+91 98123 45678", plate: "PB65-CC-4545", connector: "CCS2" as const },
    { id: "user_customer_03", name: "Amanpreet Singh", email: "aman.singh@example.com", phone: "+91 98777 11223", plate: "HR03-X-8800", connector: "CCS2" as const },
    { id: "user_customer_04", name: "Neha Gupta", email: "neha.gupta@example.com", phone: "+91 98222 33445", plate: "CH01-BZ-0007", connector: "CCS2" as const },
    { id: "user_customer_05", name: "Vikram Malhotra", email: "vikram.m@example.com", phone: "+91 98333 44556", plate: "DL08-CA-1122", connector: undefined },
    { id: "user_customer_06", name: "Ananya Sharma", email: "ananya.s@example.com", phone: "+91 98444 55667", plate: "PB02-AP-9999", connector: "CCS2" as const },
    { id: "user_customer_07", name: "Karan Johar", email: "karan.j@example.com", phone: "+91 98555 66778", plate: "CH04-D-4321", connector: "Type 2" as const },
    { id: "user_customer_08", name: "Pooja Mehta", email: "pooja.mehta@example.com", phone: "+91 98666 77889", plate: "HP12-E-1010", connector: "CCS2" as const },
  ];

  const spotOptions = [
    { id: "park_sec17_multilevel", name: "Sector 17 Multi-Level Plaza", type: "parking" as const, address: "Sector 17-B" },
    { id: "ev_sec17_supercharge", name: "Sector 17 Plaza DC Fast Superhub", type: "ev" as const, address: "Sector 17-B" },
    { id: "park_elante_basement", name: "Elante Mall P1 & P2 Express", type: "parking" as const, address: "Industrial Area Phase 1" },
    { id: "ev_elante_superhub", name: "Elante Mall HyperCharge Station", type: "ev" as const, address: "Industrial Area Phase 1" },
    { id: "park_sec35_market", name: "Sector 35-C Gourmet Plaza Parking", type: "parking" as const, address: "Sector 35-C" },
    { id: "ev_sec35_fastcharge", name: "Sector 35-B PowerPoint EV Stop", type: "ev" as const, address: "Sector 35-B" },
    { id: "park_it_park_tech", name: "Rajiv Gandhi IT Park Tech Hub Parking", type: "parking" as const, address: "IT Park" },
    { id: "ev_itpark_infotech", name: "IT Park GreenGrid EV Depot", type: "ev" as const, address: "IT Park" },
  ];

  const statuses: ("upcoming" | "active" | "completed" | "cancelled")[] = [
    "active", "upcoming", "completed", "completed", "completed", "cancelled", "active"
  ];

  for (let i = 0; i < 26; i++) {
    const user = otherUsers[i % otherUsers.length];
    const spot = spotOptions[i % spotOptions.length];
    const status = statuses[i % statuses.length];
    const hoursOffset = (i * 7) - 40; // Spreads across last 4 days and next 2 days
    const startTime = new Date(now.getTime() + hoursOffset * 3600000);
    const duration = 2 + (i % 3);
    const endTime = new Date(startTime.getTime() + duration * 3600000);

    const isEv = spot.type === "ev";
    const baseAmt = isEv ? 350 + (i * 25) : 60 + (i * 15);
    const taxes = Math.round(baseAmt * 0.18);
    const total = baseAmt + taxes + 20;

    let gateState: Reservation["gateState"] = "reserved";
    let checkedIn: string | undefined = undefined;
    let checkedOut: string | undefined = undefined;
    let chargingSession: Reservation["chargingSession"] = undefined;

    if (status === "active") {
      gateState = isEv ? "charging" : "checked_in";
      checkedIn = new Date(startTime.getTime() + 4 * 60000).toISOString();
      if (isEv) {
        chargingSession = {
          isCharging: true,
          kwhDelivered: 14 + (i * 2.5),
          runningCost: Math.round((14 + i * 2.5) * 19),
          startedAt: checkedIn,
          targetKwh: 35,
        };
      }
    } else if (status === "completed") {
      gateState = "completed";
      checkedIn = startTime.toISOString();
      checkedOut = endTime.toISOString();
    } else if (status === "cancelled") {
      gateState = "cancelled";
    }

    bookings.push({
      id: `res_seed_${i + 5}`,
      userId: user.id,
      customerName: user.name,
      customerPhone: user.phone,
      customerEmail: user.email,
      spotId: spot.id,
      spotName: spot.name,
      spotType: spot.type,
      spotAddress: spot.address,
      slotId: `${isEv ? "EV-BAY" : "PARK-BAY"}-${10 + i}`,
      chargerId: isEv ? `c_${i % 4}` : undefined,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      durationHours: duration,
      status,
      gateState,
      checkedInAt: checkedIn,
      checkedOutAt: checkedOut,
      chargingSession,
      vehicle: {
        plateNumber: user.plate,
        vehicleType: "Car",
        modelName: isEv ? "EV Cruiser" : "Sedan",
        connectorType: user.connector,
      },
      pricing: {
        baseAmount: baseAmt,
        taxes,
        serviceFee: 20,
        peakMultiplier: 1.0,
        totalAmount: total,
      },
      paymentMethod: i % 3 === 0 ? "wallet" : i % 3 === 1 ? "upi" : "card",
      paymentId: `txn_seed_${1000 + i}`,
      qrCodeValue: `SPARK_QR_SEED_${i + 5}`,
      createdAt: new Date(startTime.getTime() - 12 * 3600000).toISOString(),
    });
  }

  return bookings;
}

// Initial mock wallets
function generateInitialWallets(): Record<string, UserWallet> {
  const wallets: Record<string, UserWallet> = {
    user_customer_01: {
      userId: "user_customer_01",
      balance: 1250,
      transactions: [
        {
          id: "txn_wlt_01",
          type: "topup",
          amount: 2000,
          description: "UPI Top-up via PhonePe",
          timestamp: new Date(Date.now() - 72 * 3600000).toISOString(),
        },
        {
          id: "txn_wlt_02",
          type: "payment",
          amount: 568,
          description: "Sector 17 Superhub EV Charging",
          timestamp: new Date(Date.now() - 35 * 60000).toISOString(),
          referenceId: "res_active_rahul_01",
        },
        {
          id: "txn_wlt_03",
          type: "refund",
          amount: 55,
          description: "Cancellation Refund - Sector 35-C",
          timestamp: new Date(Date.now() - 50 * 3600000).toISOString(),
          referenceId: "res_canc_rahul_04",
        },
      ],
    },
  };
  return wallets;
}

// Initial gate events
function generateInitialGateEvents(): GateEvent[] {
  const now = Date.now();
  return [
    {
      id: "ge_01",
      spotId: "ev_sec17_supercharge",
      spotName: "Sector 17 Plaza DC Fast Superhub",
      gateType: "entry",
      plateNumber: "CH01-AB-1234",
      decision: "OPEN",
      reason: "Valid signed QR pass verified. Leeway 15m window satisfied.",
      timestamp: new Date(now - 32 * 60000).toISOString(),
      reservationId: "res_active_rahul_01",
    },
    {
      id: "ge_02",
      spotId: "park_sec17_multilevel",
      spotName: "Sector 17 Multi-Level Plaza",
      gateType: "entry",
      plateNumber: "PB65-CC-4545",
      decision: "OPEN",
      reason: "Valid signed pass. Slot assigned PARK-BAY-12.",
      timestamp: new Date(now - 14 * 60000).toISOString(),
    },
    {
      id: "ge_03",
      spotId: "park_elante_basement",
      spotName: "Elante Mall P1 & P2 Express",
      gateType: "entry",
      plateNumber: "DL04-TA-9900",
      decision: "DENIED",
      reason: "Expired booking pass. Valid until 14:00.",
      timestamp: new Date(now - 8 * 60000).toISOString(),
    },
  ];
}

// Initial audit logs
function generateInitialAuditLogs(): AuditLogEntry[] {
  const now = Date.now();
  return [
    {
      id: "aud_01",
      action: "MANUAL_BARRIER_OVERRIDE",
      actorId: "user_operator_01",
      actorName: "Priya Sharma (Chief Municipal Operator)",
      actorRole: "operator",
      targetId: "ev_sec17_supercharge",
      details: "Emergency gate release during morning inspection.",
      timestamp: new Date(now - 120 * 60000).toISOString(),
    },
    {
      id: "aud_02",
      action: "WALLET_CREDIT_GRANT",
      actorId: "user_operator_01",
      actorName: "Priya Sharma (Chief Municipal Operator)",
      actorRole: "operator",
      targetId: "user_customer_01",
      details: "Granted ₹250 courtesy credit for charger firmware reboot.",
      timestamp: new Date(now - 180 * 60000).toISOString(),
    },
  ];
}

/**
 * Initializes the unified MockDatabase singleton on NodeJS globalThis
 */
export function getMockDb(): MockDatabase {
  if (!globalThis.__mockDb) {
    globalThis.__mockDb = {
      spots: [...SEED_PARKING_LOTS, ...SEED_EV_STATIONS],
      reservations: generateSeedBookings(),
      wallets: generateInitialWallets(),
      gateEvents: generateInitialGateEvents(),
      auditLogs: generateInitialAuditLogs(),
      hasSeeded: true,
    };
  }
  return globalThis.__mockDb;
}

// ============================================
// SPOTS DATABASE QUERIES & MUTATIONS
// ============================================

export function getAllSpots(): Spot[] {
  const db = getMockDb();
  return db.spots;
}

export function getSpotById(id: string): Spot | null {
  const db = getMockDb();
  return db.spots.find((s) => s.id === id) || null;
}

export function updateSpotCapacity(
  id: string,
  deltaFreeSlots: number
): Spot | null {
  const db = getMockDb();
  const spot = db.spots.find((s) => s.id === id);
  if (!spot) return null;

  spot.freeSlots = Math.max(0, Math.min(spot.totalSlots, spot.freeSlots + deltaFreeSlots));
  spot.updatedAt = new Date().toISOString();
  return spot;
}

export function updateSpotPrice(
  id: string,
  perHour: number,
  perKwh?: number
): Spot | null {
  const db = getMockDb();
  const spot = db.spots.find((s) => s.id === id);
  if (!spot) return null;

  spot.pricing.perHour = perHour;
  if (perKwh !== undefined && spot.pricing.perKwh !== undefined) {
    spot.pricing.perKwh = perKwh;
  }
  spot.updatedAt = new Date().toISOString();
  return spot;
}

export function toggleSpotMaintenance(
  id: string,
  isMaintenance: boolean
): Spot | null {
  const db = getMockDb();
  const spot = db.spots.find((s) => s.id === id);
  if (!spot) return null;

  spot.isMaintenanceMode = isMaintenance;
  spot.updatedAt = new Date().toISOString();
  return spot;
}

export function toggleChargerStatus(
  spotId: string,
  chargerId: string,
  status: "available" | "occupied" | "offline"
): Spot | null {
  const db = getMockDb();
  const spot = db.spots.find((s) => s.id === spotId);
  if (!spot || !spot.chargers) return null;

  const charger = spot.chargers.find((c) => c.id === chargerId);
  if (!charger) return null;

  charger.status = status;
  spot.freeSlots = spot.chargers.filter((c) => c.status === "available").length;
  spot.updatedAt = new Date().toISOString();
  return spot;
}

// ============================================
// RESERVATIONS DATABASE QUERIES & MUTATIONS
// ============================================

export function getReservationsByUserId(userId: string): Reservation[] {
  const db = getMockDb();
  return db.reservations
    .filter((r) => r.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getAllReservations(): Reservation[] {
  const db = getMockDb();
  return db.reservations.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getReservationById(id: string): Reservation | null {
  const db = getMockDb();
  return db.reservations.find((r) => r.id === id) || null;
}

export function createReservationRecord(res: Reservation): Reservation {
  const db = getMockDb();
  db.reservations.unshift(res);

  // Decrement spot availability
  updateSpotCapacity(res.spotId, -1);
  return res;
}

export function updateReservationRecord(
  id: string,
  updates: Partial<Reservation>
): Reservation | null {
  const db = getMockDb();
  const idx = db.reservations.findIndex((r) => r.id === id);
  if (idx === -1) return null;

  db.reservations[idx] = { ...db.reservations[idx], ...updates };
  return db.reservations[idx];
}

/**
 * WHY: Checks if the vehicle plate already has a confirmed overlapping reservation window
 */
export function checkVehicleBookingOverlap(
  plateNumber: string,
  startIso: string,
  endIso: string
): boolean {
  const db = getMockDb();
  const newStart = new Date(startIso).getTime();
  const newEnd = new Date(endIso).getTime();

  return db.reservations.some((r) => {
    if (r.status === "cancelled" || r.status === "completed") return false;
    if (r.vehicle.plateNumber.toUpperCase().replace(/\s/g, "") !== plateNumber.toUpperCase().replace(/\s/g, "")) {
      return false;
    }
    const rStart = new Date(r.startTime).getTime();
    const rEnd = new Date(r.endTime).getTime();
    // Overlap condition: max(start1, start2) < min(end1, end2)
    return Math.max(newStart, rStart) < Math.min(newEnd, rEnd);
  });
}

// ============================================
// WALLET QUERIES & MUTATIONS
// ============================================

export function getUserWalletRecord(userId: string): UserWallet {
  const db = getMockDb();
  if (!db.wallets[userId]) {
    db.wallets[userId] = {
      userId,
      balance: INITIAL_WALLET_BALANCE,
      transactions: [
        {
          id: `txn_init_${Date.now()}`,
          type: "topup",
          amount: INITIAL_WALLET_BALANCE,
          description: "Welcome credit for test pilot",
          timestamp: new Date().toISOString(),
        },
      ],
    };
  }
  return db.wallets[userId];
}

export function topUpUserWallet(
  userId: string,
  amount: number,
  description = "Wallet Top-up"
): UserWallet {
  const wallet = getUserWalletRecord(userId);
  wallet.balance += amount;
  wallet.transactions.unshift({
    id: `txn_top_${Date.now()}`,
    type: "topup",
    amount,
    description,
    timestamp: new Date().toISOString(),
  });
  return wallet;
}

export function deductUserWallet(
  userId: string,
  amount: number,
  description: string,
  referenceId?: string
): { success: boolean; error?: string; wallet?: UserWallet } {
  const wallet = getUserWalletRecord(userId);
  if (wallet.balance < amount) {
    return { success: false, error: "Insufficient wallet balance." };
  }
  wallet.balance -= amount;
  wallet.transactions.unshift({
    id: `txn_ded_${Date.now()}`,
    type: "payment",
    amount,
    description,
    timestamp: new Date().toISOString(),
    referenceId,
  });
  return { success: true, wallet };
}

export function refundUserWallet(
  userId: string,
  amount: number,
  description: string,
  referenceId?: string
): UserWallet {
  const wallet = getUserWalletRecord(userId);
  wallet.balance += amount;
  wallet.transactions.unshift({
    id: `txn_ref_${Date.now()}`,
    type: "refund",
    amount,
    description,
    timestamp: new Date().toISOString(),
    referenceId,
  });
  return wallet;
}

// ============================================
// GATE EVENTS & AUDIT LOGS
// ============================================

export function getGateEvents(): GateEvent[] {
  const db = getMockDb();
  return db.gateEvents.slice(0, 50);
}

export function addGateEvent(event: Omit<GateEvent, "id">): GateEvent {
  const db = getMockDb();
  const newEvent: GateEvent = {
    ...event,
    id: `ge_${Date.now()}`,
  };
  db.gateEvents.unshift(newEvent);
  if (db.gateEvents.length > 100) db.gateEvents.pop();
  return newEvent;
}

export function getAuditLogs(): AuditLogEntry[] {
  const db = getMockDb();
  return db.auditLogs.slice(0, 50);
}

export function addAuditLog(entry: Omit<AuditLogEntry, "id" | "timestamp">): AuditLogEntry {
  const db = getMockDb();
  const log: AuditLogEntry = {
    ...entry,
    id: `aud_${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
  db.auditLogs.unshift(log);
  if (db.auditLogs.length > 100) db.auditLogs.pop();
  return log;
}
