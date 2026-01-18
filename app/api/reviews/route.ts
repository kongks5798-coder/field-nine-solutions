/**
 * Reviews API
 * 사용자 리뷰 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'ko';
    const featured = searchParams.get('featured') === 'true';
    const limit = parseInt(searchParams.get('limit') || '6', 10);

    let query = supabase
      .from('reviews')
      .select('id, name, country, rating, comment, service, is_verified, created_at')
      .eq('locale', locale)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (featured) {
      query = query.eq('is_featured', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Reviews] Supabase error:', error);
      return NextResponse.json({ reviews: [] });
    }

    return NextResponse.json({ reviews: data || [] });
  } catch (err) {
    console.error('[Reviews] Error:', err);
    return NextResponse.json({ reviews: [] });
  }
}
