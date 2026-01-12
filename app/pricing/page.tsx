'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/**
 * Pricing Page - 구독 플랜 및 가격 안내
 * 
 * 비즈니스 목적:
 * - 구독 플랜 비교 및 선택
 * - 플랜별 기능 명시
 * - 결제 전환율 최대화
 * - Tesla Style 엄격 준수
 */
export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      id: 'free',
      name: 'Free',
      description: '개인 사용자를 위한 기본 플랜',
      price_monthly: 0,
      price_yearly: 0,
      max_analyses: 10,
      features: [
        '월 10회 분석',
        '최근 10개 히스토리',
        '기본 트렌드 예측',
        '이메일 지원',
      ],
      popular: false,
    },
    {
      id: 'pro',
      name: 'Pro',
      description: '1인 셀러 및 소상공인을 위한 플랜',
      price_monthly: 29,
      price_yearly: 290,
      max_analyses: 100,
      features: [
        '월 100회 분석',
        '전체 히스토리 조회',
        '고급 트렌드 예측',
        '우선 지원',
        '이메일 리포트',
      ],
      popular: true,
    },
    {
      id: 'business',
      name: 'Business',
      description: '동대문 도매/소매업자를 위한 플랜',
      price_monthly: 99,
      price_yearly: 990,
      max_analyses: 1000,
      features: [
        '월 1,000회 분석',
        'API 접근',
        '커스텀 리포트',
        '전담 지원',
        '우선 처리',
      ],
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <h1 className="text-5xl md:text-6xl font-semibold text-[#171717]">
            가격 정책
          </h1>
          <p className="text-xl text-[#171717]/60 max-w-2xl mx-auto">
            당신의 비즈니스에 맞는 플랜을 선택하세요
          </p>

          {/* Billing Cycle Toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                billingCycle === 'monthly'
                  ? 'text-[#171717] border-b-2 border-[#C0392B]'
                  : 'text-[#171717]/60'
              }`}
            >
              월간
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                billingCycle === 'yearly'
                  ? 'text-[#171717] border-b-2 border-[#C0392B]'
                  : 'text-[#171717]/60'
              }`}
            >
              연간
              <Badge className="ml-2 bg-[#C0392B] text-white text-xs" style={{ borderRadius: '4px' }}>
                20% 할인
              </Badge>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
            const monthlyEquivalent = billingCycle === 'yearly' ? Math.round(price / 12) : price;

            return (
              <Card
                key={plan.id}
                className={`bg-white border ${
                  plan.popular
                    ? 'border-[#C0392B] shadow-lg scale-105'
                    : 'border-[#E5E5E5]'
                }`}
                style={{ borderRadius: '4px' }}
              >
                {plan.popular && (
                  <div className="bg-[#C0392B] text-white text-center py-2 text-sm font-medium" style={{ borderRadius: '4px 4px 0 0' }}>
                    인기 플랜
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl font-semibold text-[#171717]">
                    {plan.name}
                  </CardTitle>
                  <CardDescription className="text-[#171717]/60">
                    {plan.description}
                  </CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-[#171717]">
                      ${billingCycle === 'yearly' ? monthlyEquivalent : price}
                    </span>
                    <span className="text-[#171717]/60 ml-2">
                      /{billingCycle === 'yearly' ? '월' : '월'}
                    </span>
                    {billingCycle === 'yearly' && (
                      <p className="text-sm text-[#171717]/60 mt-1">
                        연간 ${price} 결제
                      </p>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-[#171717]">
                      월 {plan.max_analyses.toLocaleString()}회 분석
                    </p>
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-[#C0392B] flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-[#171717]/80">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Link href={plan.id === 'free' ? '/dashboard' : '/dashboard'}>
                    <Button
                      className={`w-full ${
                        plan.popular
                          ? 'bg-[#C0392B] hover:bg-[#A93226] text-white'
                          : 'border border-[#E5E5E5] text-[#171717] hover:bg-[#F9F9F7]'
                      }`}
                      style={{ borderRadius: '4px' }}
                    >
                      {plan.id === 'free' ? '무료로 시작' : '플랜 선택'}
                      {plan.id !== 'free' && (
                        <ArrowRight className="ml-2 h-4 w-4" />
                      )}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
