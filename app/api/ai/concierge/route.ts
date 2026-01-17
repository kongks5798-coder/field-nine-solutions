/**
 * NOMAD - AI Concierge API
 * GPT-4 powered global travel assistant
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/server';
import {
  getGlobalConciergeResponse,
  generateItinerary,
  getDestinationInfo,
  translateWithContext,
  ConciergeMessage,
} from '@/lib/ai/global-concierge';

export const runtime = 'nodejs';

/**
 * POST /api/ai/concierge
 * Chat with AI Concierge
 */
export async function POST(request: NextRequest) {
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
          setAll() {},
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, messages, destination, days, preferences, text, targetLanguage, context } = body;

    // Get user's subscription
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const planId = subscription?.plan_id || 'free';
    const aiChatsUsed = subscription?.ai_chats_used || 0;
    const aiChatsLimit = subscription?.ai_chats_limit || 5;

    // Check usage limits
    if (aiChatsLimit !== -1 && aiChatsUsed >= aiChatsLimit) {
      return NextResponse.json(
        {
          error: 'Chat limit reached',
          message: 'You\'ve reached your monthly AI chat limit. Upgrade your plan for more chats.',
          limitReached: true,
          usage: {
            used: aiChatsUsed,
            limit: aiChatsLimit,
          },
        },
        { status: 403 }
      );
    }

    let response;
    let sessionId = body.sessionId || `session_${Date.now()}`;

    switch (action) {
      case 'chat':
        if (!messages || !Array.isArray(messages)) {
          return NextResponse.json(
            { error: 'Messages array required' },
            { status: 400 }
          );
        }
        response = await getGlobalConciergeResponse(messages as ConciergeMessage[], planId);
        break;

      case 'itinerary':
        if (!destination || !days) {
          return NextResponse.json(
            { error: 'Destination and days required' },
            { status: 400 }
          );
        }
        response = await generateItinerary(destination, days, preferences || {});
        break;

      case 'destination':
        if (!destination) {
          return NextResponse.json(
            { error: 'Destination code required' },
            { status: 400 }
          );
        }
        response = await getDestinationInfo(destination);
        break;

      case 'translate':
        if (!text || !targetLanguage) {
          return NextResponse.json(
            { error: 'Text and target language required' },
            { status: 400 }
          );
        }
        response = await translateWithContext(text, targetLanguage, context);
        break;

      default:
        // Default to chat action
        if (messages && Array.isArray(messages)) {
          response = await getGlobalConciergeResponse(messages as ConciergeMessage[], planId);
        } else {
          return NextResponse.json(
            { error: 'Invalid action or missing messages' },
            { status: 400 }
          );
        }
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

    // Save to chat history
    if (messages && messages.length > 0) {
      const lastUserMessage = messages[messages.length - 1];

      // Save user message
      await supabaseAdmin.from('ai_chat_history').insert({
        user_id: user.id,
        session_id: sessionId,
        role: 'user',
        content: lastUserMessage.content,
        metadata: { action },
      });

      // Save assistant response
      if (response.message) {
        await supabaseAdmin.from('ai_chat_history').insert({
          user_id: user.id,
          session_id: sessionId,
          role: 'assistant',
          content: response.message,
          tokens_used: response.metadata?.tokens || 0,
          metadata: {
            actions: response.actions,
            suggestions: response.suggestions,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      ...response,
      sessionId,
      usage: {
        used: aiChatsUsed + 1,
        limit: aiChatsLimit,
      },
    });
  } catch (error) {
    console.error('[AI Concierge API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/concierge
 * Get chat history or suggestions
 */
export async function GET(request: NextRequest) {
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
          setAll() {},
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'history';
    const sessionId = searchParams.get('sessionId');

    switch (action) {
      case 'history':
        let query = supabaseAdmin
          .from('ai_chat_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100);

        if (sessionId) {
          query = query.eq('session_id', sessionId);
        }

        const { data: history, error } = await query;

        if (error) throw error;

        return NextResponse.json({
          success: true,
          history: history || [],
        });

      case 'sessions':
        // Get unique sessions
        const { data: sessions } = await supabaseAdmin
          .from('ai_chat_history')
          .select('session_id, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        // Group by session and get first message
        const uniqueSessions = sessions?.reduce((acc, item) => {
          if (!acc.find((s: any) => s.session_id === item.session_id)) {
            acc.push(item);
          }
          return acc;
        }, [] as any[]);

        return NextResponse.json({
          success: true,
          sessions: uniqueSessions?.slice(0, 20) || [],
        });

      case 'usage':
        const { data: subscription } = await supabaseAdmin
          .from('subscriptions')
          .select('ai_chats_used, ai_chats_limit, plan_id')
          .eq('user_id', user.id)
          .single();

        return NextResponse.json({
          success: true,
          usage: {
            used: subscription?.ai_chats_used || 0,
            limit: subscription?.ai_chats_limit || 5,
            planId: subscription?.plan_id || 'free',
          },
        });

      case 'suggestions':
        // Return quick reply suggestions
        const suggestions = [
          '🌍 Best destinations right now?',
          '📱 How does eSIM work?',
          '💰 Budget travel tips',
          '✈️ Find cheap flights',
        ];

        return NextResponse.json({
          success: true,
          suggestions,
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[AI Concierge API] GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
