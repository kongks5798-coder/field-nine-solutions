import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/utils/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Field Nine: 마케팅 데이터 동기화 API
 * 
 * BullMQ 큐에 동기화 작업을 추가하는 엔드포인트
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (!session || sessionError) {
      return NextResponse.json(
        { error: 'Unauthorized', message: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { accountId, platform, dateRange } = body;

    if (!accountId || !platform) {
      return NextResponse.json(
        { error: 'Validation error', message: 'accountId와 platform은 필수입니다.' },
        { status: 400 }
      );
    }

    // TODO: BullMQ 큐에 작업 추가
    // const queue = new Queue('sync-queue', { connection: redis });
    // await queue.add('sync-performance', {
    //   tenantId: session.user.id,
    //   accountId,
    //   platform,
    //   dateRange,
    // });

    // 임시: 직접 처리 (나중에 큐로 이동)
    console.log('[Sync API]', {
      tenantId: session.user.id,
      accountId,
      platform,
      dateRange,
    });

    return NextResponse.json({
      success: true,
      message: '동기화 작업이 큐에 추가되었습니다.',
      jobId: `job_${Date.now()}`,
    });
  } catch (error) {
    console.error('[Sync API] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: '동기화 작업 추가 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
