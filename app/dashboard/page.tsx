'use client';

import { useEffect } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import SearchBar from '@/components/dashboard/SearchBar';
import AnalysisResults from '@/components/dashboard/AnalysisResults';
import AnalysisHistory from '@/components/dashboard/AnalysisHistory';
import SubscriptionStatus from '@/components/dashboard/SubscriptionStatus';
import { useAnalysisStore } from '@/store';

/**
 * Dashboard Page - 트렌드 분석 메인 페이지
 * 
 * 비즈니스 목적:
 * - 사용자의 핵심 작업 공간 (해시태그 분석)
 * - 실시간 분석 결과로 즉시 액션 가능한 인사이트 제공
 * - Tesla Style 엄격 준수로 전문성과 신뢰감 전달
 */
export default function DashboardPage() {
  const { currentResult, setResult, addToHistory, isAnalyzing, currentHashtag } = useAnalysisStore();

  // Python 백엔드 API 호출
  useEffect(() => {
    if (isAnalyzing && currentHashtag) {
      const analyzeHashtag = async () => {
        try {
          const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              hashtag: currentHashtag,
              platform: 'instagram',
              max_posts: 100,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            console.error('Analysis error:', error);
            // TODO: 에러 상태 표시
            return;
          }

          const data = await response.json();
          
          const result = {
            hashtag: data.hashtag || currentHashtag,
            colors: data.colors || [],
            items: data.items || [],
          };
          
          setResult(result);
          
          // 히스토리에 추가 (로컬 상태)
          addToHistory({
            ...result,
            timestamp: Date.now(),
          });

          // Supabase에 저장
          try {
            await fetch('/api/analyze/save', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                hashtag: result.hashtag,
                platform: 'instagram',
                colors: result.colors,
                items: result.items,
                confidence: data.confidence || 0.85,
                analyzed_posts: data.analyzed_posts || 0,
              }),
            });
          } catch (saveError) {
            console.error('Failed to save analysis:', saveError);
            // 저장 실패해도 사용자에게는 결과 표시
          }
        } catch (error) {
          console.error('Failed to analyze:', error);
          // TODO: 에러 상태 표시
        }
      };

      analyzeHashtag();
    }
  }, [isAnalyzing, currentHashtag, setResult, addToHistory]);

  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      <div className="flex">
        <Sidebar />
        
        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <SubscriptionStatus />
            <SearchBar />
            <AnalysisResults />
            <AnalysisHistory />
          </div>
        </main>
      </div>
    </div>
  );
}
