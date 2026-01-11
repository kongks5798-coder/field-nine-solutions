'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface TossPaymentWidgetProps {
  clientKey: string;
  orderId: string;
  orderName: string;
  amount: number;
  customerEmail: string;
  customerName: string;
  successUrl: string;
  failUrl: string;
  onSuccess?: () => void;
  onFail?: (error: any) => void;
}

/**
 * Toss Payments Widget 컴포넌트
 * 
 * Toss Payments SDK를 사용하여 결제 위젯을 초기화하고 결제를 진행합니다.
 */
export default function TossPaymentWidget({
  clientKey,
  orderId,
  orderName,
  amount,
  customerEmail,
  customerName,
  successUrl,
  failUrl,
  onSuccess,
  onFail,
}: TossPaymentWidgetProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const widgetRef = useRef<any>(null);
  const [isWidgetReady, setIsWidgetReady] = useState(false);

  useEffect(() => {
    // Toss Payments SDK 동적 로드
    const loadTossPayments = async () => {
      try {
        // @tosspayments/payment-sdk가 설치되어 있으면 사용
        // 없으면 CDN에서 로드
        if (typeof window !== 'undefined') {
          // CDN에서 Toss Payments SDK 로드
          const script = document.createElement('script');
          script.src = 'https://js.tosspayments.com/v1/payment';
          script.async = true;
          script.onload = () => {
            setIsWidgetReady(true);
          };
          script.onerror = () => {
            setError('Toss Payments SDK를 로드할 수 없습니다.');
          };
          document.head.appendChild(script);
        }
      } catch (err) {
        console.error('[TossPaymentWidget] SDK 로드 오류:', err);
        setError('결제 시스템을 초기화할 수 없습니다.');
      }
    };

    loadTossPayments();
  }, []);

  const handlePayment = async () => {
    if (!isWidgetReady) {
      setError('결제 시스템이 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Toss Payments Widget 초기화
      const TossPayments = (window as any).TossPayments;
      if (!TossPayments) {
        throw new Error('Toss Payments SDK가 로드되지 않았습니다.');
      }

      const widget = TossPayments(clientKey);
      widgetRef.current = widget;

      // 결제 요청
      await widget.requestPayment('카드', {
        amount: amount,
        orderId: orderId,
        orderName: orderName,
        customerEmail: customerEmail,
        customerName: customerName,
        successUrl: successUrl,
        failUrl: failUrl,
        flowMode: 'DEFAULT', // 일반 결제
        easyPay: '토스페이',
      });

      // 성공 시 (리다이렉트되므로 여기까지 오지 않음)
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('[TossPaymentWidget] 결제 오류:', err);
      
      let errorMessage = '결제 처리 중 오류가 발생했습니다.';
      
      if (err.code === 'USER_CANCEL') {
        errorMessage = '결제가 취소되었습니다.';
      } else if (err.code === 'INVALID_CARD') {
        errorMessage = '유효하지 않은 카드 정보입니다.';
      } else if (err.code === 'INSUFFICIENT_FUNDS') {
        errorMessage = '잔액이 부족합니다.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      
      if (onFail) {
        onFail(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">주문번호</span>
          <span className="font-medium">{orderId}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">상품명</span>
          <span className="font-medium">{orderName}</span>
        </div>
        <div className="flex justify-between text-lg font-bold border-t pt-2">
          <span>결제 금액</span>
          <span>{amount.toLocaleString()}원</span>
        </div>
      </div>

      <Button
        onClick={handlePayment}
        disabled={isLoading || !isWidgetReady}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            결제 진행 중...
          </>
        ) : !isWidgetReady ? (
          '결제 시스템 준비 중...'
        ) : (
          <>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {amount.toLocaleString()}원 결제하기
          </>
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        결제는 Toss Payments를 통해 안전하게 처리됩니다.
      </p>
    </div>
  );
}
