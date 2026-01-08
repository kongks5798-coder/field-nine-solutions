import { NextRequest, NextResponse } from 'next/server';
import { storeAuthRecord } from '@/src/services/blockchain';

/**
 * 인증 기록을 블록체인에 저장하는 API
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, action, metadata } = body;

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'userId와 action이 필요합니다.' },
        { status: 400 }
      );
    }

    const result = await storeAuthRecord(userId, action, metadata);

    return NextResponse.json({
      success: true,
      ipfsHash: result.ipfsHash,
      txHash: result.txHash,
      message: '인증 기록이 블록체인에 저장되었습니다.',
    });
  } catch (error: any) {
    console.error('[Blockchain API] 인증 기록 저장 오류:', error);
    return NextResponse.json(
      { error: error.message || '인증 기록 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
