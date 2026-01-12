'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Stripe 초기화
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

interface StripeSubscriptionProps {
  email: string;
  userId?: string;
  onSuccess?: (subscriptionId: string) => void;
  onError?: (error: string) => void;
}

function SubscriptionForm({
  email,
  userId,
  onSuccess,
  onError,
}: StripeSubscriptionProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [tier, setTier] = useState<'basic' | 'pro'>('basic');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. 구독 생성 (Lambda 호출)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/create-subscription`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            tier,
            userId,
          }),
        }
      );

      const data = await response.json();

      if (!data.success || !data.clientSecret) {
        throw new Error(data.error || '구독 생성에 실패했습니다.');
      }

      // 2. 결제 확인
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('카드 정보를 입력해주세요.');
      }

      const { error: confirmError, paymentIntent } =
        await stripe.confirmCardPayment(data.clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              email,
            },
          },
        });

      if (confirmError) {
        throw new Error(confirmError.message || '결제에 실패했습니다.');
      }

      if (paymentIntent?.status === 'succeeded') {
        onSuccess?.(data.subscriptionId);
      } else {
        throw new Error('결제 상태를 확인할 수 없습니다.');
      }
    } catch (err: any) {
      const errorMessage = err.message || '구독 생성 중 오류가 발생했습니다.';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 티어 선택 */}
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setTier('basic')}
          className={`p-4 rounded-lg border-2 transition-colors ${
            tier === 'basic'
              ? 'border-tesla-black bg-tesla-black text-white'
              : 'border-gray-200 bg-white'
          }`}
        >
          <div className="font-bold text-lg">Basic</div>
          <div className="text-sm">$4.99/월</div>
        </button>
        <button
          type="button"
          onClick={() => setTier('pro')}
          className={`p-4 rounded-lg border-2 transition-colors ${
            tier === 'pro'
              ? 'border-tesla-black bg-tesla-black text-white'
              : 'border-gray-200 bg-white'
          }`}
        >
          <div className="font-bold text-lg">Pro</div>
          <div className="text-sm">$14.99/월</div>
        </button>
      </div>

      {/* 카드 입력 */}
      <div className="p-4 border-2 border-gray-200 rounded-lg">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#1A1A1A',
                '::placeholder': {
                  color: '#9CA3AF',
                },
              },
            },
          }}
        />
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* 제출 버튼 */}
      <Button
        type="submit"
        disabled={!stripe || isLoading}
        className="w-full bg-tesla-black text-white py-4 rounded-lg font-bold text-lg hover:bg-gray-800 disabled:opacity-50"
      >
        {isLoading ? '처리 중...' : `${tier === 'basic' ? '$4.99' : '$14.99'}/월로 구독하기`}
      </Button>
    </form>
  );
}

export default function StripeSubscription({
  email,
  userId,
  onSuccess,
  onError,
}: StripeSubscriptionProps) {
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
        Stripe Publishable Key가 설정되지 않았습니다.
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>구독하기</CardTitle>
      </CardHeader>
      <CardContent>
        <Elements stripe={stripePromise}>
          <SubscriptionForm
            email={email}
            userId={userId}
            onSuccess={onSuccess}
            onError={onError}
          />
        </Elements>
      </CardContent>
    </Card>
  );
}
