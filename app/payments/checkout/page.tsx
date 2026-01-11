'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import TossPaymentWidget from '@/components/payments/TossPaymentWidget';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const orderId = searchParams.get('orderId');
  const clientKey = searchParams.get('clientKey');
  const amount = searchParams.get('amount');
  const orderName = searchParams.get('orderName');
  const customerEmail = searchParams.get('customerEmail');
  const customerName = searchParams.get('customerName');
  const successUrl = searchParams.get('successUrl');
  const failUrl = searchParams.get('failUrl');

  useEffect(() => {
    // 필수 파라미터 확인
    if (!orderId || !clientKey || !amount) {
      setError('결제 정보가 올바르지 않습니다.');
    }
  }, [orderId, clientKey, amount]);

  if (error || !orderId || !clientKey || !amount) {
    return (
      <div className="min-h-screen bg-[#F2F0E9] flex items-center justify-center px-6">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">결제 오류</h2>
              <p className="text-muted-foreground mb-6">
                {error || '결제 정보가 올바르지 않습니다.'}
              </p>
              <Link href="/pricing">
                <Button>가격 페이지로 돌아가기</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSuccess = () => {
    // 성공 URL로 리다이렉트 (Toss Payments가 자동으로 처리하지만, 백업용)
    if (successUrl) {
      window.location.href = successUrl;
    } else {
      router.push('/pricing?success=true');
    }
  };

  const handleFail = (error: any) => {
    console.error('[Checkout] 결제 실패:', error);
    if (failUrl) {
      window.location.href = failUrl;
    } else {
      router.push('/pricing?fail=true');
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F0E9] flex items-center justify-center px-6 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/pricing">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <CardTitle className="text-2xl">결제하기</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <TossPaymentWidget
            clientKey={clientKey}
            orderId={orderId}
            orderName={orderName || '구독 결제'}
            amount={parseInt(amount, 10)}
            customerEmail={customerEmail || ''}
            customerName={customerName || '고객'}
            successUrl={successUrl || `${window.location.origin}/pricing?success=true`}
            failUrl={failUrl || `${window.location.origin}/pricing?fail=true`}
            onSuccess={handleSuccess}
            onFail={handleFail}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F2F0E9] flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#1A1A1A] border-t-transparent rounded-full animate-spin mb-4 mx-auto" />
            <p className="text-gray-500">로딩 중...</p>
          </div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
