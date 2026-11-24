/**
 * @file src/lib/animations.ts
 * @description Centralized Framer Motion animation variants and transition configurations.
 * @purpose Ensures visual harmony, predictable physics (springs/easings), and clean reusability
 * across the entire application without duplicated motion definitions.
 * @connections
 * - Used in landing components (/src/components/landing/...)
 * - Used in booking wizard (/src/components/booking/BookingWizard.tsx)
 * - Used in spot cards and drawer (/src/components/spots/...)
 */

import { Variants } from "framer-motion";

/**
 * Standard cubic-bezier easing curves
 * 'cinematicEase' provides a slow, luxurious deceleration typical of high-end automotive and fintech UIs.
 */
export const cinematicEase = [0.22, 1, 0.36, 1];

/**
 * Fades in while translating upward from 24px below.
 * WHY: Creates an intentional, buoyant entrance for headings, cards, and text blocks.
 */
export const fadeUpVariant: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
    filter: "blur(4px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.6,
      ease: cinematicEase,
    },
  },
};

/**
 * Stagger parent container for coordinated list item animations.
 * WHY: Reveals children sequentially with 0.08s delays, preventing overwhelming instantaneous renders.
 */
export const staggerContainerVariant: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

/**
 * Scale up from 95% with slight blur.
 * WHY: Used for modal dialogues, the arch hero container, and map drawer to feel grounded and expanding.
 */
export const scaleInVariant: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: cinematicEase,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    transition: {
      duration: 0.3,
    },
  },
};

/**
 * Slide horizontally between steps in multi-stage wizards.
 * WHY: Directional slide clearly communicates forward progress or backward navigation.
 */
export const slideWizardStepVariant: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 50 : -50,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: {
      x: { type: "spring", stiffness: 320, damping: 30 },
      opacity: { duration: 0.25 },
    },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 50 : -50,
    opacity: 0,
    transition: {
      x: { type: "spring", stiffness: 320, damping: 30 },
      opacity: { duration: 0.2 },
    },
  }),
};

/**
 * Interactive card hover lift with subtle shadow accentuation.
 * WHY: Micro-feedback lets users know cards and spots are interactive and clickable.
 */
export const cardHoverMotion = {
  rest: { y: 0, scale: 1 },
  hover: {
    y: -4,
    scale: 1.01,
    transition: { duration: 0.2, ease: "easeOut" },
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 },
  },
};

/**
 * Pulsing glow for the live availability badge.
 * WHY: Draws the driver's eye to indicate real-time sensor freshness without distracting.
 */
export const livePulseVariant: Variants = {
  initial: { scale: 0.95, opacity: 0.6 },
  animate: {
    scale: [0.95, 1.25, 0.95],
    opacity: [0.6, 1, 0.6],
    transition: {
      duration: 2.2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

/**
 * Slide-over drawer entrance from the right side of the screen.
 * WHY: Used for spot detail inspection without losing map context.
 */
export const slideOverDrawerVariant: Variants = {
  hidden: { x: "100%", opacity: 0 },
  visible: {
    x: "0%",
    opacity: 1,
    transition: {
      type: "spring",
      damping: 28,
      stiffness: 260,
    },
  },
  exit: {
    x: "100%",
    opacity: 0,
    transition: {
      duration: 0.25,
      ease: "easeInOut",
    },
  },
};
