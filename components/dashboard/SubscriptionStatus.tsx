'use client';

import { useEffect, useState } from 'react';
import { Crown, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

/**
 * SubscriptionStatus Component - 구독 상태 표시
 * 
 * 비즈니스 목적:
 * - 현재 구독 플랜 표시
 * - 사용량 정보 제공
 * - 플랜 업그레이드 유도
 */
interface SubscriptionData {
  subscription: {
    plan_id: string;
    status: string;
  };
  usage: {
    current_count: number;
    limit: number;
    period_start: string;
    period_end: string;
  };
}

export default function SubscriptionStatus() {
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/subscription/current');
      if (!response.ok) return;
      
      const subscriptionData = await response.json();
      setData(subscriptionData);
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return null;
  }

  if (!data) {
    return null;
  }

  const { subscription, usage } = data;
  const usagePercent = (usage.current_count / usage.limit) * 100;
  const isNearLimit = usagePercent >= 80;
  const isAtLimit = usage.current_count >= usage.limit;

  const planNames: Record<string, string> = {
    free: 'Free',
    pro: 'Pro',
    business: 'Business',
  };

  return (
    <Card className="bg-white border border-[#E5E5E5]" style={{ borderRadius: '4px' }}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-[#171717]">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-[#C0392B]" />
            <span>구독 상태</span>
          </div>
          <Badge 
            variant={subscription.plan_id === 'free' ? 'secondary' : 'default'}
            className={subscription.plan_id !== 'free' ? 'bg-[#C0392B] text-white' : ''}
            style={{ borderRadius: '4px' }}
          >
            {planNames[subscription.plan_id] || 'Free'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 사용량 표시 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#171717]/60">이번 달 분석</span>
            <span className="font-semibold text-[#171717]">
              {usage.current_count} / {usage.limit}
            </span>
          </div>
          <div className="w-full bg-[#F9F9F7] rounded-sm h-2" style={{ borderRadius: '4px' }}>
            <div
              className={`h-2 rounded-sm transition-all ${
                isAtLimit ? 'bg-[#C0392B]' : isNearLimit ? 'bg-yellow-500' : 'bg-[#C0392B]'
              }`}
              style={{
                width: `${Math.min(usagePercent, 100)}%`,
                borderRadius: '4px',
              }}
            />
          </div>
          {isAtLimit && (
            <div className="flex items-center gap-2 text-sm text-[#C0392B]">
              <AlertCircle className="h-4 w-4" />
              <span>월간 분석 한도에 도달했습니다.</span>
            </div>
          )}
          {isNearLimit && !isAtLimit && (
            <div className="flex items-center gap-2 text-sm text-yellow-600">
              <AlertCircle className="h-4 w-4" />
              <span>월간 분석 한도에 근접했습니다.</span>
            </div>
          )}
        </div>

        {/* 플랜 업그레이드 버튼 */}
        {subscription.plan_id === 'free' && (
          <Link href="/pricing">
            <Button
              className="w-full bg-[#C0392B] hover:bg-[#A93226] text-white"
              style={{ borderRadius: '4px' }}
            >
              플랜 업그레이드
            </Button>
          </Link>
        )}

        {subscription.plan_id !== 'free' && (
          <div className="flex items-center gap-2 text-sm text-[#171717]/60">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span>프리미엄 플랜 활성화됨</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
