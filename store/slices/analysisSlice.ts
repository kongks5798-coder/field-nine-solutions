import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Analysis Store - 트렌드 분석 상태 관리
 * 
 * 비즈니스 목적:
 * - 사용자의 분석 요청과 결과를 전역 상태로 관리
 * - 실시간 분석 진행 상태 추적
 * - 분석 히스토리 저장으로 사용자 경험 향상
 */
interface AnalysisResult {
  colors: string[];
  items: string[];
  hashtag: string;
  timestamp: number;
}

interface AnalysisState {
  // 현재 분석 상태
  isAnalyzing: boolean;
  currentHashtag: string | null;
  
  // 분석 결과
  currentResult: AnalysisResult | null;
  
  // 분석 히스토리
  history: AnalysisResult[];
  
  // Actions
  startAnalysis: (hashtag: string) => void;
  setResult: (result: Omit<AnalysisResult, 'timestamp'>) => void;
  resetAnalysis: () => void;
  addToHistory: (result: AnalysisResult) => void;
}

export const useAnalysisStore = create<AnalysisState>()(
  devtools(
    (set) => ({
      // Initial State
      isAnalyzing: false,
      currentHashtag: null,
      currentResult: null,
      history: [],

      // Start Analysis - 분석 시작 시 호출
      startAnalysis: (hashtag: string) =>
        set({
          isAnalyzing: true,
          currentHashtag: hashtag,
          currentResult: null,
        }),

      // Set Result - 분석 결과 설정
      setResult: (result) =>
        set({
          isAnalyzing: false,
          currentResult: {
            ...result,
            hashtag: result.hashtag,
            timestamp: Date.now(),
          },
        }),

      // Reset Analysis - 분석 상태 초기화
      resetAnalysis: () =>
        set({
          isAnalyzing: false,
          currentHashtag: null,
          currentResult: null,
        }),

      // Add To History - 분석 결과를 히스토리에 추가
      addToHistory: (result) =>
        set((state) => ({
          history: [result, ...state.history].slice(0, 50), // 최근 50개만 유지
        })),
    }),
    { name: 'AnalysisStore' }
  )
);
