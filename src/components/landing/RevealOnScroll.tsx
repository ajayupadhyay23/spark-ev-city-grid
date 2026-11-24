"use client";

/**
 * @file src/components/landing/RevealOnScroll.tsx
 * @description Viewport reveal wrapper using Framer Motion's whileInView.
 * @purpose Gracefully reveals child elements with fadeUp motion when scrolled into view,
 * without triggering jarring re-renders if user scrolls back up.
 * @connections
 * - Wraps major sections in /src/app/page.tsx
 */

import React from "react";
import { motion } from "framer-motion";
import { fadeUpVariant } from "@/lib/animations";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";

interface RevealOnScrollProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export default function RevealOnScroll({
  children,
  className = "",
  delay = 0,
}: RevealOnScrollProps) {
  const prefersReduced = useReducedMotionSafe();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      variants={fadeUpVariant}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
