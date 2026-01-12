/**
 * K-UNIVERSAL AI Concierge API
 * Real-time customer support endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { getConciergeResponse, getQuickReplies, type ConciergeMessage } from '@/lib/ai/concierge';

export const runtime = 'nodejs';
export const maxDuration = 30;

interface ChatRequest {
  messages: ConciergeMessage[];
  userId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();

    if (!body.messages || body.messages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Get AI response
    const response = await getConciergeResponse(body.messages);

    return NextResponse.json({
      success: true,
      response,
      quickReplies: getQuickReplies(),
    });
  } catch (error) {
    console.error('AI Concierge API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Chat processing failed',
      },
      { status: 500 }
    );
  }
}

/**
 * Get initial greeting and quick replies
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    greeting: {
      message: '안녕하세요! K-Universal AI 컨시어지 Jarvis입니다. 무엇을 도와드릴까요?',
      quickReplies: getQuickReplies(),
    },
  });
}
