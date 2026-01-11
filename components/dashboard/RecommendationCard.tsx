'use client';

import { TrendingDown, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Recommendation {
  id: string;
  product_name: string;
  current_price: number;
  estimated_savings: number;
  recommendation_reason: string;
  data_sources: string[];
}

interface RecommendationCardProps {
  recommendation: Recommendation;
}

export default function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  };

  return (
    <div className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow border border-gray-100">
      {/* 상품명 */}
      <h3 className="text-lg font-bold text-tesla-black mb-3 line-clamp-2">
        {recommendation.product_name}
      </h3>

      {/* 가격 정보 */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-2xl font-bold text-tesla-black">
            {formatCurrency(recommendation.current_price)}
          </span>
          {recommendation.estimated_savings > 0 && (
            <Badge className="bg-green-500 text-white">
              <TrendingDown className="w-3 h-3 mr-1" />
              {formatCurrency(recommendation.estimated_savings)} 절약
            </Badge>
          )}
        </div>
      </div>

      {/* 추천 이유 */}
      <p className="text-sm text-gray-700 mb-4 line-clamp-3">
        {recommendation.recommendation_reason}
      </p>

      {/* 데이터 소스 (Hallucination 방지) */}
      <div className="pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 mb-2">데이터 소스:</p>
        <div className="flex flex-wrap gap-1">
          {recommendation.data_sources?.map((source, idx) => (
            <Badge key={idx} variant="outline" className="text-xs">
              {source}
            </Badge>
          ))}
        </div>
      </div>

      {/* 액션 버튼 */}
      <button className="mt-4 w-full bg-tesla-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
        <ExternalLink className="w-4 h-4" />
        상품 보기
      </button>
    </div>
  );
}
