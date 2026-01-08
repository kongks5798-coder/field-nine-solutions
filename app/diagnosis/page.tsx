'use client';

import { useState } from 'react';

export default function DiagnosisPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleDiagnosis = async () => {
    setLoading(true);
    setResult(null); // 초기화

    try {
      // 아까 만든 API 전화기로 전화를 겁니다
      const response = await fetch('/api/diagnose', { method: 'POST' });
      const data = await response.json();

      if (data.success) {
        setResult(data.diagnosis);
      } else {
        setResult(data.message || '처리할 요청이 없거나 에러가 발생했습니다.');
      }
    } catch (error) {
      setResult('통신 중 에러가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
      <h1 className="text-3xl font-bold mb-8 text-blue-400">🤖 Jarvis AI 진단 센터</h1>
      
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl max-w-2xl w-full border border-gray-700">
        <p className="mb-6 text-gray-300 text-center">
          현재 접수된 고객의 고민을 AI가 분석하고 해결책을 DB에 저장합니다.
        </p>

        <div className="flex justify-center mb-8">
          <button
            onClick={handleDiagnosis}
            disabled={loading}
            className={`px-8 py-4 rounded-full font-bold text-lg transition-all ${
              loading
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 hover:scale-105 shadow-lg shadow-blue-500/30'
            }`}
          >
            {loading ? '🧠 AI가 생각 중입니다...' : '⚡ AI 솔루션 실행하기'}
          </button>
        </div>

        {/* 결과 보여주는 화면 */}
        {result && (
          <div className="mt-6 p-6 bg-gray-900 rounded-lg border border-blue-500/30 animate-fade-in-up">
            <h3 className="text-xl font-bold text-green-400 mb-3">💎 AI 진단 리포트</h3>
            <p className="whitespace-pre-wrap leading-relaxed text-gray-200">
              {result}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}