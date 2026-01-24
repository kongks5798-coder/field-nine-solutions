// ---------------------------------------------------------
// Field Nine OS: Agent 실행 예시 (TypeScript)
// Next.js API Route 또는 Server Action에서 사용
// ---------------------------------------------------------

import {
  AgentController,
  ToolRegistry,
  QualityAgent,
  OpenAIProvider,
  AgentLLMInterface,
  createDefaultTools,
} from './index';

// ============================================================
// 1. 기본 에이전트 실행 예시
// ============================================================

export async function runBasicAgent() {
  // 도구 레지스트리 생성
  const tools = createDefaultTools();

  // 품질 검수 에이전트 (선택적)
  const qualityAgent = new QualityAgent(undefined, 0.7, 2);

  // 에이전트 생성
  const agent = new AgentController(
    {
      agentId: 'field-nine-agent',
      maxIterations: 5,
      qualityThreshold: 0.7,
      verbose: true,
      onStateChange: state => {
        console.log(`📌 State: ${state}`);
      },
      onIteration: (iteration, data) => {
        console.log(`\n--- Iteration ${iteration} ---`);
        console.log(`Thought: ${data.thought.reasoning.slice(0, 100)}...`);
      },
    },
    tools,
    undefined, // LLM Provider는 내부에서 생성
    qualityAgent
  );

  // 태스크 실행
  const result = await agent.execute('오늘의 패션 트렌드를 분석해줘');

  console.log('Result:', result);
  return result;
}

// ============================================================
// 2. OpenAI Provider 직접 사용 예시
// ============================================================

export async function runDirectOpenAI() {
  const provider = new OpenAIProvider({
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4o',
    temperature: 0.7,
    onStreamChunk: content => {
      process.stdout.write(content);
    },
    onError: error => {
      console.error('LLM Error:', error.errorType, error.message);
    },
  });

  // 일반 채팅
  const response = await provider.chat([
    { role: 'system', content: '너는 친절한 AI 비서야.' },
    { role: 'user', content: '안녕하세요! Field Nine에 대해 소개해주세요.' },
  ]);

  console.log('Response:', response.content);
  console.log('Usage:', response.usage);

  return response;
}

// ============================================================
// 3. 스트리밍 예시
// ============================================================

export async function runStreamingChat() {
  const provider = new OpenAIProvider({
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4o',
  });

  console.log('🌊 Streaming response:');

  for await (const chunk of provider.chatStream([
    { role: 'user', content: '한국 스트릿 패션의 특징을 설명해줘' },
  ])) {
    if (chunk.content) {
      process.stdout.write(chunk.content);
    }

    if (chunk.isComplete) {
      console.log('\n✅ Stream complete');
      if (chunk.toolCalls) {
        console.log('Tool calls:', chunk.toolCalls);
      }
    }
  }
}

// ============================================================
// 4. Function Calling 예시
// ============================================================

export async function runFunctionCalling() {
  const provider = new OpenAIProvider({
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4o',
  });

  // 도구 스키마 정의
  const tools = [
    {
      name: 'get_weather',
      description: 'Get current weather for a location',
      parameters: {
        type: 'object' as const,
        properties: {
          location: { type: 'string', description: 'City name' },
          unit: {
            type: 'string',
            enum: ['celsius', 'fahrenheit'],
            default: 'celsius',
          },
        },
        required: ['location'],
      },
    },
    {
      name: 'search_products',
      description: 'Search for fashion products',
      parameters: {
        type: 'object' as const,
        properties: {
          query: { type: 'string', description: 'Search query' },
          category: {
            type: 'string',
            enum: ['tops', 'bottoms', 'shoes', 'accessories'],
          },
        },
        required: ['query'],
      },
    },
  ];

  const response = await provider.chat(
    [
      {
        role: 'system',
        content: 'You can check weather and search products.',
      },
      {
        role: 'user',
        content: '서울 날씨 알려주고 인기 스니커즈 검색해줘',
      },
    ],
    tools
  );

  console.log('Response:', response.content);
  console.log('Tool Calls:', response.toolCalls);

  // 도구 호출 처리
  if (response.toolCalls.length > 0) {
    const messages: Array<{
      role: 'system' | 'user' | 'assistant' | 'tool';
      content: string;
      toolCallId?: string;
    }> = [
      {
        role: 'assistant',
        content: response.content || '',
      },
    ];

    // Mock tool results
    for (const tc of response.toolCalls) {
      let result: Record<string, unknown>;

      if (tc.name === 'get_weather') {
        result = { temperature: 15, condition: '맑음' };
      } else if (tc.name === 'search_products') {
        result = {
          products: [
            { name: 'Nike Air Max', price: 159000 },
            { name: 'Adidas Samba', price: 139000 },
          ],
        };
      } else {
        result = { error: 'Unknown tool' };
      }

      messages.push({
        role: 'tool',
        content: JSON.stringify(result),
        toolCallId: tc.id,
      });
    }

    // 최종 응답
    const finalResponse = await provider.chat(messages as any);
    console.log('Final Response:', finalResponse.content);
  }

  return response;
}

// ============================================================
// 5. Next.js API Route 예시
// ============================================================

/**
 * Next.js API Route에서 사용하는 예시
 *
 * // app/api/agent/route.ts
 * import { NextRequest, NextResponse } from 'next/server';
 * import { runAgentTask } from '@/lib/agent/example';
 *
 * export async function POST(req: NextRequest) {
 *   const { task } = await req.json();
 *   const result = await runAgentTask(task);
 *   return NextResponse.json(result);
 * }
 */

export async function runAgentTask(task: string) {
  const llmInterface = new AgentLLMInterface({
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4o',
    enableStreaming: false, // API Route에서는 비활성화
    verbose: false,
    onError: error => {
      console.error('Error:', error);
    },
  });

  const response = await llmInterface.think(task);

  return {
    success: true,
    content: response.content,
    toolCalls: response.toolCalls,
    usage: llmInterface.getStats(),
  };
}

// ============================================================
// 6. Server Action 스트리밍 예시
// ============================================================

/**
 * Next.js Server Action에서 스트리밍 사용 예시
 *
 * // app/actions/agent.ts
 * 'use server';
 *
 * import { streamAgentThought } from '@/lib/agent/example';
 *
 * export async function* agentStream(task: string) {
 *   for await (const chunk of streamAgentThought(task)) {
 *     yield chunk;
 *   }
 * }
 */

export async function* streamAgentThought(task: string) {
  const provider = new OpenAIProvider({
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4o',
  });

  const systemPrompt = `You are an autonomous AI agent.
Respond with JSON: { "reasoning": "...", "confidence": 0.0-1.0, "plan": [...] }`;

  for await (const chunk of provider.chatStream([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: task },
  ])) {
    yield chunk;
  }
}

// ============================================================
// 7. 에러 복구 예시
// ============================================================

export async function runWithErrorRecovery() {
  const provider = new OpenAIProvider({
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4o',
    maxRetries: 3,
    retryDelay: 1000,
    onError: error => {
      console.log(`⚠️ Error (retryable: ${error.retryable}):`, error.message);
    },
  });

  try {
    const response = await provider.chat([
      { role: 'user', content: '테스트 메시지' },
    ]);

    console.log('Success:', response.content);
    console.log('Stats:', provider.getUsageStats());
  } catch (error) {
    console.error('Final error after retries:', error);
  }
}
