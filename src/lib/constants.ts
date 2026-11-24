/**
 * @file src/lib/constants.ts
 * @description Centralized application constants, default configuration values, and business rules.
 * @purpose Avoid hardcoding magic numbers or string literals across multiple components and API routes.
 * Having them here guarantees single-point adjustments for pricing, geolocation defaults, and partner logos.
 * @connections
 * - Used by /src/lib/db.ts to seed spots with city coordinates
 * - Used by /src/lib/pricing.ts for peak hour definitions and tax rates
 * - Used by /src/components/landing/... for marquee and FAQ content
 * - Used by /src/store/useAppStore.ts for initial filter values
 */

import { Amenity, ChargerType, ChargingSpeed, FinderFilters, GeoLocation, ParkingType } from "@/types";

// Default city center: Chandigarh, India (Sector 17 City Center)
// Provides a coherent, authentic set of geocoordinates with dense urban sectors
export const CITY_CENTER_COORDS: GeoLocation = {
  lat: 30.7333,
  lng: 76.7794,
};

export const CITY_NAME = "Chandigarh";

// Default simulated logged-in user identifier for demo session
export const DEFAULT_USER_ID = "driver_demo_77";

// Initial starting balance for simulated digital wallet (₹)
export const INITIAL_WALLET_BALANCE = 500;

// Tax & Fee Rates
export const GST_TAX_RATE = 0.18; // 18% standard Indian Goods & Services Tax
export const PLATFORM_SERVICE_FEE = 15; // ₹15 flat booking convenience fee

// Peak Hour Definitions: Morning rush (09:00 - 11:59) and Evening rush (17:00 - 20:59)
// During peak hours, a 1.25x dynamic multiplier is applied to incentivize off-peak parking
export const PEAK_HOURS = [
  { start: 9, end: 12 },
  { start: 17, end: 21 },
];
export const PEAK_HOUR_MULTIPLIER = 1.25;

// Cancellation Rule: Full refund if cancelled more than 60 minutes before booking start time
export const FULL_REFUND_THRESHOLD_MINUTES = 60;

// All supported parking structure categories
export const ALL_PARKING_TYPES: ParkingType[] = ["covered", "open", "underground"];

// All supported EV connector standard options
export const ALL_CHARGER_TYPES: ChargerType[] = ["Type 2", "CCS2", "CHAdeMO", "GB/T"];

// All EV charging speed tiers
export const ALL_CHARGING_SPEEDS: ChargingSpeed[] = ["slow", "fast", "ultra-fast"];

// All available on-site amenity tags
export const ALL_AMENITIES: Amenity[] = [
  "CCTV",
  "24x7",
  "valet",
  "disabled-access",
  "restroom",
  "cafe",
  "security",
];

// Default initial filter configuration for the finder screen
export const DEFAULT_FILTERS: FinderFilters = {
  searchQuery: "",
  type: "all",
  maxPrice: 300,
  onlyAvailable: false,
  maxDistanceKm: 25,
  parkingTypes: [],
  chargerTypes: [],
  chargingSpeeds: [],
  amenities: [],
  sortBy: "nearest",
  userCoords: CITY_CENTER_COORDS,
};

// Fictional and realistic partner networks for the infinite marquee
export const PARTNER_NETWORKS = [
  { name: "CHANDIGARH SMART CITY", font: "font-sans tracking-widest font-black" },
  { name: "AURA CHARGE", font: "font-serif italic font-semibold" },
  { name: "VOLTPOINT NATION", font: "font-blackletter text-xl" },
  { name: "P-SECURE HUBS", font: "font-mono font-bold tracking-tight" },
  { name: "NEXUS EV GRID", font: "font-sans font-light tracking-widest uppercase" },
  { name: "METRO PARKWAY", font: "font-serif font-normal" },
  { name: "TATA POWER EZ", font: "font-sans font-extrabold" },
  { name: "ZEON CHARGING", font: "font-mono font-semibold" },
];

// FAQ items for the landing page accordion
export const FAQ_ITEMS = [
  {
    question: "How is slot and charger availability updated in real time?",
    answer:
      "Our system integrates directly with IoT ultrasonic bay sensors and smart OCPP 2.0.1 EV charger protocols. Live status feeds stream slot occupancy every 5 seconds, giving you guaranteed accuracy before you arrive.",
  },
  {
    question: "Can I cancel my reservation and get an instant refund?",
    answer:
      "Yes. Cancellations requested more than 1 hour before your booked start time receive a 100% full instant refund directly to your in-app wallet. Cancellations within 1 hour forfeit only the platform service fee.",
  },
  {
    question: "Which EV connector types and vehicle models are supported?",
    answer:
      "We support all major global and Indian EV standards: CCS2 (Tata, Mahindra, Hyundai, MG, BYD), Type 2 AC (all 2W, 3W, and 4W AC onboard chargers), CHAdeMO (Nissan, legacy imports), and GB/T (commercial fleets).",
  },
  {
    question: "Is digital payment safe and does it charge real money in this demo?",
    answer:
      "This application is in Demo Mode. All payments (UPI, Card, Digital Wallet) are simulated and never charge actual funds. Card validation follows the standard Luhn algorithm for authentic testing.",
  },
  {
    question: "What happens if a reserved spot is occupied when I arrive?",
    answer:
      "Every reserved spot is physically protected by an automated motorized bollard or ground sensor. Your confirmation QR code triggers barrier release upon scanning at the entry gate.",
  },
];
