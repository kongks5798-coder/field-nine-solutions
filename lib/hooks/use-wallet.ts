/**
 * K-UNIVERSAL Wallet Hook
 * Ghost Wallet 관리 - 토스페이먼츠 연동
 */

import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { loadTossPayments } from '@tosspayments/tosspayments-sdk';
import { TOSS_CLIENT_KEY, generateOrderId, formatKRW } from '@/lib/toss/client';
import { toast } from 'sonner';

export function useWallet() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { wallet, addBalance, userProfile } = useAuthStore();

  /**
   * 토스페이먼츠로 지갑 충전
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

    if (amount < 1000) {
      toast.error('최소 충전 금액은 1,000원입니다');
      return false;
    }

    setIsProcessing(true);

    try {
      const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
      const orderId = generateOrderId();

      // 토스 결제창 열기
      await tossPayments.requestPayment('카드', {
        amount,
        orderId,
        orderName: `Ghost Wallet 충전`,
        customerName: userProfile.passportData?.fullName || 'K-Universal User',
        successUrl: `${window.location.origin}/wallet/success?userId=${userProfile.userId}&amount=${amount}`,
        failUrl: `${window.location.origin}/wallet/fail`,
      });

      return true;
    } catch (error: any) {
      if (error.code === 'USER_CANCEL') {
        toast.info('결제가 취소되었습니다');
      } else {
        toast.error(error.message || '결제 처리 중 오류가 발생했습니다');
      }
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * 가상 카드 생성
   */
  const createVirtualCard = async (): Promise<boolean> => {
    if (!userProfile?.userId || !userProfile.passportData) {
      toast.error('KYC 인증이 필요합니다');
      return false;
    }

    if (!wallet || wallet.balance < 10000) {
      toast.error('최소 10,000원 이상 잔액이 필요합니다');
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
        toast.success('가상 카드가 생성되었습니다!', { id: 'create-card' });
        return true;
      } else {
        throw new Error(data.error || '카드 생성 실패');
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
   * 잔액 조회 (원화 포맷)
   */
  const getFormattedBalance = (): string => {
    return formatKRW(wallet?.balance || 0);
  };

  return {
    wallet,
    isProcessing,
    topUpWallet,
    createVirtualCard,
    getFormattedBalance,
  };
}
