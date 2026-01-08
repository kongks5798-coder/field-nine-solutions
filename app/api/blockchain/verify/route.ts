import { NextRequest, NextResponse } from 'next/server';
import { verifyRecord } from '@/src/services/blockchain';

/**
 * 블록체인 기록 검증 API
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ipfsHash = searchParams.get('hash');
    const expectedHash = searchParams.get('expectedHash');

    if (!ipfsHash) {
      return NextResponse.json(
        { error: 'IPFS 해시가 필요합니다.' },
        { status: 400 }
      );
    }

    const isValid = await verifyRecord(ipfsHash, expectedHash || undefined);

    return NextResponse.json({
      success: true,
      isValid,
      ipfsHash,
      message: isValid ? '기록이 검증되었습니다.' : '기록 검증에 실패했습니다.',
    });
  } catch (error: any) {
    console.error('[Blockchain API] 기록 검증 오류:', error);
    return NextResponse.json(
      { error: error.message || '기록 검증 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
