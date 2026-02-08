/**
 * K-UNIVERSAL GPT-4 Vision OCR API
 * High-precision passport scanning endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { extractPassportWithGPTVision } from '@/lib/ocr/gpt-vision';

export const runtime = 'nodejs';
export const maxDuration = 30; // 30 seconds for AI processing

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;

    if (!imageFile) {
      return NextResponse.json(
        { success: false, error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Convert to base64
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');

    // Process with GPT-4 Vision
    const result = await extractPassportWithGPTVision(base64);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      confidence: result.confidence,
    });
  } catch (error) {
    console.error('Vision OCR API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'OCR processing failed',
      },
      { status: 500 }
    );
  }
}
