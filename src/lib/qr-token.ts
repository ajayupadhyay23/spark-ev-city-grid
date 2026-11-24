/**
 * @file src/lib/qr-token.ts
 * @description Cryptographically signed JWT QR tokens for automated gate barrier access and EV charging.
 * @purpose Generates and verifies HMAC-SHA256 (HS256) signed gate tokens using `jose`.
 *
 * WHY SIGNED TOKENS ARE USED:
 * - A simple static string or booking ID can be forged, copied, or spoofed by malicious users to open barriers.
 * - By signing the payload with a symmetric secret key, the physical gate scanner can verify authenticity
 *   and tamper-proof validity in milliseconds.
 *
 * EXPIRY & LEEWAY POLICY:
 * - Leeway: Driver is granted entry 10 minutes prior to scheduled booking start time to account for early arrival.
 * - Grace Period: Entry is permitted until booking end time (+ 15-minute egress grace window).
 *
 * LIFECYCLE STATE MACHINE:
 * - `reserved` -> (Scans Entry Token) -> `checked_in` -> (Triggers Charge) -> `charging` -> (Scans Exit Token) -> `completed`
 * - An entry token cannot be used twice (anti-passback). Exit tokens are only valid after a valid check-in.
 *
 * @connections
 * - Used by /src/components/booking/StepSuccess.tsx and /src/app/bookings/page.tsx
 * - Verified by /src/app/api/gate/scan/route.ts
 */

import { SignJWT, jwtVerify } from "jose";

export type TokenPurpose = "entry" | "exit" | "charge";

export type BookingGateState =
  | "reserved"
  | "checked_in"
  | "charging"
  | "completed"
  | "cancelled"
  | "expired";

export interface GateTokenPayload {
  bookingId: string;
  spotId: string;
  userId: string;
  slotOrChargerId?: string;
  plateNumber: string;
  purpose: TokenPurpose;
  validFrom: number; // Unix timestamp in seconds
  validUntil: number; // Unix timestamp in seconds
  nonce: string;
}

const QR_SECRET = new TextEncoder().encode(
  process.env.QR_SECRET || "spark-ev-demo-qr-barrier-secret-key-32b-length-ok!"
);

/**
 * Creates and signs a tamper-proof JWT token string.
 */
export async function generateGateToken(
  payload: Omit<GateTokenPayload, "validFrom" | "validUntil" | "nonce">,
  startTimeISO: string,
  endTimeISO: string
): Promise<string> {
  const startMs = new Date(startTimeISO).getTime();
  const endMs = new Date(endTimeISO).getTime();

  // Allow 10 minutes leeway before booking start time
  const validFrom = Math.floor((startMs - 10 * 60 * 1000) / 1000);
  // Allow 15 minutes grace window after booking end time
  const validUntil = Math.floor((endMs + 15 * 60 * 1000) / 1000);

  const nonce = Math.random().toString(36).substring(2, 10);

  return await new SignJWT({ ...payload, validFrom, validUntil, nonce })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(validUntil)
    .sign(QR_SECRET);
}

/**
 * Verifies a scanned gate token against signature, expiry, and timing windows.
 */
export async function verifyGateToken(
  tokenString: string
): Promise<{ valid: boolean; payload?: GateTokenPayload; error?: string }> {
  try {
    const { payload } = await jwtVerify(tokenString, QR_SECRET, {
      algorithms: ["HS256"],
    });

    const token = payload as unknown as GateTokenPayload;
    const nowSec = Math.floor(Date.now() / 1000);

    if (nowSec < token.validFrom) {
      const waitMins = Math.ceil((token.validFrom - nowSec) / 60);
      return {
        valid: false,
        error: `Early arrival. Gate token becomes active in ${waitMins} minute(s).`,
      };
    }

    if (nowSec > token.validUntil) {
      return {
        valid: false,
        error: "Gate pass has expired. Please extend your booking or contact the operator.",
      };
    }

    return { valid: true, payload: token };
  } catch (err: any) {
    return {
      valid: false,
      error: "Invalid or forged QR token signature. Access denied.",
    };
  }
}
