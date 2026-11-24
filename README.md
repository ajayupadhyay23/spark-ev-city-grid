# SPARK.EV City Grid: Smart Parking & EV Charging Platform

A production-grade, city-wide intelligent parking and electric vehicle charging platform built for municipal metropolitan networks. Features real-time IoT slot availability feeds, dynamic peak surge pricing, multi-protocol EV charger matching (CCS2, Type 2, CHAdeMO, GB/T), turn-by-turn route navigation on OpenStreetMap, multi-step reservation wizards with cryptographically signed barrier QR passes, simulated digital payments, hardware barrier relays, and an interactive gate scanning terminal.

Designed with a high-contrast **"Cinematic Dark Glass"** aesthetic with rust/terracotta (`#C2603F`) accents, electric blue (`#00D2FF`) for EV charging, and warm orange (`#FF7A00`) for parking, fully unified with seamless Light/Dark mode transitions via CSS variables and `next-themes`.

---

## 1. Quick Start

### Prerequisites
- Node.js 18+ (tested on Node 20+)
- npm or yarn or pnpm

### Installation & Run

```bash
# 1. Install dependencies
npm install

# 2. Setup environment (defaults work out of the box with zero external keys required)
cp .env.example .env.local

# 3. Start development server
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 2. Seed Accounts & Security Roles

The application includes built-in role-based access control with 1-click instant fill on the `/login` screen:

| Role | Email | Password | Permissions & Entry Point |
| :--- | :--- | :--- | :--- |
| **Customer** | `customer@demo.com` | `demo123` | Search bays/chargers, book slots, digital payments, manage wallet, view active QR passes (`/finder`, `/bookings`). |
| **Operator** | `operator@demo.com` | `demo123` | Full municipal control suite (`/operator`), live SSE telemetry stream, override bay availability, inspect utilization & financial charts. |
| **Gate Officer** | `gate@demo.com` | `demo123` | Real-time barrier terminal (`/gate`), scan driver QR tokens, trigger manual barrier relays, and enforce anti-passback rules. |

---

## 3. Key Architecture & Features

### A. Finder Page Layout (`/finder`)
- **Desktop (>=1024px)**: 3-zone layout utilizing full viewport width:
  - **Left (300px)**: Sticky filter sidebar with independent vertical scrolling.
  - **Middle (440px)**: Scrollable list of parking & EV charging stations.
  - **Right (Flex-1)**: Sticky interactive OpenStreetMap filling the remaining width and 100vh height.
- **Tablet (768px - 1023px)**: Slide-over drawer for filters with split list and map.
- **Mobile (<768px)**: Interactive map on top with a smooth Framer Motion draggable bottom-sheet for result cards.
- **Two-Way Sync**: Selecting a card highlights and smoothly pans the map marker; selecting a map marker scrolls the corresponding card into view (`scrollIntoView`).
- **Active Filter Chips**: Removable chips showing active criteria with a 1-click "Clear all" button.

### B. India-Wide Locations & Live Overpass OSM Provider
- **Cascading State -> District Selector**: Includes all 28 Indian States and 8 Union Territories with 700+ authentic districts (`src/data/india-locations.json`).
- **Live Overpass OSM Grid**: Toggle between curated Demo Hubs and live OpenStreetMap Overpass API queries (`amenity=parking` and `amenity=charging_station`) geocoded via Nominatim.
- **Pluggable Provider Architecture (`src/lib/places/`)**:
  - `osm-provider.ts`: Free Overpass query with polygon bounding boxes.
  - `google-provider.ts`: Google Places API (New) implementation stub.
  - `index.ts`: In-memory 6-hour caching layer preventing upstream query spam.

### C. Cryptographic QR Access & Gate Flow
- **Signed JWT Tokens (`src/lib/qr-token.ts`)**: Built using `jose` HS256 signing with secret key `QR_SECRET`. Tokens embed `reservationId`, `spotId`, `slotId`, `plateNumber`, `validFrom`, `validUntil`, and single-use anti-passback `nonce`.
- **Validation Rules**:
  - ±15 minute leeway window before reservation start.
  - Single-use anti-passback state machine: `reserved` ➔ `checked_in` ➔ `charging` ➔ `completed`.
- **Gate Access Terminal (`/gate`)**:
  - Live webcam scanner (supporting `@yudiel/react-qr-scanner` and manual payload input).
  - Physical barrier arm animation with real-time audio chime feedback.
  - SSE real-time broadcast stream (`/api/gate/events`) updating all connected operator consoles.
  - Hardware adapter stub (`src/lib/gate-adapter.ts`) for relay microcontrollers or OCPP 1.6/2.0.1 Central Systems.

### D. Zero-Flash Light / Dark Theme
- Powered by `next-themes` and semantic CSS variables in `globals.css`:
  - `--bg`, `--surface`, `--surface-2`, `--border`, `--text`, `--muted`, `--accent`, `--glow-blue`, `--glow-orange`.
- Mapped to Tailwind utility classes (`bg-bg`, `bg-surface`, `text-text`, `border-border`).
- Adaptive Leaflet tiles (clean cartographic light tiles in Light mode, inverted high-contrast tiles in Dark mode).
- Theme-adaptive starfield: twinkling canvas stars in dark mode, soft pastel radiant vignette in light mode.

---

## 4. Production Database & Gateway Migration Guide

### Migrating from In-Memory Mock to PostgreSQL + Prisma
1. Install Prisma and client:
   ```bash
   npm install @prisma/client
   npm install -D prisma
   npx prisma init
   ```
2. Define models in `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }

   generator client {
     provider = "prisma-client-js"
   }

   model User {
     id           String        @id @default(uuid())
     email        String        @unique
     name         String
     passwordHash String
     role         String        @default("customer")
     reservations Reservation[]
   }

   model Spot {
     id              String   @id
     name            String
     type            String
     lat             Float
     lng             Float
     totalSlots      Int
     availableSlots  Int
     pricePerHour    Float
     reservations    Reservation[]
   }

   model Reservation {
     id            String   @id @default(uuid())
     userId        String
     user          User     @relation(fields: [userId], references: [id])
     spotId        String
     spot          Spot     @relation(fields: [spotId], references: [id])
     gateState     String   @default("reserved")
     plateNumber   String
     startTime     DateTime
     endTime       DateTime
     totalAmount   Float
     qrToken       String?
   }
   ```
3. Replace helper calls in `src/lib/db.ts` and `src/lib/users.ts` with standard `prisma.user.findUnique()` and `prisma.reservation.create()`.

### Migrating from Simulated Payments to Stripe / Razorpay
1. Install payment SDK:
   ```bash
   npm install razorpay # For India UPI/Netbanking OR
   npm install stripe   # For Global Cards
   ```
2. Update `/src/app/api/payments/route.ts`:
   - Initialize order via `razorpay.orders.create({ amount: amountInPaise, currency: "INR" })` or `stripe.paymentIntents.create()`.
   - Return `orderId` or `clientSecret` to frontend.
   - Verify webhook signature in `/api/payments/webhook` before confirming reservation status.

---

## 5. Verification Checklist

- [x] **Finder Layout**: 3 zones on desktop (Filters 300px, Results 440px, Map remaining), 2-way sync between cards and markers, active filter chips with remove and clear-all.
- [x] **Navbar**: `whitespace-nowrap` on all links, role-aware links (Operator View visible only to `operator`), responsive hamburger drawer.
- [x] **Theme Toggle**: Zero flash on reload, semantic colors on all views, adaptive Leaflet tiles.
- [x] **Auth & Roles**: Customer, Operator, Gate credentials with JWT sessions, middleware route guards, and server-side session checks.
- [x] **Signed QR Pass**: HS256 signed JWT gate tokens, full-screen kiosk pass with countdown timer, remote EV charging controls.
- [x] **Gate Terminal**: Animated physical barrier arm, single-use anti-passback enforcement, audit logs, SSE real-time broadcast.
- [x] **India Locations & OSM**: Cascading State & District selector, live Overpass OpenStreetMap API integration with 6-hour caching.
- [x] **Clean Production Build**: 100% successful `npm run build` with zero TypeScript or Webpack errors.
