"use client";

/**
 * @file src/components/providers/AuthProvider.tsx
 * @description NextAuth SessionProvider wrapper.
 * @purpose Supplies client components with the authenticated user session context (useSession hook),
 * role indicators, and token status.
 * @connections
 * - Wrapped in /src/app/layout.tsx
 * - Used by /src/components/ui/FloatingNavbar.tsx and authenticated pages
 */

import React from "react";
import { SessionProvider } from "next-auth/react";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
