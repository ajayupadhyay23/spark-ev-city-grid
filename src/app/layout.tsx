import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import StarfieldBackground from "@/components/ui/StarfieldBackground";
import FloatingNavbar from "@/components/ui/FloatingNavbar";
import ToastContainer from "@/components/ui/Toast";

/**
 * @file src/app/layout.tsx
 * @description Application root layout wrapped with NextAuth SessionProvider and next-themes ThemeProvider.
 * @purpose Renders the global HTML shell, background starfield canvas, floating navbar, and toast alerts.
 * Fonts are loaded via Google Fonts CDN in <head> with system fallbacks to guarantee instant,
 * proxy-safe build and execution without node-fetch certificate issues.
 *
 * Typography Selection Rationale:
 * - Inter: Clear sans-serif for numbers, dense maps, and UI tables.
 * - Cormorant Garamond: Elegant italic serif adding luxury contrast.
 * - Pirata One: Gothic blackletter accent for the hero title.
 */

export const metadata: Metadata = {
  title: "Smart Parking & EV Charging Finder | City-Wide Live Grid",
  description:
    "Next-generation urban parking and EV charging finder with real-time IoT slot availability, dynamic pricing, and digital reservations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,400;1,600&family=Inter:wght@400;500;600;700;800&family=Pirata+One&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans bg-bg text-text antialiased selection:bg-rust selection:text-white min-h-screen relative overflow-x-hidden transition-colors duration-200">
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            {/* Fixed starfield/pastel background layer */}
            <StarfieldBackground />

            {/* Scroll-aware floating pill navbar with role-aware navigation */}
            <FloatingNavbar />

            {/* Main view container */}
            <div className="relative z-10 flex flex-col min-h-screen">{children}</div>

            {/* Global toast notification stack */}
            <ToastContainer />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
