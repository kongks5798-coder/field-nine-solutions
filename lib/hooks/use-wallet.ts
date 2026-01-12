/**
 * K-UNIVERSAL Wallet Hook
 * Manages Ghost Wallet operations
 */

import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { loadStripe } from '@stripe/stripe-js';
import { getStripePublishableKey } from '@/lib/stripe/client';
import { toast } from 'sonner';

const stripePromise = loadStripe(getStripePublishableKey());

export function useWallet() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { wallet, addBalance, userProfile } = useAuthStore();

  /**
   * Top up wallet balance
   */
  const topUpWallet = async (amount: number): Promise<boolean> => {
    if (!userProfile?.userId) {
      toast.error('로그인이 필요합니다');
      return false;
    }

    if (userProfile.kycStatus !== 'verified') {
      toast.error('KYC 인증이 필요합니다');
      return false;
    }

    setIsProcessing(true);
    toast.loading(`$${amount} 충전 중...`, { id: 'wallet-topup' });

    try {
      // 1. Create Payment Intent
      const response = await fetch('/api/wallet/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency: 'usd',
          userId: userProfile.userId,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Payment failed');
      }

      // 2. For demo: Simulate successful payment
      // Production: Redirect to Stripe Checkout or use Stripe Elements
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 3. Update local balance
      addBalance(amount);

      toast.success(`✅ $${amount} 충전 완료!`, { id: 'wallet-topup' });
      return true;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : '충전 실패',
        { id: 'wallet-topup' }
      );
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Create virtual card
   */
  const createVirtualCard = async (): Promise<boolean> => {
    if (!userProfile?.userId || !userProfile.passportData) {
      toast.error('KYC 인증이 필요합니다');
      return false;
    }

    if (!wallet || wallet.balance < 10) {
      toast.error('최소 $10 이상 잔액이 필요합니다');
      return false;
    }

    setIsProcessing(true);
    toast.loading('가상 카드 생성 중...', { id: 'create-card' });

    try {
      const response = await fetch('/api/wallet/virtual-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userProfile.userId,
          cardholderName: userProfile.passportData.fullName,
          initialBalance: wallet.balance,
          currency: 'KRW',
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('✅ 가상 카드 생성 완료!', { id: 'create-card' });
        return true;
      } else {
        throw new Error(data.error || 'Card creation failed');
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : '카드 생성 실패',
        { id: 'create-card' }
      );
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Get wallet balance in KRW
   */
  const getBalanceInKRW = (): number => {
    return (wallet?.balance || 0) * 1300; // USD to KRW conversion
  };

  return {
    wallet,
    isProcessing,
    topUpWallet,
    createVirtualCard,
    getBalanceInKRW,
  };
}
