/**
 * @file src/middleware.ts
 * @description Layer 1 Authorization & Route Protection Middleware.
 * @purpose Intercepts incoming HTTP requests at the edge before route handlers execute.
 * WHY TWO LAYERS ARE CRUCIAL:
 * - Layer 1 (Middleware): Fast edge redirects. Immediately blocks unauthorized page visits
 *   (e.g., redirecting an unauthenticated user hitting /bookings directly to /login,
 *   or preventing customers from reaching /operator or /gate), saving server execution cycles.
 * - Layer 2 (Server-Side Checks): Backend route handler checks. Validates JWT sessions within API handlers
 *   (/api/operator/*, /api/gate/*, /api/reservations) so that forged client requests, bypassed headers,
 *   or direct curl calls can never execute protected actions without verified credentials.
 * @connections
 * - Reads JWT cookie via next-auth/jwt
 * - Protects /operator, /gate, /bookings, /api/operator/*
 */

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Retrieve decrypted NextAuth JWT token from session cookie
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || "spark-ev-super-secret-demo-jwt-key-2026",
  });

  const isLoggedIn = !!token;
  const userRole = token?.role;

  // 1. Protected Operator Routes: Require role 'operator'
  if (pathname.startsWith("/operator") || pathname.startsWith("/api/operator")) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (userRole !== "operator") {
      // Forbidden: redirect customer to homepage with error notice
      return NextResponse.redirect(new URL("/?error=unauthorized_operator", request.url));
    }
  }

  // 2. Protected Gate Scanner Routes: Require role 'gate' OR 'operator'
  if (pathname.startsWith("/gate") || pathname.startsWith("/api/gate")) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (userRole !== "gate" && userRole !== "operator") {
      return NextResponse.redirect(new URL("/?error=unauthorized_gate", request.url));
    }
  }

  // 3. Protected Customer Routes: Require any authenticated user
  if (pathname.startsWith("/bookings")) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/operator/:path*",
    "/gate/:path*",
    "/bookings/:path*",
    "/api/operator/:path*",
    "/api/gate/:path*",
  ],
};
