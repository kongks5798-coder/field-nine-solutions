'use client';

import { useState, useEffect } from 'react';
import { Search, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAnalysisStore } from '@/store';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * SearchBar Component - 해시태그 검색 입력
 * 
 * 비즈니스 목적:
 * - 사용자가 인스타그램/틱톡 해시태그를 입력하는 주요 진입점
 * - 분석 시작 버튼으로 즉시 액션 가능 (Conversion 최대화)
 * - Tesla Style 엄격 준수 (4px border radius)
 */
export default function SearchBar() {
  const [inputValue, setInputValue] = useState('');
  const [limitError, setLimitError] = useState<string | null>(null);
  const { startAnalysis, isAnalyzing } = useAnalysisStore();

  // 사용량 제한 확인
  useEffect(() => {
    const checkLimit = async () => {
      try {
        const response = await fetch('/api/subscription/check-limit');
        if (!response.ok) return;
        
        const data = await response.json();
        if (!data.allowed) {
          setLimitError(data.reason || '월간 분석 한도를 초과했습니다.');
        } else {
          setLimitError(null);
        }
      } catch (error) {
        // 에러는 무시 (비인증 사용자 등)
      }
    };

    checkLimit();
  }, []);

  const handleSearch = async () => {
    if (!inputValue.trim() || isAnalyzing) return;
    
    // 사용량 제한 확인
    try {
      const response = await fetch('/api/subscription/check-limit');
      if (response.ok) {
        const data = await response.json();
        if (!data.allowed) {
          setLimitError(data.reason || '월간 분석 한도를 초과했습니다.');
          return;
        }
      }
    } catch (error) {
      // 비인증 사용자는 제한 없이 진행
    }
    
    // 해시태그 정규화 (# 제거 후 추가)
    const normalizedHashtag = inputValue.trim().startsWith('#')
      ? inputValue.trim()
      : `#${inputValue.trim()}`;
    
    setLimitError(null);
    startAnalysis(normalizedHashtag);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isAnalyzing) {
      handleSearch();
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold text-[#171717]">Trend Analysis</h1>
      
      {limitError && (
        <Alert className="bg-red-50 border-red-200" style={{ borderRadius: '4px' }}>
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            {limitError}
            <a href="/pricing" className="ml-2 underline font-semibold">
              플랜 업그레이드 →
            </a>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search 
            className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#171717]/40 pointer-events-none" 
          />
          <Input
            type="text"
            placeholder="인스타그램 해시태그 입력 (예: #OOTD, #fashion)"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isAnalyzing}
            className="pl-12 h-12 bg-white border-[#E5E5E5] text-[#171717] placeholder:text-[#171717]/40 focus-visible:ring-[#C0392B]"
            style={{ borderRadius: '4px' }} // 명세서: 최대 4px
          />
        </div>
        <Button
          onClick={handleSearch}
          disabled={isAnalyzing || !inputValue.trim()}
          className="bg-[#C0392B] hover:bg-[#A93226] text-white px-8 h-12 transition-colors"
          style={{ borderRadius: '4px' }} // 명세서: 최대 4px
        >
          {isAnalyzing ? '분석 중...' : '분석 시작'}
        </Button>
      </div>
    </div>
  );
}
