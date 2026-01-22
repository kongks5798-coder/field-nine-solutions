/**
 * Stay22 Hotel Search API
 * GET /api/stay22/search - Search hotels via Stay22
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchStay22Hotels } from '@/lib/stay22/client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cityCode = searchParams.get('city')?.toUpperCase();
    const checkIn = searchParams.get('checkIn');
    const checkOut = searchParams.get('checkOut');
    const guests = parseInt(searchParams.get('guests') || '2', 10);
    const rooms = parseInt(searchParams.get('rooms') || '1', 10);

    if (!cityCode || !checkIn || !checkOut) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: city, checkIn, checkOut' },
        { status: 400 }
      );
    }

    const result = await searchStay22Hotels(cityCode, checkIn, checkOut, guests, rooms);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Stay22 search API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
