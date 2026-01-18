/**
 * A/B Test Conversion API
 * 전환 이벤트 기록
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { visitorId, testName, conversionType } = await request.json();

    if (!visitorId || !testName || !conversionType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 전환 기록 업데이트
    const { error } = await supabase
      .from('ab_tests')
      .update({
        converted_at: new Date().toISOString(),
        conversion_type: conversionType,
      })
      .eq('visitor_id', visitorId)
      .eq('test_name', testName);

    if (error) {
      console.error('[AB Test Convert] Error:', error);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[AB Test Convert] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
