/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 57: VIBE-ID VIRAL CARD COMPLETE COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Full-featured VIBE-ID + Referral viral card generator
 * - Selfie upload → Analysis → Aura Card generation
 * - Auto-embedded referral code & QR
 * - Native Share API for Instagram/X
 * - Tesla-style UI: #F9F9F7 background, #171717 text
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Sparkles, Share2, Download, RefreshCw } from 'lucide-react';
import { VibeAnalysis, VIBE_LABELS, VibeArchetype } from '@/lib/vibe/types';
import { VibeAuraCard, VibeAuraGenerator, VibeAuraCardData, CardFormat } from '@/lib/referral/social-proof-card';

// ============================================
// Types
// ============================================

type Step = 'upload' | 'scanning' | 'result';

interface VibeViralCardProps {
  userId: string;
  sovereignNumber: number;
  referralCode: string;
  initialAnalysis?: VibeAnalysis;
}

// ============================================
// Main Component
// ============================================

export function VibeViralCard({
  userId,
  sovereignNumber,
  referralCode,
  initialAnalysis,
}: VibeViralCardProps) {
  const [step, setStep] = useState<Step>(initialAnalysis ? 'result' : 'upload');
  const [analysis, setAnalysis] = useState<VibeAnalysis | null>(initialAnalysis || null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============================================
  // Image Upload & Analysis
  // ============================================

  const handleImageSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setError(null);
    setIsAnalyzing(true);
    setStep('scanning');

    try {
      // Convert to base64
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Call VIBE-ID analysis API
      const response = await fetch('/api/vibe/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 }),
      });

      const data = await response.json();

      if (!data.success || !data.analysis) {
        throw new Error(data.error || 'Analysis failed');
      }

      setAnalysis(data.analysis);

      // Save analysis to database
      await fetch('/api/vibe/viral-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save-analysis',
          analysis: data.analysis,
        }),
      });

      setStep('result');
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
      setStep('upload');
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const handleRetry = useCallback(() => {
    setAnalysis(null);
    setStep('upload');
    setError(null);
  }, []);

  const handleShare = useCallback(async () => {
    // Track share event
    await fetch('/api/vibe/viral-card', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'track-share',
        platform: 'native',
      }),
    });
  }, []);

  // ============================================
  // Build Card Data
  // ============================================

  const cardData: VibeAuraCardData | null = analysis
    ? {
        userId,
        sovereignNumber,
        referralCode,
        analysis,
      }
    : null;

  // ============================================
  // Render
  // ============================================

  return (
    <div className="min-h-screen bg-[#F9F9F7] text-[#171717]">
      <AnimatePresence mode="wait">
        {/* Upload Step */}
        {step === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center min-h-screen p-6"
          >
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4">VIBE-ID</h1>
              <p className="text-lg text-[#171717]/60">
                Discover your unique travel aura
              </p>
            </div>

            {/* Upload Area */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => fileInputRef.current?.click()}
              className="w-full max-w-md aspect-square bg-white rounded-3xl border-2 border-dashed border-[#171717]/20 flex flex-col items-center justify-center gap-6 cursor-pointer hover:border-[#171717]/40 transition-all duration-300"
            >
              <div className="w-24 h-24 rounded-full bg-[#171717]/5 flex items-center justify-center">
                <Camera className="w-12 h-12 text-[#171717]/60" />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium mb-2">Upload your selfie</p>
                <p className="text-sm text-[#171717]/60">
                  셀피를 업로드하고 당신만의 바이브를 발견하세요
                </p>
              </div>
            </motion.div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="user"
              onChange={handleImageSelect}
              className="hidden"
            />

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 text-red-500 text-sm"
              >
                {error}
              </motion.p>
            )}

            {/* Sovereign Info */}
            <div className="mt-12 text-center">
              <p className="text-sm text-[#171717]/40">
                Sovereign #{sovereignNumber.toLocaleString()} · Code: {referralCode}
              </p>
            </div>
          </motion.div>
        )}

        {/* Scanning Step */}
        {step === 'scanning' && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-screen p-6"
          >
            <ScanningAnimation />
          </motion.div>
        )}

        {/* Result Step */}
        {step === 'result' && cardData && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="max-w-lg mx-auto p-6 pb-20"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#171717]/5 mb-4"
              >
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">AI 분석 완료</span>
              </motion.div>
              <h1 className="text-3xl font-bold mb-2">
                {VIBE_LABELS[analysis!.primary].en.toUpperCase()}
              </h1>
              <p className="text-xl text-[#171717]/70">
                {VIBE_LABELS[analysis!.primary].ko}
              </p>
            </div>

            {/* Card Generator */}
            <VibeAuraGenerator data={cardData} onShare={handleShare} />

            {/* Retry Button */}
            <button
              onClick={handleRetry}
              className="w-full mt-6 py-3 rounded-xl bg-transparent border border-[#171717]/20 text-[#171717] font-medium flex items-center justify-center gap-2 hover:bg-[#171717]/5 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              다시 분석하기
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// Scanning Animation (Tesla FSD Style)
// ============================================

function ScanningAnimation() {
  return (
    <div className="flex flex-col items-center gap-8">
      {/* Scanning Circle */}
      <div className="relative w-64 h-64">
        {/* Outer Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full border-2 border-[#171717]/10"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#171717] rounded-full" />
        </motion.div>

        {/* Middle Ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-6 rounded-full border-2 border-[#171717]/20"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#171717] rounded-full" />
        </motion.div>

        {/* Inner Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-12 rounded-full border-2 border-[#171717]/30"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#171717] rounded-full" />
        </motion.div>

        {/* Center Pulse */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute inset-20 bg-[#171717]/10 rounded-full"
        />

        {/* Center Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="w-12 h-12 text-[#171717]" />
        </div>
      </div>

      {/* Scanning Text */}
      <div className="text-center">
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-lg font-medium"
        >
          Analyzing your vibe...
        </motion.p>
        <p className="text-sm text-[#171717]/60 mt-2">
          AI가 당신의 여행 아우라를 분석하고 있습니다
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex gap-4 mt-4">
        {['Face Detection', 'Style Analysis', 'Vibe Matching'].map((step, i) => (
          <motion.div
            key={step}
            initial={{ opacity: 0.3 }}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
            className="text-xs text-[#171717]/60"
          >
            {step}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default VibeViralCard;
