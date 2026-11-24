/**
 * @file src/lib/users.ts
 * @description In-memory user store with bcrypt hashing, profile management, and multi-role access.
 * @purpose Provides 8+ authentic customer accounts and designated Operator & Gate staff accounts
 * for realistic testing and operator management without external database infrastructure.
 *
 * HOW TO SWAP FOR POSTGRESQL + PRISMA:
 * 1. Install @prisma/client and run `prisma generate`.
 * 2. In `getUserByEmail`, replace with `await prisma.user.findUnique({ where: { email } })`.
 * 3. In `createUser`, replace with `await prisma.user.create({ data: { ... } })`.
 *
 * @connections
 * - Used by NextAuth credentials provider (/src/lib/auth.ts)
 * - Used by /src/app/api/auth/register/route.ts
 * - Used by Operator administration pages (/src/app/operator/page.tsx)
 */

import bcrypt from "bcryptjs";
import { UserRecord, UserRole } from "@/types";
export type { UserRole };

export interface UserAccount extends UserRecord {
  passwordHash: string;
}

// Pre-hashed bcrypt password for "demo123" (cost 10)
const DEMO_PASSWORD_HASH = "$2a$10$7Zrqc1t7p.8k0nJ1.xGv6.Jq3906KkZ3pU2fK4K1FzT3P78U7oP/6";

// Global singleton to persist across Next.js dev server hot-reloads
declare global {
  // eslint-disable-next-line no-var
  var __mockUsers: UserAccount[] | undefined;
}

// 8+ Customers + 1 Operator + 1 Gate Officer
const SEED_USERS: UserAccount[] = [
  {
    id: "user_customer_01",
    name: "Rahul Verma",
    email: "customer@demo.com",
    phone: "+91 98765 43210",
    passwordHash: DEMO_PASSWORD_HASH,
    role: "customer",
    status: "active",
    createdAt: "2026-01-10T08:30:00.000Z",
    walletBalance: 1250,
    savedVehicles: [
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
    ],
    notes: "VIP commuter. Daily parking reservation at Sector 17.",
    notifications: { email: true, sms: true, bookingReminders: true },
  },
  {
    id: "user_customer_02",
    name: "Simran Kaur",
    email: "simran.k@example.com",
    phone: "+91 98123 45678",
    passwordHash: DEMO_PASSWORD_HASH,
    role: "customer",
    status: "active",
    createdAt: "2026-01-15T11:20:00.000Z",
    walletBalance: 800,
    savedVehicles: [
      {
        id: "veh_3",
        plateNumber: "PB65-CC-4545",
        vehicleType: "Car",
        modelName: "MG ZS EV",
        connectorType: "CCS2",
        isDefault: true,
      },
    ],
    notes: "Fast charging regular at Elante Mall.",
    notifications: { email: true, sms: false, bookingReminders: true },
  },
  {
    id: "user_customer_03",
    name: "Amanpreet Singh",
    email: "aman.singh@example.com",
    phone: "+91 98777 11223",
    passwordHash: DEMO_PASSWORD_HASH,
    role: "customer",
    status: "active",
    createdAt: "2026-01-20T14:45:00.000Z",
    walletBalance: 420,
    savedVehicles: [
      {
        id: "veh_4",
        plateNumber: "HR03-X-8800",
        vehicleType: "Car",
        modelName: "Mahindra XUV400",
        connectorType: "CCS2",
        isDefault: true,
      },
    ],
    notifications: { email: true, sms: true, bookingReminders: true },
  },
  {
    id: "user_customer_04",
    name: "Neha Gupta",
    email: "neha.gupta@example.com",
    phone: "+91 98222 33445",
    passwordHash: DEMO_PASSWORD_HASH,
    role: "customer",
    status: "active",
    createdAt: "2026-02-01T09:15:00.000Z",
    walletBalance: 1500,
    savedVehicles: [
      {
        id: "veh_5",
        plateNumber: "CH01-BZ-0007",
        vehicleType: "SUV",
        modelName: "BYD Atto 3",
        connectorType: "CCS2",
        isDefault: true,
      },
    ],
    notes: "Corporate fleet account reimbursement.",
    notifications: { email: true, sms: true, bookingReminders: true },
  },
  {
    id: "user_customer_05",
    name: "Vikram Malhotra",
    email: "vikram.m@example.com",
    phone: "+91 98333 44556",
    passwordHash: DEMO_PASSWORD_HASH,
    role: "customer",
    status: "active",
    createdAt: "2026-02-05T16:00:00.000Z",
    walletBalance: 310,
    savedVehicles: [
      {
        id: "veh_6",
        plateNumber: "DL08-CA-1122",
        vehicleType: "Car",
        modelName: "Honda City",
        isDefault: true,
      },
    ],
    notifications: { email: true, sms: false, bookingReminders: false },
  },
  {
    id: "user_customer_06",
    name: "Ananya Sharma",
    email: "ananya.s@example.com",
    phone: "+91 98444 55667",
    passwordHash: DEMO_PASSWORD_HASH,
    role: "customer",
    status: "active",
    createdAt: "2026-02-10T12:10:00.000Z",
    walletBalance: 950,
    savedVehicles: [
      {
        id: "veh_7",
        plateNumber: "PB02-AP-9999",
        vehicleType: "Car",
        modelName: "Kia EV6",
        connectorType: "CCS2",
        isDefault: true,
      },
    ],
    notifications: { email: true, sms: true, bookingReminders: true },
  },
  {
    id: "user_customer_07",
    name: "Karan Johar",
    email: "karan.j@example.com",
    phone: "+91 98555 66778",
    passwordHash: DEMO_PASSWORD_HASH,
    role: "customer",
    status: "suspended",
    createdAt: "2026-02-12T15:30:00.000Z",
    walletBalance: 50,
    savedVehicles: [
      {
        id: "veh_8",
        plateNumber: "CH04-D-4321",
        vehicleType: "Two-Wheeler",
        modelName: "Ola S1 Pro",
        connectorType: "Type 2",
        isDefault: true,
      },
    ],
    notes: "Suspended due to repeated barrier tailgating violations.",
    notifications: { email: true, sms: true, bookingReminders: false },
  },
  {
    id: "user_customer_08",
    name: "Pooja Mehta",
    email: "pooja.mehta@example.com",
    phone: "+91 98666 77889",
    passwordHash: DEMO_PASSWORD_HASH,
    role: "customer",
    status: "active",
    createdAt: "2026-02-18T10:00:00.000Z",
    walletBalance: 670,
    savedVehicles: [
      {
        id: "veh_9",
        plateNumber: "HP12-E-1010",
        vehicleType: "Car",
        modelName: "Hyundai Ioniq 5",
        connectorType: "CCS2",
        isDefault: true,
      },
    ],
    notifications: { email: true, sms: true, bookingReminders: true },
  },
  {
    id: "user_operator_01",
    name: "Priya Sharma (Chief Municipal Operator)",
    email: "operator@demo.com",
    phone: "+91 98000 00001",
    passwordHash: DEMO_PASSWORD_HASH,
    role: "operator",
    status: "active",
    createdAt: "2025-12-01T00:00:00.000Z",
    walletBalance: 0,
    savedVehicles: [],
    notes: "Municipal parking authority administrator.",
  },
  {
    id: "user_gate_01",
    name: "Officer Jasbir Singh",
    email: "gate@demo.com",
    phone: "+91 98000 00002",
    passwordHash: DEMO_PASSWORD_HASH,
    role: "gate",
    status: "active",
    createdAt: "2025-12-01T00:00:00.000Z",
    walletBalance: 0,
    savedVehicles: [],
    notes: "On-duty gate enforcement officer at Sector 17 Multi-Level Plaza.",
  },
];

/**
 * Initializes the global mock user store singleton
 */
function initMockUsers(): UserAccount[] {
  if (!globalThis.__mockUsers) {
    globalThis.__mockUsers = [...SEED_USERS];
  }
  return globalThis.__mockUsers;
}

/**
 * WHY: Finds a user account by email for authentication verification
 */
export async function getUserByEmail(email: string): Promise<UserAccount | null> {
  const users = initMockUsers();
  const normalized = email.trim().toLowerCase();
  const user = users.find((u) => u.email.toLowerCase() === normalized);
  return user || null;
}

/**
 * WHY: Finds a user by ID for session enrichment
 */
export async function getUserById(id: string): Promise<UserAccount | null> {
  const users = initMockUsers();
  return users.find((u) => u.id === id) || null;
}

/**
 * WHY: Returns all customers for the Operator Customers administration tab
 */
export async function getAllCustomers(): Promise<UserRecord[]> {
  const users = initMockUsers();
  return users
    .filter((u) => u.role === "customer")
    .map(({ passwordHash, ...rest }) => rest);
}

/**
 * WHY: Allows operators to toggle customer account suspension
 */
export async function setCustomerStatus(
  userId: string,
  status: "active" | "suspended"
): Promise<UserRecord | null> {
  const users = initMockUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) return null;
  user.status = status;
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

/**
 * WHY: Verifies plain password against bcrypt hash
 */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * WHY: Registers a new customer account
 */
export async function createCustomer(
  name: string,
  email: string,
  plainPassword: string,
  phone = "+91 98765 00000"
): Promise<UserRecord> {
  const users = initMockUsers();
  const existing = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (existing) {
    throw new Error("A user with this email address already exists.");
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(plainPassword, salt);

  const newUser: UserAccount = {
    id: `user_customer_${Date.now()}`,
    name,
    email: email.trim().toLowerCase(),
    phone,
    passwordHash,
    role: "customer",
    status: "active",
    createdAt: new Date().toISOString(),
    walletBalance: 500, // Seed welcome balance
    savedVehicles: [
      {
        id: `veh_${Date.now()}`,
        plateNumber: "CH01-XX-0001",
        vehicleType: "Car",
        modelName: "Electric Sedan",
        connectorType: "CCS2",
        isDefault: true,
      },
    ],
    notifications: { email: true, sms: true, bookingReminders: true },
  };

  users.push(newUser);
  const { passwordHash: _, ...safeUser } = newUser;
  return safeUser;
}

/**
 * WHY: Updates driver profile information
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<Pick<UserRecord, "name" | "phone" | "savedVehicles" | "notifications">>
): Promise<UserRecord | null> {
  const users = initMockUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) return null;

  if (updates.name !== undefined) user.name = updates.name;
  if (updates.phone !== undefined) user.phone = updates.phone;
  if (updates.savedVehicles !== undefined) user.savedVehicles = updates.savedVehicles;
  if (updates.notifications !== undefined) user.notifications = updates.notifications;

  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

export const createCustomerUser = createCustomer;
export const findUserByEmail = getUserByEmail;
