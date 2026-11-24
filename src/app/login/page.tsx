"use client";

/**
 * @file src/app/login/page.tsx
 * @description Authentication login screen with 1-click Demo Account switches.
 * @purpose Allows seamless testing of all 3 security roles (Customer, Operator, Gate Officer)
 * without manual typing, using NextAuth credentials signIn. Wrapped in Suspense for Next.js App Router static optimization.
 * @connections
 * - Authenticates via NextAuth credentials provider
 * - Redirects to role-specific entry points (/operator, /gate, /finder)
 */

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Zap, Lock, Mail, ArrowRight, Shield, User, Camera, Loader2, AlertCircle } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/finder";

  const [email, setEmail] = useState("customer@demo.com");
  const [password, setPassword] = useState("demo123");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      setError(res.error);
      setIsLoading(false);
    } else {
      // Determine smart landing route based on chosen account if no callback specified
      if (email.includes("operator")) {
        router.push("/operator");
      } else if (email.includes("gate")) {
        router.push("/gate");
      } else {
        router.push(callbackUrl);
      }
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur-xl">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-rust/10 text-rust mb-3">
            <Zap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-text">Sign In to Grid</h1>
          <p className="text-sm text-muted mt-1">
            Access live bays, EV chargers, and gate credentials
          </p>
        </div>

        {/* 1-Click Role Fill Buttons for effortless reviewer testing */}
        <div className="mb-6 bg-surface-2 p-3 rounded-xl border border-border">
          <p className="text-xs font-semibold text-muted mb-2 uppercase tracking-wider">
            Quick Demo Accounts (1-Click)
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setEmail("customer@demo.com");
                setPassword("demo123");
              }}
              className={`p-2 rounded-lg text-xs font-medium flex flex-col items-center gap-1 border transition-all ${
                email === "customer@demo.com"
                  ? "border-rust bg-rust/10 text-rust"
                  : "border-border bg-surface text-muted hover:text-text"
              }`}
            >
              <User className="w-4 h-4" />
              <span>Customer</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEmail("operator@demo.com");
                setPassword("demo123");
              }}
              className={`p-2 rounded-lg text-xs font-medium flex flex-col items-center gap-1 border transition-all ${
                email === "operator@demo.com"
                  ? "border-rust bg-rust/10 text-rust"
                  : "border-border bg-surface text-muted hover:text-text"
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Operator</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEmail("gate@demo.com");
                setPassword("demo123");
              }}
              className={`p-2 rounded-lg text-xs font-medium flex flex-col items-center gap-1 border transition-all ${
                email === "gate@demo.com"
                  ? "border-rust bg-rust/10 text-rust"
                  : "border-border bg-surface text-muted hover:text-text"
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Gate</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-surface-2 border border-border text-text placeholder:text-muted focus:outline-none focus:border-rust"
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-surface-2 border border-border text-text placeholder:text-muted focus:outline-none focus:border-rust"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-rust hover:bg-rust-hover text-white font-semibold shadow-glow-rust flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-border text-center text-xs text-muted">
          <span>New driver? </span>
          <Link href="/register" className="text-rust hover:underline font-semibold">
            Create Customer Account
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-24 pb-12 flex items-center justify-center px-4">
        <Loader2 className="w-8 h-8 animate-spin text-rust" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
