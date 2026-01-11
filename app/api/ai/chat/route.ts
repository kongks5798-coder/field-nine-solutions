import { NextRequest, NextResponse } from 'next/server';
import { rateLimitMiddleware } from '@/app/api/middleware/rate-limit';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  provider?: 'gemini' | 'openai';
  model?: string;
}

// Google Gemini 초기화
function getGeminiClient() {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_GEMINI_API_KEY가 설정되지 않았습니다.');
  }
  return new GoogleGenerativeAI(apiKey);
}

// OpenAI 클라이언트 초기화
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY가 설정되지 않았습니다.');
  }
  return new OpenAI({ apiKey });
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { messages, provider = 'gemini', model } = body;

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: '메시지가 필요합니다.' },
        { status: 400 }
      );
    }

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'user') {
      return NextResponse.json(
        { error: '마지막 메시지는 사용자 메시지여야 합니다.' },
        { status: 400 }
      );
    }

    let response: string;

    if (provider === 'gemini') {
      // Google Gemini 사용
      const gemini = getGeminiClient();
      const geminiModel = model || 'gemini-pro';
      const genModel = gemini.getGenerativeModel({ model: geminiModel });

      // Gemini 형식으로 메시지 변환
      const chatHistory = messages
        .filter((msg) => msg.role !== 'system')
        .map((msg) => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        }));

      // 시스템 프롬프트 추가
      const systemMessage = messages.find((msg) => msg.role === 'system');
      const prompt = systemMessage
        ? `${systemMessage.content}\n\n${lastMessage.content}`
        : `당신은 Field Nine의 AI 어시스턴트입니다. 친절하고 전문적으로 답변해주세요.\n\n${lastMessage.content}`;

      const result = await genModel.generateContent(prompt);
      const geminiResponse = await result.response;
      response = geminiResponse.text();
    } else {
      // OpenAI ChatGPT 사용
      const openai = getOpenAIClient();
      const openaiModel = model || 'gpt-4o-mini';

      // OpenAI 형식으로 메시지 변환
      const openaiMessages = messages.map((msg) => ({
        role: msg.role === 'assistant' ? 'assistant' : msg.role,
        content: msg.content,
      }));

      // 시스템 메시지가 없으면 추가
      if (!openaiMessages.some((msg) => msg.role === 'system')) {
        openaiMessages.unshift({
          role: 'system',
          content: '당신은 Field Nine의 AI 어시스턴트입니다. 친절하고 전문적으로 답변해주세요.',
        });
      }

      const completion = await openai.chat.completions.create({
        model: openaiModel,
        messages: openaiMessages as any,
        temperature: 0.7,
        max_tokens: 2000,
      });

      response = completion.choices[0]?.message?.content || '응답을 생성할 수 없습니다.';
    }

    return NextResponse.json({
      success: true,
      message: response,
      provider,
      model: model || (provider === 'gemini' ? 'gemini-pro' : 'gpt-4o-mini'),
    });
  } catch (error: unknown) {
    const { formatErrorResponse, logError } = await import('@/lib/error-handler');
    let errorProvider = 'unknown';
    try {
      const requestBody = await request.json();
      errorProvider = (requestBody as any)?.provider || 'unknown';
    } catch {
      // JSON 파싱 실패 시 무시
    }
    logError(error, { action: 'ai_chat', provider: errorProvider });
    
    // API 키 관련 에러 처리
    if (error instanceof Error && error.message?.includes('API_KEY')) {
      return NextResponse.json(
        {
          success: false,
          error: 'API 키가 설정되지 않았습니다. 환경 변수를 확인해주세요.',
          code: 'API_KEY_MISSING',
        },
        { status: 401 }
      );
    }

    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(
      {
        success: false,
        error: errorResponse.message,
        code: errorResponse.code,
      },
      { status: errorResponse.statusCode }
    );
  }
}

// 스트리밍 지원 (선택사항)
export async function GET() {
  return NextResponse.json({
    message: 'AI Chat API',
    supportedProviders: ['gemini', 'openai'],
    endpoints: {
      POST: '/api/ai/chat',
    },
  });
}
