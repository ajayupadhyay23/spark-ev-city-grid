"use client";

/**
 * @file src/components/ui/ThemeToggle.tsx
 * @description Theme toggle button integrating next-themes.
 * @purpose Lets drivers and operators switch between Light and Cinematic Dark themes with a smooth micro-rotation animation.
 * WHY: Uses a `mounted` state flag to prevent React SSR hydration mismatches before localStorage is read.
 * @connections
 * - Used in /src/components/ui/FloatingNavbar.tsx and operator headers
 */

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-8 h-8 rounded-full bg-surface-subtle border border-border flex items-center justify-center opacity-50" />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      type="button"
      aria-label="Toggle visual color theme"
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      className="p-1.5 rounded-full text-muted hover:text-text bg-surface-subtle hover:bg-border transition-colors border border-border focus:outline-none focus:ring-2 focus:ring-rust"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-300 transition-transform hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-sky-500 transition-transform hover:-rotate-12" />
      )}
    </button>
  );
}
