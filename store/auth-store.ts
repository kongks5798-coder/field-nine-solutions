/**
 * K-UNIVERSAL Authentication & KYC Store
 * Zustand-powered state management
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PassportData } from '@/lib/ocr/passport-scanner';

export interface UserProfile {
  id: string;
  userId: string;
  kycStatus: 'not_submitted' | 'pending' | 'verified' | 'rejected';
  kycVerifiedAt: string | null;
  passportData?: PassportData;
}

export interface WalletState {
  balance: number;
  currency: string;
  hasVirtualCard: boolean;
  lastTopup?: {
    amount: number;
    timestamp: string;
  };
}

interface AuthState {
  isAuthenticated: boolean;
  userProfile: UserProfile | null;
  wallet: WalletState | null;
  isLoadingProfile: boolean;
  isLoadingWallet: boolean;
  setUserProfile: (profile: UserProfile) => void;
  setWallet: (wallet: WalletState) => void;
  updateKYCStatus: (status: UserProfile['kycStatus'], passportData?: PassportData) => void;
  addBalance: (amount: number) => void;
  syncWalletFromDB: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      userProfile: null,
      wallet: null,
      isLoadingProfile: false,
      isLoadingWallet: false,

      setUserProfile: (profile) =>
        set({
          userProfile: profile,
          isAuthenticated: true,
        }),

      setWallet: (wallet) =>
        set({ wallet }),

      updateKYCStatus: (status, passportData) =>
        set((state) => ({
          userProfile: state.userProfile
            ? {
                ...state.userProfile,
                kycStatus: status,
                kycVerifiedAt: status === 'verified' ? new Date().toISOString() : null,
                passportData: passportData || state.userProfile.passportData,
              }
            : null,
        })),

      addBalance: (amount) =>
        set((state) => ({
          wallet: state.wallet
            ? {
                ...state.wallet,
                balance: state.wallet.balance + amount,
                lastTopup: {
                  amount,
                  timestamp: new Date().toISOString(),
                },
              }
            : {
                balance: amount,
                currency: 'KRW',
                hasVirtualCard: false,
                lastTopup: {
                  amount,
                  timestamp: new Date().toISOString(),
                },
              },
        })),

      syncWalletFromDB: async () => {
        const state = useAuthStore.getState();
        if (!state.userProfile?.userId) return;

        try {
          set({ isLoadingWallet: true });
          const response = await fetch(`/api/wallet/balance?userId=${state.userProfile.userId}`);
          const data = await response.json();

          if (data.success && data.wallet) {
            set({
              wallet: {
                balance: data.wallet.balance,
                currency: data.wallet.currency || 'KRW',
                hasVirtualCard: false,
              },
              isLoadingWallet: false,
            });
          } else {
            set({ isLoadingWallet: false });
          }
        } catch (error) {
          console.error('지갑 동기화 실패:', error);
          set({ isLoadingWallet: false });
        }
      },

      logout: () =>
        set({
          isAuthenticated: false,
          userProfile: null,
          wallet: null,
        }),
    }),
    {
      name: 'k-universal-auth',
      partialize: (state) => ({
        userProfile: state.userProfile,
        wallet: state.wallet,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
