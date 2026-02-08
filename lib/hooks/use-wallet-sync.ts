/**
 * K-UNIVERSAL Wallet Sync Hook
 * DB에서 지갑 잔액을 로드하여 Store와 동기화
 */

'use client';

import { useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/auth-store';

interface WalletResponse {
  success: boolean;
  wallet?: {
    balance: number;
    currency: string;
    updatedAt?: string;
  };
  transactions?: Array<{
    id: string;
    amount: number;
    status: string;
    method: string;
    created_at: string;
  }>;
  error?: string;
}

export function useWalletSync() {
  const { userProfile, setWallet, wallet } = useAuthStore();

  // DB에서 지갑 잔액 로드
  const syncWallet = useCallback(async () => {
    if (!userProfile?.userId) return;

    try {
      const response = await fetch(`/api/wallet/balance?userId=${userProfile.userId}`);
      const data: WalletResponse = await response.json();

      if (data.success && data.wallet) {
        setWallet({
          balance: data.wallet.balance,
          currency: data.wallet.currency || 'KRW',
          hasVirtualCard: false,
        });
      }
    } catch (error) {
      console.error('지갑 동기화 실패:', error);
    }
  }, [userProfile?.userId, setWallet]);

  // 컴포넌트 마운트 시 자동 동기화
  useEffect(() => {
    if (userProfile?.userId) {
      syncWallet();
    }
  }, [userProfile?.userId, syncWallet]);

  return {
    wallet,
    syncWallet,
    balance: wallet?.balance || 0,
    currency: wallet?.currency || 'KRW',
  };
}
