/**
 * @file src/hooks/useCountdown.ts
 * @description Hook providing a live high-precision countdown timer until a target timestamp.
 * @purpose Powers the active booking countdown cards in /bookings, showing hours, minutes, and seconds
 * remaining until parking expiration with progress bar calculation.
 * @connections
 * - Used in /src/app/bookings/page.tsx
 */

import { useState, useEffect } from "react";

interface CountdownResult {
  hours: number;
  minutes: number;
  seconds: number;
  formatted: string;
  isExpired: boolean;
  totalSecondsRemaining: number;
}

export function useCountdown(targetIsoTime: string): CountdownResult {
  const [remainingMs, setRemainingMs] = useState<number>(() => {
    const target = new Date(targetIsoTime).getTime();
    return Math.max(0, target - Date.now());
  });

  useEffect(() => {
    const target = new Date(targetIsoTime).getTime();

    const interval = setInterval(() => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setRemainingMs(0);
        clearInterval(interval);
      } else {
        setRemainingMs(diff);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetIsoTime]);

  const totalSecondsRemaining = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSecondsRemaining / 3600);
  const minutes = Math.floor((totalSecondsRemaining % 3600) / 60);
  const seconds = totalSecondsRemaining % 60;

  const pad = (n: number) => n.toString().padStart(2, "0");
  const formatted = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  return {
    hours,
    minutes,
    seconds,
    formatted,
    isExpired: totalSecondsRemaining <= 0,
    totalSecondsRemaining,
  };
}
