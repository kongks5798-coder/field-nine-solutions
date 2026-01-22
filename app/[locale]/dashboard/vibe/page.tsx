/**
 * VIBE-ID Main Page
 * AI 셀피 분석을 통한 여행 스타일 추천 페이지
 * Tesla-Style Design (#F9F9F7, #171717)
 */

'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { SelfieUpload } from '@/components/vibe/selfie-upload';
import { ScanningAnimation } from '@/components/vibe/scanning-animation';
import { VibeResultCard } from '@/components/vibe/vibe-result-card';
import { DestinationGrid } from '@/components/vibe/destination-grid';
import { VibeAnalysis, Destination } from '@/lib/vibe/types';

type VibeStage = 'upload' | 'scanning' | 'result';

export default function VibePage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string || 'ko';

  const [stage, setStage] = useState<VibeStage>('upload');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [analysis, setAnalysis] = useState<VibeAnalysis | null>(null);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = useCallback(async (file: File) => {
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setStage('scanning');
    setProgress(0);
    setError(null);

    // Start progress animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + Math.random() * 15;
      });
    }, 300);

    try {
      // Prepare form data
      const formData = new FormData();
      formData.append('image', file);

      // Call API
      const response = await fetch('/api/vibe/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '분석에 실패했습니다');
      }

      // Complete progress
      clearInterval(progressInterval);
      setProgress(100);

      // Small delay for smooth transition
      setTimeout(() => {
        setAnalysis(data.analysis);
        setDestinations(data.destinations);
        setStage('result');
      }, 500);
    } catch (err) {
      clearInterval(progressInterval);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다');
      setStage('upload');
      setPreviewUrl(null);
    }
  }, []);

  const handleRetry = useCallback(() => {
    setStage('upload');
    setPreviewUrl(null);
    setAnalysis(null);
    setDestinations([]);
    setProgress(0);
    setError(null);
  }, []);

  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#F9F9F7]/80 backdrop-blur-md border-b border-[#171717]/5">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push(`/${locale}/dashboard`)}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm hover:shadow transition-shadow"
          >
            <ArrowLeft className="w-5 h-5 text-[#171717]" />
          </button>

          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#171717]" />
            <span className="text-lg font-bold text-[#171717]">VIBE-ID</span>
          </div>

          <div className="w-10" /> {/* Spacer for center alignment */}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {/* Upload Stage */}
          {stage === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Title */}
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-[#171717] mb-2">
                  당신의 여행 분위기를 찾아드릴게요
                </h1>
                <p className="text-[#171717]/60">
                  AI가 셀피를 분석하여 완벽한 여행지를 추천합니다
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 rounded-2xl bg-red-50 text-red-600 text-sm text-center"
                >
                  {error}
                </motion.div>
              )}

              {/* Upload Component */}
              <SelfieUpload onUpload={handleUpload} />

              {/* Info Cards */}
              <div className="mt-8 space-y-4">
                <div className="p-4 rounded-2xl bg-white border border-[#171717]/5">
                  <h3 className="font-semibold text-[#171717] mb-1">🔒 안전한 분석</h3>
                  <p className="text-sm text-[#171717]/60">
                    사진은 분석 후 즉시 삭제되며 저장되지 않습니다
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-[#171717]/5">
                  <h3 className="font-semibold text-[#171717] mb-1">✨ AI 분석</h3>
                  <p className="text-sm text-[#171717]/60">
                    GPT-4o Vision이 스타일, 분위기, 색상 등을 종합 분석합니다
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Scanning Stage */}
          {stage === 'scanning' && previewUrl && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <ScanningAnimation imageUrl={previewUrl} progress={progress} />
            </motion.div>
          )}

          {/* Result Stage */}
          {stage === 'result' && analysis && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-12"
            >
              {/* Result Card */}
              <VibeResultCard analysis={analysis} onRetry={handleRetry} />

              {/* Destination Recommendations */}
              {destinations.length > 0 && (
                <DestinationGrid
                  destinations={destinations}
                  vibeType={analysis.primary}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Safe Area */}
      <div className="h-20" />
    </div>
  );
}
