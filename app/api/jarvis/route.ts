import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Mock delay - 3 seconds to simulate AI processing
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Mock response
    const response = {
      success: true,
      query,
      answer: '보스, 시스템이 준비되었습니다. 곧 데이터를 연동하겠습니다.',
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Jarvis API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
