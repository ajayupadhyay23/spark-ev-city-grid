/**
 * @file src/types/index.ts
 * @description Central TypeScript type definitions for SPARK.EV City Grid.
 * @purpose Single strongly-typed source of truth for frontend components,
 * Zustand stores, API handlers, mock database, and operator management.
 * @connections
 * - Used by /src/lib/db.ts, /src/lib/users.ts
 * - Used by /src/store/useAppStore.ts, /src/store/useWalletStore.ts
 * - Used by /src/app/api/... route handlers
 * - Used across UI components in /src/components/...
 */

// Available spot categories in the platform
export type SpotType = "parking" | "ev";

// Structural type of parking facility
export type ParkingType = "covered" | "open" | "underground";

// Standard EV charging connector standards supported in the city
export type ChargerType = "Type 2" | "CCS2" | "CHAdeMO" | "GB/T";

// Charging power categories for easy driver filtering
export type ChargingSpeed = "slow" | "fast" | "ultra-fast";

// Real-time status of an individual EV charging connector
export type ChargerStatus = "available" | "occupied" | "offline";

// Single EV charger connector specifications
export interface Charger {
  id: string;
  type: ChargerType;
  powerKw: number;
  status: ChargerStatus;
  pricePerKwh: number;
  speed: ChargingSpeed;
}

// Facility amenities available on premise
export type Amenity =
  | "CCTV"
  | "24x7"
  | "valet"
  | "disabled-access"
  | "restroom"
  | "cafe"
  | "security";

// Pricing structure for a parking or charging facility
export interface SpotPricing {
  perHour: number;
  perDay?: number;
  perKwh?: number;
  idleFeePerMin?: number;
}

// Coordinates representing location on map
export interface GeoLocation {
  lat: number;
  lng: number;
}

// Core record representing a parking lot or EV charging station
export interface Spot {
  id: string;
  name: string;
  type: SpotType;
  parkingType?: ParkingType;
  location: GeoLocation;
  address: string;
  city: string;
  state?: string;
  district?: string;
  totalSlots: number;
  freeSlots: number;
  pricing: SpotPricing;
  amenities: Amenity[];
  rating: number;
  reviewCount: number;
  openingHours: string;
  gradient: string;
  chargers?: Charger[];
  updatedAt: string;
  isLiveSimulated?: boolean;
  isMaintenanceMode?: boolean;
}

// Status of a driver's reservation lifecycle
export type ReservationStatus = "upcoming" | "active" | "completed" | "cancelled";

// Physical gate access state
export type GateAccessState =
  | "reserved"
  | "checked_in"
  | "charging"
  | "completed"
  | "cancelled"
  | "expired";

// Live EV Charging telemetry data
export interface LiveChargingSession {
  isCharging: boolean;
  kwhDelivered: number;
  runningCost: number;
  startedAt?: string;
  endedAt?: string;
  targetKwh?: number;
}

// Supported payment methods
export type PaymentMethod = "wallet" | "card" | "upi";

// Vehicle information attached to a booking or saved in driver profile
export interface VehicleDetails {
  id?: string;
  plateNumber: string;
  vehicleType: "Car" | "SUV" | "Two-Wheeler" | "Commercial";
  modelName?: string;
  connectorType?: ChargerType;
  isDefault?: boolean;
}

// Complete record of a driver's reservation
export interface Reservation {
  id: string;
  userId: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  spotId: string;
  spotName: string;
  spotType: SpotType;
  spotAddress: string;
  slotId?: string;
  startTime: string; // ISO 8601 string
  endTime: string; // ISO 8601 string
  durationHours: number;
  status: ReservationStatus;
  gateState?: GateAccessState;
  chargingSession?: LiveChargingSession;
  vehicle: VehicleDetails;
  chargerId?: string;
  targetKwh?: number;
  pricing: {
    baseAmount: number;
    taxes: number;
    serviceFee: number;
    peakMultiplier: number;
    totalAmount: number;
  };
  paymentMethod: PaymentMethod;
  paymentId: string;
  qrCodeValue: string;
  createdAt: string;
  checkedInAt?: string;
  checkedOutAt?: string;
  cancelledAt?: string;
  refundAmount?: number;
}

// Digital wallet transaction item
export interface WalletTransaction {
  id: string;
  type: "topup" | "payment" | "refund" | "credit_grant";
  amount: number;
  description: string;
  timestamp: string;
  referenceId?: string;
}

// User wallet account state
export interface UserWallet {
  userId: string;
  balance: number;
  transactions: WalletTransaction[];
}

// User role definition
export type UserRole = "customer" | "operator" | "gate";

// Complete user profile record for auth and operator administration
export interface UserRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: "active" | "suspended";
  createdAt: string;
  savedVehicles: VehicleDetails[];
  walletBalance: number;
  notes?: string;
  notifications?: {
    email: boolean;
    sms: boolean;
    bookingReminders: boolean;
  };
}

// Gate scan event record
export interface GateEvent {
  id: string;
  spotId: string;
  spotName: string;
  gateType: "entry" | "exit" | "charger";
  plateNumber: string;
  decision: "OPEN" | "DENIED";
  reason: string;
  timestamp: string;
  isOverride?: boolean;
  operatorName?: string;
  reservationId?: string;
}

// Audit log entry for tracking operator and gate actions
export interface AuditLogEntry {
  id: string;
  action: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  targetId?: string;
  details: string;
  timestamp: string;
}

// Active search and filtering criteria applied in the Finder view
export interface FinderFilters {
  searchQuery: string;
  type: "all" | SpotType;
  maxPrice: number;
  onlyAvailable: boolean;
  maxDistanceKm: number;
  parkingTypes: ParkingType[];
  chargerTypes: ChargerType[];
  chargingSpeeds: ChargingSpeed[];
  amenities: Amenity[];
  sortBy: "nearest" | "cheapest" | "availability";
  userCoords: GeoLocation | null;
  selectedState?: string;
  selectedDistrict?: string;
  dataSource?: "demo" | "live_osm";
}
