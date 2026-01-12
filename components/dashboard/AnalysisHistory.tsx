'use client';

import { useEffect, useState } from 'react';
import { History, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * AnalysisHistory Component - 분석 히스토리 표시
 * 
 * 비즈니스 목적:
 * - 사용자의 과거 분석 결과를 한눈에 조회
 * - 트렌드 변화 추적 가능
 * - 재분석 기능 제공
 */
interface HistoryItem {
  id: string;
  hashtag: string;
  platform: string;
  top_colors: string[];
  top_items: string[];
  confidence: number;
  created_at: string;
}

export default function AnalysisHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/analyze/history?limit=10');
      if (!response.ok) return;
      
      const data = await response.json();
      setHistory(data.history || []);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white border border-[#E5E5E5]" style={{ borderRadius: '4px' }}>
        <CardContent className="p-8">
          <div className="text-center text-[#171717]/60">로딩 중...</div>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card className="bg-white border border-[#E5E5E5]" style={{ borderRadius: '4px' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#171717]">
            <History className="h-5 w-5" />
            분석 히스토리
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[#171717]/60 text-center py-8">
            아직 분석 기록이 없습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border border-[#E5E5E5]" style={{ borderRadius: '4px' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[#171717]">
          <History className="h-5 w-5" />
          분석 히스토리
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-[#F9F9F7] border border-[#E5E5E5] hover:border-[#C0392B]/30 transition-colors"
              style={{ borderRadius: '4px' }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-[#171717]">{item.hashtag}</span>
                    <Badge variant="secondary" className="text-xs">
                      {item.platform}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[#171717]/60">
                    <Calendar className="h-3 w-3" />
                    {new Date(item.created_at).toLocaleDateString('ko-KR')}
                  </div>
                </div>
                <span className="text-xs text-[#171717]/60">
                  신뢰도: {(item.confidence * 100).toFixed(0)}%
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <p className="text-xs text-[#171717]/60 mb-1">인기 색상</p>
                  <div className="flex gap-1 flex-wrap">
                    {item.top_colors.slice(0, 3).map((color, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-0.5 bg-white border border-[#E5E5E5] text-[#171717]"
                        style={{ borderRadius: '4px' }}
                      >
                        {color}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-[#171717]/60 mb-1">인기 아이템</p>
                  <div className="flex gap-1 flex-wrap">
                    {item.top_items.slice(0, 3).map((item_name, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-0.5 bg-white border border-[#E5E5E5] text-[#171717]"
                        style={{ borderRadius: '4px' }}
                      >
                        {item_name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
