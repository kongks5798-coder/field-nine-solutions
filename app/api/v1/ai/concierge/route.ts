/**
 * K-UNIVERSAL AI Concierge API v1
 * POST/GET /api/v1/ai/concierge
 *
 * Features:
 * - GPT-4 powered global travel assistant
 * - Multiple actions: chat, itinerary, destination, translate
 * - User authentication and subscription management
 * - Chat history tracking
 * - Usage limits and monitoring
 *
 * @module app/api/v1/ai/concierge
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/server';
import { logger } from '@/lib/logging/logger';
import { rateLimitMiddleware } from '@/lib/security/rate-limiter';

// ============================================
// Types
// ============================================

interface ConciergeMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  action?: 'chat' | 'itinerary' | 'destination' | 'translate';
  messages?: ConciergeMessage[];
  sessionId?: string;
  // Itinerary specific
  destination?: string;
  days?: number;
  preferences?: Record<string, unknown>;
  // Translate specific
  text?: string;
  targetLanguage?: string;
  context?: string;
}

interface UsageInfo {
  used: number;
  limit: number;
  planId?: string;
}

// ============================================
// Constants
// ============================================

export const runtime = 'nodejs';
export const maxDuration = 30;

const DEFAULT_QUICK_REPLIES = [
  '🌍 Best destinations right now?',
  '📱 How does eSIM work?',
  '💰 Budget travel tips',
  '✈️ Find cheap flights',
];

const DEFAULT_GREETING = {
  message: '안녕하세요! K-Universal AI 컨시어지 Jarvis입니다. 무엇을 도와드릴까요?',
  quickReplies: DEFAULT_QUICK_REPLIES,
};

// ============================================
// POST Handler - Chat with AI
// ============================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = `ai_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  try {
    // Rate limiting
    const rateLimit = await rateLimitMiddleware(request, '/api/v1/ai/concierge', {
      config: 'search', // 30 requests per minute
    });

    if (!rateLimit.allowed) {
      logger.warn('ai_concierge_rate_limited', { requestId });
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: rateLimit.headers,
        }
      );
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      // Allow unauthenticated requests with limited functionality
      return handleUnauthenticatedRequest(request, requestId);
    }

    // Parse request body
    const body: ChatRequest = await request.json();
    const { action = 'chat', messages, sessionId, destination, days, preferences, text, targetLanguage, context } = body;

    // Get user's subscription
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const planId = subscription?.plan_id || 'free';
    const aiChatsUsed = subscription?.ai_chats_used || 0;
    const aiChatsLimit = subscription?.ai_chats_limit || 10;

    // Check usage limits (unless unlimited)
    if (aiChatsLimit !== -1 && aiChatsUsed >= aiChatsLimit) {
      logger.warn('ai_concierge_limit_reached', {
        requestId,
        userId: user.id,
        used: aiChatsUsed,
        limit: aiChatsLimit,
      });

      return NextResponse.json({
        error: 'Chat limit reached',
        message: 'You\'ve reached your monthly AI chat limit. Upgrade your plan for more chats.',
        limitReached: true,
        usage: { used: aiChatsUsed, limit: aiChatsLimit },
      }, { status: 403 });
    }

    // Process based on action
    let response;
    const currentSessionId = sessionId || `session_${Date.now()}`;

    switch (action) {
      case 'chat':
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
          return NextResponse.json(
            { error: 'Messages array is required' },
            { status: 400 }
          );
        }
        response = await getChatResponse(messages, planId, requestId);
        break;

      case 'itinerary':
        if (!destination || !days) {
          return NextResponse.json(
            { error: 'Destination and days are required' },
            { status: 400 }
          );
        }
        response = await generateItinerary(destination, days, preferences || {}, requestId);
        break;

      case 'destination':
        if (!destination) {
          return NextResponse.json(
            { error: 'Destination code is required' },
            { status: 400 }
          );
        }
        response = await getDestinationInfo(destination, requestId);
        break;

      case 'translate':
        if (!text || !targetLanguage) {
          return NextResponse.json(
            { error: 'Text and target language are required' },
            { status: 400 }
          );
        }
        response = await translateText(text, targetLanguage, context, requestId);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Increment usage counter
    if (subscription) {
      await supabaseAdmin
        .from('subscriptions')
        .update({
          ai_chats_used: aiChatsUsed + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
    }

    // Save to chat history (for chat action)
    if (action === 'chat' && messages && messages.length > 0) {
      await saveChatHistory(user.id, currentSessionId, messages, response, action);
    }

    logger.info('ai_concierge_response', {
      requestId,
      userId: user.id,
      action,
      sessionId: currentSessionId,
    });

    return NextResponse.json({
      success: true,
      ...response,
      sessionId: currentSessionId,
      usage: {
        used: aiChatsUsed + 1,
        limit: aiChatsLimit,
      },
    }, { headers: rateLimit.headers });

  } catch (error) {
    logger.error('ai_concierge_error', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

// ============================================
// GET Handler - History & Suggestions
// ============================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = `ai_get_${Date.now()}`;

  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'greeting';
    const sessionId = searchParams.get('sessionId');

    // Return greeting for unauthenticated users
    if (authError || !user) {
      if (action === 'greeting' || action === 'suggestions') {
        return NextResponse.json({
          success: true,
          greeting: DEFAULT_GREETING,
          suggestions: DEFAULT_QUICK_REPLIES,
        });
      }
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    switch (action) {
      case 'greeting':
      case 'suggestions':
        return NextResponse.json({
          success: true,
          greeting: DEFAULT_GREETING,
          suggestions: DEFAULT_QUICK_REPLIES,
        });

      case 'history':
        const history = await getChatHistory(user.id, sessionId);
        return NextResponse.json({ success: true, history });

      case 'sessions':
        const sessions = await getChatSessions(user.id);
        return NextResponse.json({ success: true, sessions });

      case 'usage':
        const usage = await getUsageInfo(user.id);
        return NextResponse.json({ success: true, usage });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    logger.error('ai_concierge_get_error', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown',
    });

    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}

// ============================================
// Helper Functions
// ============================================

async function handleUnauthenticatedRequest(
  request: NextRequest,
  requestId: string
): Promise<NextResponse> {
  try {
    const body: ChatRequest = await request.json();
    const { messages } = body;

    if (!messages || messages.length === 0) {
      return NextResponse.json({
        success: true,
        greeting: DEFAULT_GREETING,
      });
    }

    // Limited response for unauthenticated users
    const response = await getChatResponse(messages, 'anonymous', requestId);

    return NextResponse.json({
      success: true,
      ...response,
      message: response.message + '\n\n로그인하시면 더 많은 기능을 이용하실 수 있습니다!',
      quickReplies: DEFAULT_QUICK_REPLIES,
    });
  } catch {
    return NextResponse.json({
      success: true,
      greeting: DEFAULT_GREETING,
    });
  }
}

async function getChatResponse(
  messages: ConciergeMessage[],
  _planId: string,
  requestId: string
): Promise<{ message: string; suggestions?: string[] }> {
  try {
    // Dynamic import to avoid build issues
    const { getConciergeResponse, getQuickReplies } = await import('@/lib/ai/concierge');
    const response = await getConciergeResponse(messages);

    return {
      message: response.message,
      suggestions: response.suggestions || getQuickReplies(),
    };
  } catch (error) {
    logger.error('chat_response_error', { requestId, error });

    // Fallback response
    return {
      message: '죄송합니다, 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      suggestions: DEFAULT_QUICK_REPLIES,
    };
  }
}

async function generateItinerary(
  destination: string,
  days: number,
  preferences: Record<string, unknown>,
  requestId: string
): Promise<{ message: string; itinerary?: unknown }> {
  try {
    const { generateItinerary: genIt } = await import('@/lib/ai/global-concierge');
    return await genIt(destination, days, preferences);
  } catch (error) {
    logger.error('itinerary_error', { requestId, error });
    return {
      message: `${destination}의 ${days}일 여행 일정을 생성할 수 없습니다. 다시 시도해 주세요.`,
    };
  }
}

async function getDestinationInfo(
  destination: string,
  requestId: string
): Promise<{ message: string; info?: unknown }> {
  try {
    const { getDestinationInfo: getDestInfo } = await import('@/lib/ai/global-concierge');
    return await getDestInfo(destination);
  } catch (error) {
    logger.error('destination_info_error', { requestId, error });
    return {
      message: `${destination}에 대한 정보를 가져올 수 없습니다.`,
    };
  }
}

async function translateText(
  text: string,
  targetLanguage: string,
  context: string | undefined,
  requestId: string
): Promise<{ message: string; translation?: string }> {
  try {
    const { translateWithContext } = await import('@/lib/ai/global-concierge');
    return await translateWithContext(text, targetLanguage, context);
  } catch (error) {
    logger.error('translate_error', { requestId, error });
    return {
      message: '번역 중 오류가 발생했습니다.',
    };
  }
}

async function saveChatHistory(
  userId: string,
  sessionId: string,
  messages: ConciergeMessage[],
  response: { message: string },
  action: string
): Promise<void> {
  try {
    const lastUserMessage = messages[messages.length - 1];

    // Save user message
    await supabaseAdmin.from('ai_chat_history').insert({
      user_id: userId,
      session_id: sessionId,
      role: 'user',
      content: lastUserMessage.content,
      metadata: { action },
    });

    // Save assistant response
    if (response.message) {
      await supabaseAdmin.from('ai_chat_history').insert({
        user_id: userId,
        session_id: sessionId,
        role: 'assistant',
        content: response.message,
        metadata: { action },
      });
    }
  } catch (error) {
    logger.error('save_chat_history_error', { userId, error });
  }
}

async function getChatHistory(
  userId: string,
  sessionId: string | null
): Promise<unknown[]> {
  let query = supabaseAdmin
    .from('ai_chat_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (sessionId) {
    query = query.eq('session_id', sessionId);
  }

  const { data } = await query;
  return data || [];
}

async function getChatSessions(userId: string): Promise<unknown[]> {
  const { data: sessions } = await supabaseAdmin
    .from('ai_chat_history')
    .select('session_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  // Get unique sessions
  const uniqueSessions = sessions?.reduce((acc: { session_id: string; created_at: string }[], item: { session_id: string; created_at: string }) => {
    if (!acc.find((s) => s.session_id === item.session_id)) {
      acc.push(item);
    }
    return acc;
  }, [] as { session_id: string; created_at: string }[]);

  return (uniqueSessions || []).slice(0, 20);
}

async function getUsageInfo(userId: string): Promise<UsageInfo> {
  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('ai_chats_used, ai_chats_limit, plan_id')
    .eq('user_id', userId)
    .single();

  return {
    used: subscription?.ai_chats_used || 0,
    limit: subscription?.ai_chats_limit || 10,
    planId: subscription?.plan_id || 'free',
  };
}
