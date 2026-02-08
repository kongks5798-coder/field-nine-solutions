/**
 * K-UNIVERSAL KYC Submission API
 * Submit passport OCR data and auto-verify
 */

import { NextRequest, NextResponse } from 'next/server';
import { KYCProcessor } from '@/lib/ocr/kyc-processor';
import type { PassportData } from '@/lib/ocr/passport-scanner';

export const runtime = 'nodejs';

interface KYCSubmitRequest {
  userId: string;
  passportData: PassportData;
  documentImageUrl: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: KYCSubmitRequest = await request.json();

    // Validation
    if (!body.userId || !body.passportData || !body.documentImageUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get client info for audit log
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Process KYC
    const processor = new KYCProcessor();
    const result = await processor.submitKYC({
      userId: body.userId,
      passportData: body.passportData,
      documentImageUrl: body.documentImageUrl,
      ipAddress,
      deviceInfo: userAgent,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      profileId: result.profileId,
      kycStatus: result.kycStatus,
      message: result.message,
    });
  } catch (error) {
    console.error('KYC submit API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get KYC status
    const processor = new KYCProcessor();
    const status = await processor.getKYCStatus(userId);

    return NextResponse.json({
      success: true,
      kycStatus: status.kycStatus,
      passportData: status.passportData,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
