'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/components/providers/SessionProvider';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, AlertCircle, RefreshCw, X } from 'lucide-react';
import SidebarLayout from '@/components/layout/SidebarLayout';

interface Subscription {
  id: string;
  plan_id: string;
  plan_name: string;
  billing_cycle: string;
  amount: number;
  status: string;
  activated_at: string | null;
  expires_at: string | null;
  canceled_at: string | null;
  created_at: string;
}

export default function SubscriptionPage() {
  const { user, loading: sessionLoading } = useSession();
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRenewing, setIsRenewing] = useState(false);

  useEffect(() => {
    if (!sessionLoading && !user) {
      router.replace('/login?callbackUrl=/dashboard/subscription');
    }
  }, [user, sessionLoading, router]);

  useEffect(() => {
    if (!user) return;

    const loadSubscriptions = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/subscriptions/list');
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || '구독 목록을 불러올 수 없습니다.');
        }

        setSubscriptions(data.subscriptions || []);
        
        // 활성 구독 찾기
        const active = data.subscriptions?.find((s: Subscription) => s.status === 'active');
        setCurrentSubscription(active || null);
      } catch (err: any) {
        console.error('[Subscription] 로드 오류:', err);
        setError(err.message || '구독 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadSubscriptions();
  }, [user]);

  const handleCancel = async (subscriptionId: string) => {
    if (!confirm('정말 구독을 취소하시겠습니까?')) {
      return;
    }

    try {
      setIsCancelling(true);
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId,
          reason: '사용자 요청',
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '구독 취소에 실패했습니다.');
      }

      // 목록 새로고침
      const listResponse = await fetch('/api/subscriptions/list');
      const listData = await listResponse.json();
      setSubscriptions(listData.subscriptions || []);
      setCurrentSubscription(null);

      alert('구독이 취소되었습니다.');
    } catch (err: any) {
      console.error('[Subscription] 취소 오류:', err);
      alert(err.message || '구독 취소 중 오류가 발생했습니다.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleRenew = async (subscriptionId: string) => {
    try {
      setIsRenewing(true);
      const response = await fetch('/api/subscriptions/renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId,
          autoRenew: true,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '구독 갱신에 실패했습니다.');
      }

      // 목록 새로고침
      const listResponse = await fetch('/api/subscriptions/list');
      const listData = await listResponse.json();
      setSubscriptions(listData.subscriptions || []);
      
      const active = listData.subscriptions?.find((s: Subscription) => s.status === 'active');
      setCurrentSubscription(active || null);

      alert('구독이 갱신되었습니다.');
    } catch (err: any) {
      console.error('[Subscription] 갱신 오류:', err);
      alert(err.message || '구독 갱신 중 오류가 발생했습니다.');
    } finally {
      setIsRenewing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 text-white">활성</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-500 text-white">취소됨</Badge>;
      case 'expired':
        return <Badge className="bg-red-500 text-white">만료됨</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 text-white">대기 중</Badge>;
      case 'failed':
        return <Badge className="bg-red-500 text-white">실패</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (sessionLoading || loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#1A1A1A] border-t-transparent rounded-full animate-spin mb-4 mx-auto" />
            <p className="text-gray-500">로딩 중...</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">구독 관리</h1>
          <p className="text-muted-foreground">구독 정보를 확인하고 관리하세요.</p>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 현재 구독 */}
        {currentSubscription ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">현재 구독</CardTitle>
                  <CardDescription className="mt-1">
                    {currentSubscription.plan_name} 플랜
                  </CardDescription>
                </div>
                {getStatusBadge(currentSubscription.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">결제 주기</p>
                  <p className="font-semibold">
                    {currentSubscription.billing_cycle === 'monthly' ? '월간' : '연간'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">월 결제 금액</p>
                  <p className="font-semibold">
                    {currentSubscription.amount.toLocaleString()}원
                  </p>
                </div>
                {currentSubscription.activated_at && (
                  <div>
                    <p className="text-sm text-muted-foreground">시작일</p>
                    <p className="font-semibold">
                      {new Date(currentSubscription.activated_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                )}
                {currentSubscription.expires_at && (
                  <div>
                    <p className="text-sm text-muted-foreground">만료일</p>
                    <p className="font-semibold">
                      {new Date(currentSubscription.expires_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={() => handleRenew(currentSubscription.id)}
                  disabled={isRenewing}
                  variant="outline"
                >
                  {isRenewing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      갱신 중...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      구독 갱신
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => handleCancel(currentSubscription.id)}
                  disabled={isCancelling}
                  variant="destructive"
                >
                  {isCancelling ? (
                    <>
                      <X className="w-4 h-4 mr-2 animate-spin" />
                      취소 중...
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4 mr-2" />
                      구독 취소
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => router.push('/pricing')}
                  variant="outline"
                >
                  플랜 변경
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">활성 구독이 없습니다</h3>
              <p className="text-muted-foreground mb-6">
                구독 플랜을 선택하여 시작하세요.
              </p>
              <Button onClick={() => router.push('/pricing')}>
                구독 플랜 보기
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 구독 이력 */}
        {subscriptions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>구독 이력</CardTitle>
              <CardDescription>과거 구독 내역을 확인하세요.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {subscriptions.map((subscription) => (
                  <div
                    key={subscription.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold">{subscription.plan_name}</h4>
                        {getStatusBadge(subscription.status)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <span>
                          {subscription.billing_cycle === 'monthly' ? '월간' : '연간'} •{' '}
                          {subscription.amount.toLocaleString()}원
                        </span>
                        {subscription.created_at && (
                          <span className="ml-3">
                            {new Date(subscription.created_at).toLocaleDateString('ko-KR')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </SidebarLayout>
  );
}
