"use client";

/**
 * @file src/components/providers/ThemeProvider.tsx
 * @description next-themes wrapper provider.
 * @purpose Handles zero-flash hydration theme switching, synchronizing the 'dark' CSS class on <html>
 * and storing the user preference in localStorage.
 * @connections
 * - Wrapped in /src/app/layout.tsx
 * - Toggled by /src/components/ui/ThemeToggle.tsx
 */

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export type ThemeProviderProps = React.ComponentProps<typeof NextThemesProvider>;

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
