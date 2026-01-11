'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/components/providers/SessionProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, TrendingDown, Sparkles, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface Recommendation {
  id: string;
  product_name: string;
  product_url: string;
  product_image_url: string;
  brand: string;
  current_price: number;
  predicted_price_drop: number;
  discount_percentage: number;
  recommendation_reason: string;
  estimated_savings: number;
  data_sources: string[];
  status: string;
}

export default function ShoppingDashboardPage() {
  const { user, loading } = useSession();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalSavings, setTotalSavings] = useState(0);
  const [todayCount, setTodayCount] = useState(0);

  useEffect(() => {
    if (!loading && user) {
      fetchRecommendations();
    }
  }, [user, loading]);

  const fetchRecommendations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/recommendations/list?status=pending&limit=10');
      const data = await response.json();

      if (data.success) {
        setRecommendations(data.recommendations || []);
        setTotalSavings(data.total_savings || 0);
        setTodayCount(data.recommendations?.length || 0);
      }
    } catch (error) {
      console.error('추천 목록 조회 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateRecommendations = async () => {
    try {
      setIsLoading(true);
      
      // AWS Lambda API 호출 (우선)
      const { getShoppingRecommendation } = await import('@/lib/aws-api');
      const awsResult = await getShoppingRecommendation({
        userId: user?.id,
        query: '오늘의 쇼핑 추천',
      });

      if (awsResult.success && awsResult.recommendation) {
        // AWS API 성공 시 로컬 API로 폴백 (기존 로직 유지)
        const response = await fetch('/api/recommendations/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ limit: 5 }),
        });

        const data = await response.json();

        if (data.success) {
          await fetchRecommendations();
        } else {
          alert('추천 생성에 실패했습니다: ' + data.error);
        }
      } else {
        // AWS API 실패 시 로컬 API 사용
        const response = await fetch('/api/recommendations/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ limit: 5 }),
        });

        const data = await response.json();

        if (data.success) {
          await fetchRecommendations();
        } else {
          alert('추천 생성에 실패했습니다: ' + data.error);
        }
      }
    } catch (error) {
      console.error('추천 생성 오류:', error);
      alert('추천 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <div className="text-[#1A1A1A]">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-[#1A1A1A] mb-2">
              AI 퍼스널 쇼핑 어시스턴트
            </h1>
            <p className="text-[#64748B]">당신만을 위한 맞춤 추천</p>
          </div>
          <Button
            onClick={generateRecommendations}
            disabled={isLoading}
            className="bg-[#000000] text-white hover:bg-[#1A1A1A]"
            size="lg"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            새 추천 받기
          </Button>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white border-[#E5E7EB]">
            <CardHeader>
              <CardTitle className="text-lg text-[#64748B]">오늘 추천</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-[#1A1A1A]">{todayCount}개</div>
            </CardContent>
          </Card>

          <Card className="bg-white border-[#E5E7EB]">
            <CardHeader>
              <CardTitle className="text-lg text-[#64748B]">예상 절약</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-[#1A1A1A]">
                {formatCurrency(totalSavings)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-[#E5E7EB]">
            <CardHeader>
              <CardTitle className="text-lg text-[#64748B]">총 추천</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-[#1A1A1A]">
                {recommendations.length}개
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 추천 목록 */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#1A1A1A]">추천 상품</h2>

          {recommendations.length === 0 ? (
            <Card className="bg-white border-[#E5E7EB] p-12 text-center">
              <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-[#64748B]" />
              <p className="text-[#64748B] mb-4">아직 추천된 상품이 없습니다.</p>
              <Button
                onClick={generateRecommendations}
                className="bg-[#000000] text-white hover:bg-[#1A1A1A]"
              >
                첫 추천 받기
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((rec) => (
                <Card
                  key={rec.id}
                  className="bg-white border-[#E5E7EB] hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="outline" className="text-xs">
                        {rec.brand}
                      </Badge>
                      {rec.estimated_savings > 0 && (
                        <Badge className="bg-green-500 text-white">
                          <TrendingDown className="w-3 h-3 mr-1" />
                          {formatCurrency(rec.estimated_savings)} 절약
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl text-[#1A1A1A]">{rec.product_name}</CardTitle>
                    <CardDescription className="text-[#64748B] mt-2">
                      {rec.recommendation_reason}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-2xl font-bold text-[#1A1A1A]">
                            {formatCurrency(rec.current_price)}
                          </span>
                          {rec.predicted_price_drop < rec.current_price && (
                            <span className="text-sm text-[#64748B] line-through">
                              {formatCurrency(rec.predicted_price_drop)}
                            </span>
                          )}
                        </div>
                        {rec.discount_percentage > 0 && (
                          <Badge variant="destructive" className="mt-1">
                            {rec.discount_percentage}% 할인
                          </Badge>
                        )}
                      </div>

                      {/* 데이터 소스 표시 (Hallucination 방지) */}
                      <div className="pt-2 border-t border-[#E5E7EB]">
                        <p className="text-xs text-[#64748B] mb-1">데이터 소스:</p>
                        <div className="flex flex-wrap gap-1">
                          {rec.data_sources?.map((source, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {source}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          asChild
                          className="flex-1 bg-[#000000] text-white hover:bg-[#1A1A1A]"
                        >
                          <a
                            href={rec.product_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            상품 보기
                          </a>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
