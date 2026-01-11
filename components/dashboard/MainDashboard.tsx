'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/components/providers/SessionProvider';
import { Sparkles, TrendingDown, ShoppingBag, MessageSquare } from 'lucide-react';
import ChatBox from './ChatBox';
import RecommendationCard from './RecommendationCard';
import { getShoppingRecommendation as getShoppingRecommendationFromAWS } from '@/lib/aws-api';
import { getShoppingRecommendation } from '@/services/api';

interface Recommendation {
  id: string;
  product_name: string;
  current_price: number;
  estimated_savings: number;
  recommendation_reason: string;
  data_sources: string[];
}

export default function MainDashboard() {
  const { user, loading } = useSession();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [totalSavings, setTotalSavings] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 초기 추천 로드
    loadRecommendations();
  }, [user]);

  const loadRecommendations = async () => {
    try {
      setIsLoading(true);
      // 임시 mock 데이터
      const mockRecommendations: Recommendation[] = [
        {
          id: '1',
          product_name: '나이키 에어맥스 270',
          current_price: 150000,
          estimated_savings: 30000,
          recommendation_reason: '이 운동화는 현재 150,000원에 판매 중이며, 3일 후 20% 세일 예정입니다. 예상 절약: 30,000원',
          data_sources: ['가격 예측 모델', 'OpenAI 추천 엔진'],
        },
        {
          id: '2',
          product_name: '아디다스 울트라부스트 22',
          current_price: 180000,
          estimated_savings: 25000,
          recommendation_reason: '프리미엄 러닝화로 발목 보호에 탁월합니다. 다음 주 할인 예정입니다.',
          data_sources: ['가격 예측 모델', 'OpenAI 추천 엔진'],
        },
        {
          id: '3',
          product_name: '컨버스 척 테일러 올스타',
          current_price: 80000,
          estimated_savings: 15000,
          recommendation_reason: '클래식한 디자인으로 데일리로 착용하기 좋습니다. 현재 최저가입니다.',
          data_sources: ['가격 예측 모델', 'OpenAI 추천 엔진'],
        },
      ];

      setRecommendations(mockRecommendations);
      setTotalSavings(mockRecommendations.reduce((sum, r) => sum + r.estimated_savings, 0));
    } catch (error) {
      console.error('추천 로드 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatSubmit = async (message: string) => {
    try {
      setIsLoading(true);
      
      // API 호출 (Mock 포함)
      const result = await getShoppingRecommendation(message, user?.id);

      if (result.success && result.recommendation) {
        // 성공 시 추천 업데이트
        alert(result.recommendation);
        await loadRecommendations();
      } else {
        // 실패 시 기본 메시지
        alert('AI 응답을 생성할 수 없습니다. 잠시 후 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('채팅 오류:', error);
      alert('AI 응답 생성 중 오류가 발생했습니다.');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory-bg flex items-center justify-center">
        <div className="text-tesla-black text-xl">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory-bg flex flex-col items-center p-6 font-sans">
      {/* 헤더 */}
      <div className="w-full max-w-6xl mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-tesla-black mb-2 text-center">
          Field Nine AI
        </h1>
        <p className="text-lg text-gray-600 text-center">
          당신의 쇼핑 & 데일리 파트너
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="w-full max-w-6xl mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-lg text-gray-700 mb-2">오늘 예상 절약</p>
              <p className="text-4xl font-bold text-green-600">
                {formatCurrency(totalSavings)}
              </p>
            </div>
            <div className="bg-ivory-bg rounded-full p-4">
              <TrendingDown className="w-8 h-8 text-green-600" />
            </div>
          </div>

          {/* 추천 상품 그리드 */}
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">추천을 생성하는 중...</div>
          ) : recommendations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recommendations.map((rec) => (
                <RecommendationCard key={rec.id} recommendation={rec} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>아직 추천된 상품이 없습니다.</p>
            </div>
          )}
        </div>
      </div>

      {/* 채팅 입력 박스 */}
      <div className="w-full max-w-6xl">
        <ChatBox onSubmit={handleChatSubmit} isLoading={isLoading} />
      </div>
    </div>
  );
}
