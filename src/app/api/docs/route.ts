/**
 * GET /api/docs
 * OpenAPI 3.0 스펙 반환 — Swagger UI, Redoc 등에서 열람 가능
 * curl https://fieldnine.io/api/docs | python -m json.tool
 */
import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

const spec = {
  openapi: '3.0.3',
  info: {
    title: 'Dalkak API',
    version: '1.0.0',
    description: 'Dalkak — AI 앱 빌더 플랫폼 REST API',
    contact: { email: 'support@fieldnine.io', url: 'https://fieldnine.io' },
    license: { name: 'Proprietary' },
  },
  servers: [
    { url: 'https://fieldnine.io', description: 'Production' },
    { url: 'http://localhost:3000', description: 'Local Development' },
  ],
  tags: [
    { name: 'system',  description: '시스템 상태 및 모니터링' },
    { name: 'auth',    description: '인증 및 세션' },
    { name: 'ai',      description: 'AI 스트리밍 및 채팅' },
    { name: 'projects',description: '프로젝트 관리' },
    { name: 'billing', description: '결제 및 구독' },
    { name: 'tokens',  description: '토큰 잔액 관리' },
    { name: 'analytics',description: '사용량 분석' },
  ],
  paths: {
    '/api/health': {
      get: {
        tags: ['system'],
        summary: '헬스체크',
        description: '서비스 및 DB 연결 상태 확인. 인증 불필요.',
        responses: {
          '200': {
            description: '정상',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status:    { type: 'string', enum: ['ok', 'degraded', 'down'] },
                    version:   { type: 'string' },
                    timestamp: { type: 'string', format: 'date-time' },
                    latencyMs: { type: 'integer' },
                    components: {
                      type: 'object',
                      additionalProperties: {
                        type: 'object',
                        properties: {
                          status: { type: 'string' },
                          latencyMs: { type: 'integer' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '503': { description: 'DB 연결 불가' },
        },
      },
    },
    '/api/ai/stream': {
      post: {
        tags: ['ai'],
        summary: 'AI 스트리밍 응답',
        description: 'OpenAI / Anthropic / Gemini / Grok SSE 스트리밍. 로그인 필요.',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['mode'],
                properties: {
                  mode:     { type: 'string', enum: ['openai', 'anthropic', 'gemini', 'grok'] },
                  prompt:   { type: 'string' },
                  system:   { type: 'string' },
                  messages: { type: 'array', items: { type: 'object' } },
                  apiKey:   { type: 'string', description: 'Optional client-side key override' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'SSE 스트림 (text/event-stream)' },
          '401': { description: '로그인 필요' },
          '429': { description: '일일/월간 한도 초과' },
        },
      },
    },
    '/api/projects': {
      get: {
        tags: ['projects'],
        summary: '프로젝트 목록',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': { description: '프로젝트 배열' },
          '401': { description: '로그인 필요' },
        },
      },
      post: {
        tags: ['projects'],
        summary: '프로젝트 저장/업데이트',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['id', 'name'],
                properties: {
                  id:        { type: 'string', format: 'uuid' },
                  name:      { type: 'string', maxLength: 100 },
                  files:     { type: 'object' },
                  updatedAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: '{ ok: true }' },
          '400': { description: '입력 오류' },
          '413': { description: '요청 크기 초과 (1MB)' },
        },
      },
    },
    '/api/projects/publish': {
      post: {
        tags: ['projects'],
        summary: '앱 배포 (공개 URL 생성)',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'html'],
                properties: {
                  projectId: { type: 'string' },
                  name:      { type: 'string', maxLength: 100 },
                  html:      { type: 'string', maxLength: 2000000 },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: '{ slug: string, url: string }' },
          '401': { description: '로그인 필요' },
          '413': { description: 'HTML 크기 초과 (5MB)' },
        },
      },
    },
    '/api/tokens': {
      get: {
        tags: ['tokens'],
        summary: '토큰 잔액 조회',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': { description: '{ balance: number }' },
        },
      },
      patch: {
        tags: ['tokens'],
        summary: '토큰 차감',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['delta'],
                properties: {
                  delta: { type: 'integer', maximum: -1, description: '음수만 허용' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: '{ balance: number }' },
          '400': { description: 'delta는 음의 정수여야 함' },
        },
      },
    },
    '/api/billing/checkout': {
      post: {
        tags: ['billing'],
        summary: '결제 세션 생성',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['plan'],
                properties: {
                  plan:     { type: 'string', enum: ['pro', 'team'] },
                  provider: { type: 'string', enum: ['stripe', 'polar'], default: 'stripe' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: '{ url: string }' },
          '400': { description: '유효하지 않은 플랜' },
          '503': { description: '결제 시스템 미설정' },
        },
      },
    },
    '/api/analytics': {
      get: {
        tags: ['analytics'],
        summary: '사용량 분석 데이터',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': { description: '프로젝트 수, 배포된 앱, 조회수, 토큰 잔액' },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'sb-access-token',
        description: 'Supabase 세션 쿠키 (로그인 시 자동 설정)',
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(spec, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
