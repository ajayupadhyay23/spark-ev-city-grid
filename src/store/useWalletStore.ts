/**
 * @file src/store/useWalletStore.ts
 * @description Zustand store managing driver digital wallet balance and simulated transactions.
 * @purpose Decouples wallet state from route components so top-ups, reservation deductions,
 * and refunds reflect immediately across navbar badges, payment selectors, and the wallet tab.
 * @connections
 * - Used in /src/components/payment/WalletForm.tsx
 * - Used in /src/components/booking/StepPayment.tsx
 * - Connects to /api/wallet endpoints
 */

import { create } from "zustand";
import { DEFAULT_USER_ID, INITIAL_WALLET_BALANCE } from "@/lib/constants";
import { UserWallet } from "@/types";

interface WalletState {
  wallet: UserWallet;
  isLoading: boolean;
  error: string | null;
  fetchWallet: (userId?: string) => Promise<void>;
  topUp: (amount: number, method: "card" | "upi", userId?: string) => Promise<boolean>;
  topUpWallet: (amount: number, description?: string, userId?: string) => Promise<boolean>;
  refreshBalance: () => Promise<void>;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  wallet: {
    userId: DEFAULT_USER_ID,
    balance: INITIAL_WALLET_BALANCE,
    transactions: [],
  },
  isLoading: false,
  error: null,

  fetchWallet: async (userId = DEFAULT_USER_ID) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/wallet?userId=${userId}`);
      const data = await res.json();
      if (data.success && data.wallet) {
        set({ wallet: data.wallet, isLoading: false });
      } else {
        set({ error: data.error || "Failed to load wallet", isLoading: false });
      }
    } catch {
      set({ error: "Network error fetching wallet", isLoading: false });
    }
  },

  topUp: async (amount, method, userId = DEFAULT_USER_ID) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, amount, method }),
      });
      const data = await res.json();
      if (data.success && data.wallet) {
        set({ wallet: data.wallet, isLoading: false });
        return true;
      }
      set({ error: data.error || "Top-up failed", isLoading: false });
      return false;
    } catch {
      set({ error: "Network error processing top-up", isLoading: false });
      return false;
    }
  },

  topUpWallet: async (amount: number, description?: string, userId = DEFAULT_USER_ID) => {
    return get().topUp(amount, "card", userId);
  },

  refreshBalance: async () => {
    const currentId = get().wallet.userId;
    await get().fetchWallet(currentId);
  },
}));
