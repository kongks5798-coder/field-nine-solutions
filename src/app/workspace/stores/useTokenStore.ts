import { create } from "zustand";
import { persist } from "zustand/middleware";
import { TOK_INIT } from "../workspace.constants";

interface TokenState {
  tokenBalance: number;
  monthlyUsage: { amount_krw: number; ai_calls: number; hard_limit: number; warn_threshold: number } | null;
  showTopUp: boolean;
  topUpData: { currentSpent: number; hardLimit: number; periodReset: string } | null;

  setTokenBalance: (v: number) => void;
  setMonthlyUsage: (v: { amount_krw: number; ai_calls: number; hard_limit: number; warn_threshold: number } | null) => void;
  setShowTopUp: (v: boolean) => void;
  setTopUpData: (v: { currentSpent: number; hardLimit: number; periodReset: string } | null) => void;
}

export const useTokenStore = create<TokenState>()(
  persist(
    (set) => ({
      tokenBalance: TOK_INIT,
      monthlyUsage: null,
      showTopUp: false,
      topUpData: null,

      setTokenBalance: (v: number) => set({ tokenBalance: v }),
      setMonthlyUsage: (v: { amount_krw: number; ai_calls: number; hard_limit: number; warn_threshold: number } | null) => set({ monthlyUsage: v }),
      setShowTopUp: (v: boolean) => set({ showTopUp: v }),
      setTopUpData: (v: { currentSpent: number; hardLimit: number; periodReset: string } | null) => set({ topUpData: v }),
    }),
    {
      name: "f9_tokens_v1",
      partialize: (state) => ({
        tokenBalance: state.tokenBalance,
      }),
    }
  )
);
