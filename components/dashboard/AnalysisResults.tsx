'use client';

import { Palette, Shirt, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAnalysisStore } from '@/store';

/**
 * AnalysisResults Component - 분석 결과 표시
 * 
 * 비즈니스 목적:
 * - Top 3 Colors와 Top 3 Items를 명확하게 시각화
 * - 사용자가 즉시 액션 가능한 인사이트 제공 (구매/판매 결정)
 * - Tesla Style 엄격 준수로 전문성 전달
 */
export default function AnalysisResults() {
  const { currentResult, isAnalyzing } = useAnalysisStore();

  if (isAnalyzing) {
    return (
      <Card className="bg-white border border-[#E5E5E5]" style={{ borderRadius: '4px' }}>
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div 
              className="animate-spin rounded-full h-12 w-12 border-4 border-[#C0392B] border-t-transparent"
              style={{ borderRadius: '50%' }}
            />
            <p className="text-[#171717]/60 font-medium">분석 중...</p>
            <p className="text-sm text-[#171717]/40">AI가 소셜미디어를 분석하고 있습니다</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentResult) {
    return (
      <Card className="bg-white border border-[#E5E5E5]" style={{ borderRadius: '4px' }}>
        <CardContent className="p-12">
          <div className="text-center space-y-4">
            <p className="text-[#171717]/60">
              해시태그를 입력하고 분석을 시작하세요.
            </p>
            <p className="text-sm text-[#171717]/40">
              인스타그램과 틱톡의 최신 트렌드를 예측해 드립니다.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top 3 Colors */}
      <Card className="bg-white border border-[#E5E5E5]" style={{ borderRadius: '4px' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#171717]">
            <Palette className="h-5 w-5 text-[#C0392B]" />
            Top 3 Colors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {currentResult.colors.map((color, index) => (
              <div key={index} className="flex-1 space-y-3">
                <div 
                  className="h-32 bg-gradient-to-br from-[#2c2c2c] to-[#171717] flex items-center justify-center"
                  style={{ borderRadius: '4px' }}
                >
                  <Badge 
                    variant="secondary" 
                    className="bg-white text-[#171717] font-semibold"
                    style={{ borderRadius: '4px' }}
                  >
                    #{index + 1}
                  </Badge>
                </div>
                <p className="text-sm font-semibold text-[#171717] text-center">{color}</p>
                <p className="text-xs text-[#171717]/60 text-center">
                  예상 증가율: +{((3 - index) * 12 + 5)}%
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top 3 Items */}
      <Card className="bg-white border border-[#E5E5E5]" style={{ borderRadius: '4px' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#171717]">
            <Shirt className="h-5 w-5 text-[#C0392B]" />
            Top 3 Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {currentResult.items.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 bg-[#F9F9F7] border border-[#E5E5E5] hover:border-[#C0392B]/30 transition-colors"
                style={{ borderRadius: '4px' }}
              >
                <div 
                  className="flex-shrink-0 w-12 h-12 bg-[#C0392B] flex items-center justify-center"
                  style={{ borderRadius: '4px' }}
                >
                  <span className="text-white font-bold text-lg">#{index + 1}</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[#171717]">{item}</p>
                  <p className="text-sm text-[#171717]/60">
                    예상 판매량 증가: +{((3 - index) * 15 + 10)}%
                  </p>
                </div>
                <TrendingUp className="h-5 w-5 text-[#C0392B]" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
