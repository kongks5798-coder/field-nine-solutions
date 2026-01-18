/**
 * A/B Test API
 * 테스트 그룹 할당 기록
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { visitorId, testName, variant } = await request.json();

    if (!visitorId || !testName || !variant) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Upsert: 기존에 있으면 업데이트 안함
    const { error } = await supabase
      .from('ab_tests')
      .upsert(
        { visitor_id: visitorId, test_name: testName, variant },
        { onConflict: 'visitor_id,test_name', ignoreDuplicates: true }
      );

    if (error) {
      console.error('[AB Test] Error:', error);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[AB Test] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
