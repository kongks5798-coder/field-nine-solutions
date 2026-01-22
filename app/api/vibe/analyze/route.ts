/**
 * VIBE-ID Analysis API
 * POST /api/vibe/analyze
 *
 * 셀피 이미지를 분석하여 여행 분위기를 추출하고 추천 여행지를 반환
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeSelfi, getFallbackAnalysis } from '@/lib/vibe/analyzer';
import { getDestinationsByVibe } from '@/lib/vibe/destinations';
import { VibeAnalyzeResponse } from '@/lib/vibe/types';

export const runtime = 'nodejs';
export const maxDuration = 30; // 30 seconds for GPT-4o Vision

// ============================================
// POST /api/vibe/analyze
// ============================================

export async function POST(request: NextRequest): Promise<NextResponse<VibeAnalyzeResponse>> {
  try {
    // Parse form data
    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;

    if (!imageFile) {
      return NextResponse.json(
        { success: false, error: '이미지를 업로드해주세요' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!imageFile.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: '이미지 파일만 업로드 가능합니다' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (imageFile.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: '이미지 크기는 10MB 이하여야 합니다' },
        { status: 400 }
      );
    }

    // Convert to base64
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = `data:${imageFile.type};base64,${buffer.toString('base64')}`;

    // Analyze with GPT-4o Vision
    let analysis;
    try {
      analysis = await analyzeSelfi(base64Image);
    } catch (apiError) {
      console.error('GPT-4o Vision API error:', apiError);
      // Use fallback analysis if API fails
      analysis = getFallbackAnalysis();
    }

    // Get matching destinations
    const destinations = getDestinationsByVibe(
      analysis.primary,
      analysis.secondary,
      6
    );

    return NextResponse.json({
      success: true,
      analysis,
      destinations,
    });
  } catch (error) {
    console.error('VIBE-ID analysis error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '분석에 실패했습니다',
      },
      { status: 500 }
    );
  }
}
