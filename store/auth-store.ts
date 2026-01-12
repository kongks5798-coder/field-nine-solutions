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
  // User State
  isAuthenticated: boolean;
  userProfile: UserProfile | null;
  
  // Wallet State
  wallet: WalletState | null;
  
  // Loading States
  isLoadingProfile: boolean;
  isLoadingWallet: boolean;
  
  // Actions
  setUserProfile: (profile: UserProfile) => void;
  setWallet: (wallet: WalletState) => void;
  updateKYCStatus: (status: UserProfile['kycStatus'], passportData?: PassportData) => void;
  addBalance: (amount: number) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial State
      isAuthenticated: false,
      userProfile: null,
      wallet: null,
      isLoadingProfile: false,
      isLoadingWallet: false,

      // Set user profile
      setUserProfile: (profile) =>
        set({
          userProfile: profile,
          isAuthenticated: true,
        }),

      // Set wallet
      setWallet: (wallet) =>
        set({ wallet }),

      // Update KYC status
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

      // Add balance to wallet
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
                currency: 'USD',
                hasVirtualCard: false,
                lastTopup: {
                  amount,
                  timestamp: new Date().toISOString(),
                },
              },
        })),

      // Logout
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
