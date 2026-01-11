'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';

type PlanType = {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlight?: boolean;
};

function PricingContent() {
  const searchParams = useSearchParams();
  const selectedPlanParam = searchParams.get('plan') || 'premium';
  const [selectedPlan, setSelectedPlan] = useState(selectedPlanParam);
  const [isLoading, setIsLoading] = useState(false);

  // 결제 성공/실패 처리
  useEffect(() => {
    const success = searchParams.get('success');
    const fail = searchParams.get('fail');
    
    if (success === 'true') {
      alert('결제가 완료되었습니다! 구독이 활성화되었습니다.');
      window.location.href = '/dashboard';
    } else if (fail === 'true') {
      alert('결제에 실패했습니다. 다시 시도해주세요.');
    }
  }, [searchParams]);

  const plans: Record<string, PlanType> = {
    free: {
      name: '무료',
      price: '₩0',
      description: '체험용 플랜',
      features: [
        '기본 대시보드',
        '일일 데이터 동기화',
        '최대 1개 플랫폼 연동',
        '이메일 지원',
      ],
    },
    premium: {
      name: '프리미엄',
      price: '₩99,000/월',
      description: '개인 및 소규모 비즈니스',
      features: [
        '매월 ₩99,000 사용 크레딧 제공',
        '월별 한도액을 초과하여 추가 크레딧을 구매하세요',
        '무제한 프로젝트',
        '실시간 데이터 동기화',
        '최대 3개 플랫폼 연동',
        '고급 대시보드 & 리포트',
      ],
      highlight: true,
    },
    team: {
      name: '팀',
      price: '₩299,000/월',
      description: '팀 협업을 위한 플랜',
      features: [
        '매월 ₩299,000 사용 크레딧 제공',
        '무제한 플랫폼 연동',
        '팀 멤버 최대 25명',
        '공유 프로젝트',
        '고급 권한 관리',
        '우선 지원',
      ],
    },
    business: {
      name: '사업',
      price: '₩799,000/월',
      description: '성장하는 비즈니스를 위한 플랜',
      features: [
        '매월 ₩799,000 사용 크레딧 제공',
        '무제한 플랫폼 연동',
        '팀 멤버 무제한',
        '전용 인스턴스',
        '커스텀 통합',
        '전담 CSM',
        'SLA 보장',
      ],
    },
    enterprise: {
      name: '기업',
      price: '맞춤형',
      description: '대규모 기업을 위한 솔루션',
      features: [
        '모든 사업 플랜 기능',
        '전용 클라우드 인스턴스',
        '커스텀 개발 지원',
        '전담 기술 지원팀',
        '맞춤형 SLA',
        '온프레미스 옵션',
      ],
    },
  };

  const currentPlan = plans[selectedPlan] || plans.premium;
  const isFreePlan = selectedPlan === 'free';

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <nav className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/">
              <Button variant="ghost" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                돌아가기
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-16">
        {/* Main Card */}
        <Card className="border-2 border-border shadow-lg">
          <CardContent className="p-8 lg:p-12">
            {/* Heading */}
            <div className="mb-8">
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                더 많은 데이터를 매일 분석하려면 요금제를 업그레이드하세요
              </h1>
              <p className="text-base text-muted-foreground leading-relaxed">
                현재 무료 플랜을 사용 중입니다. 월별 크레딧 한도가 적용되는 플랜으로 업그레이드하거나 새 플랜을 신청하세요.
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-1 mb-8 pb-4 border-b border-border overflow-x-auto">
              {Object.keys(plans).map((planKey) => {
                const plan = plans[planKey];
                const isActive = selectedPlan === planKey;
                return (
                  <button
                    key={planKey}
                    onClick={() => setSelectedPlan(planKey)}
                    className={`px-6 py-3 text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                      isActive
                        ? 'text-foreground border-b-2 border-foreground pb-3 -mb-[1px]'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {plan.name}
                  </button>
                );
              })}
            </div>

            {/* Plan Details */}
            <div className="mb-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Field Nine {currentPlan.name}
                </h2>
                <div className="text-3xl font-bold text-foreground mb-4">
                  {currentPlan.price}
                </div>
                {currentPlan.description && (
                  <p className="text-sm text-muted-foreground">{currentPlan.description}</p>
                )}
              </div>

              {/* Features List */}
              <ul className="space-y-4 mb-8">
                {currentPlan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-foreground flex-shrink-0 mt-0.5" />
                    <span className="text-base text-foreground leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Upgrade Button */}
              <Button
                className={`w-full text-base py-6 h-auto ${
                  currentPlan.highlight ? 'bg-foreground text-background hover:bg-foreground/90' : ''
                }`}
                size="lg"
                variant={currentPlan.highlight ? 'default' : 'outline'}
                onClick={async () => {
                  if (currentPlan.name === '기업') {
                    window.location.href = 'mailto:sales@fieldnine.io?subject=Enterprise 플랜 문의';
                    return;
                  }

                  try {
                    setIsLoading(true);
                    
                    // 가격 파싱 (₩99,000/월 형식에서 숫자 추출)
                    const priceMatch = currentPlan.price.match(/[\d,]+/);
                    const amount = priceMatch 
                      ? parseInt(priceMatch[0].replace(/,/g, ''), 10)
                      : 0;

                    if (amount === 0 && currentPlan.name !== '무료') {
                      alert('유효하지 않은 가격입니다.');
                      setIsLoading(false);
                      return;
                    }

                    // 결제 API 호출
                    const response = await fetch('/api/payments/create', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        planId: selectedPlan,
                        planName: currentPlan.name,
                        amount: amount,
                        billingCycle: 'monthly', // TODO: 월간/연간 토글 추가
                        successUrl: `${window.location.origin}/pricing?success=true&plan=${selectedPlan}`,
                        failUrl: `${window.location.origin}/pricing?fail=true`,
                      }),
                    });

                    const data = await response.json();

                    if (!data.success) {
                      alert(data.error || '결제 요청 생성에 실패했습니다.');
                      setIsLoading(false);
                      return;
                    }

                    // Toss Payments Widget으로 결제 진행
                    if (data.orderId && data.clientKey) {
                      // 결제 모달 표시 또는 결제 페이지로 이동
                      // 실제로는 결제 모달을 표시하거나 별도 결제 페이지로 이동
                      // 여기서는 간단히 결제 페이지로 이동
                      const paymentUrl = `/payments/checkout?orderId=${data.orderId}&clientKey=${encodeURIComponent(data.clientKey)}&amount=${data.amount}&orderName=${encodeURIComponent(data.orderName || '')}&customerEmail=${encodeURIComponent(data.customerEmail || '')}&customerName=${encodeURIComponent(data.customerName || '')}&successUrl=${encodeURIComponent(data.successUrl || '')}&failUrl=${encodeURIComponent(data.failUrl || '')}`;
                      window.location.href = paymentUrl;
                    } else {
                      alert('결제 정보를 받지 못했습니다.');
                      setIsLoading(false);
                    }
                  } catch (error) {
                    console.error('[Pricing] 결제 오류:', error);
                    alert('결제 처리 중 오류가 발생했습니다.');
                    setIsLoading(false);
                  }
                }}
              >
                Field Nine {currentPlan.name}으로 업그레이드하세요
              </Button>
            </div>

            {/* Pricing Page Link */}
            <div className="pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground text-center">
                저희 사이트에서 요금제와 옵션을 비교해 보세요.{' '}
                <Link href="/#pricing" className="text-foreground hover:underline inline-flex items-center gap-1">
                  가격 페이지
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Comparison Cards (Right Side - Optional) */}
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          {['team', 'business'].map((planKey) => {
            const plan = plans[planKey];
            if (!plan) return null;
            return (
              <Card key={planKey} className="border border-border hover:border-foreground/20 transition-all">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      {plan.name}
                    </h3>
                    <div className="text-2xl font-bold text-foreground mb-2">
                      {plan.price}
                    </div>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                  <ul className="space-y-2 mb-4">
                    {plan.features.slice(0, 3).map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-foreground flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setSelectedPlan(planKey)}
                  >
                    자세히 보기
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    }>
      <PricingContent />
    </Suspense>
  );
}
