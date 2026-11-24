import type { Config } from "tailwindcss";

/**
 * @file tailwind.config.ts
 * @description Tailwind configuration supporting class-based dark mode and CSS variable semantic color tokens.
 * @purpose Enables dynamic runtime switching between Light and Cinematic Dark modes without hardcoding
 * single-theme hex colors.
 */

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic Theme CSS Variable Tokens
        bg: "var(--bg)",
        surface: {
          DEFAULT: "var(--surface)",
          subtle: "var(--surface-2)",
          card: "var(--surface-3)",
          border: "var(--border)",
        },
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
        text: {
          DEFAULT: "var(--text)",
          muted: "var(--muted)",
        },
        muted: "var(--muted)",
        // Brand Identity Accents
        rust: {
          DEFAULT: "#C2603F",
          hover: "#d97350",
          light: "#F08C6A",
          dark: "#A34C30",
        },
        ev: {
          DEFAULT: "#00D2FF",
          glow: "var(--glow-blue)",
          dark: "#007799",
        },
        parking: {
          DEFAULT: "#FF7A00",
          glow: "var(--glow-orange)",
          dark: "#994900",
        },
      },
      fontFamily: {
        sans: ["'Inter'", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        serif: ["'Cormorant Garamond'", "Georgia", "serif"],
        blackletter: ["'Pirata One'", "Georgia", "Impact", "cursive"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      boxShadow: {
        "glow-rust": "0 0 25px rgba(194, 96, 63, 0.45)",
        "glow-ev": "0 0 30px var(--glow-blue)",
        "glow-parking": "0 0 30px var(--glow-orange)",
        "glass": "0 8px 32px 0 rgba(0, 0, 0, 0.15)",
        "glass-dark": "0 8px 32px 0 rgba(0, 0, 0, 0.45)",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "breathe-blue": "breatheBlue 6s ease-in-out infinite",
        "breathe-orange": "breatheOrange 6s ease-in-out infinite",
      },
      keyframes: {
        breatheBlue: {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%": { opacity: "0.8", transform: "scale(1.08)" },
        },
        breatheOrange: {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%": { opacity: "0.8", transform: "scale(1.08)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
