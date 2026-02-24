import { create } from "zustand";
import { TOK_INIT, getTokens } from "../workspace.constants";

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

export const useTokenStore = create<TokenState>(() => ({
  tokenBalance: TOK_INIT,
  monthlyUsage: null,
  showTopUp: false,
  topUpData: null,

  setTokenBalance: (v) => useTokenStore.setState({ tokenBalance: v }),
  setMonthlyUsage: (v) => useTokenStore.setState({ monthlyUsage: v }),
  setShowTopUp: (v) => useTokenStore.setState({ showTopUp: v }),
  setTopUpData: (v) => useTokenStore.setState({ topUpData: v }),
}));
