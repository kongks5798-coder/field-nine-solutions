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
    { name: 'system', description: '시스템 상태 및 모니터링' },
    { name: 'auth', description: '인증 및 세션' },
    { name: 'ai', description: 'AI 스트리밍 및 채팅' },
    { name: 'projects', description: '프로젝트 관리' },
    { name: 'billing', description: '결제 및 구독' },
    { name: 'payment', description: 'TossPayments 결제 처리' },
    { name: 'tokens', description: '토큰 잔액 관리' },
    { name: 'analytics', description: '사용량 분석' },
    { name: 'admin', description: '어드민 전용 (역할 기반 접근 제어)' },
    { name: 'cron', description: 'Vercel Cron 작업 (CRON_SECRET 인증)' },
    { name: 'published', description: '배포된 앱 관리' },
    { name: 'domains', description: '커스텀 도메인 관리' },
    { name: 'cowork', description: '협업 문서 관리' },
    { name: 'collab', description: '실시간 협업 동기화' },
    { name: 'canvas', description: 'AI Canvas 생성' },
    { name: 'lm', description: '언어 모델 관리' },
    { name: 'lab', description: 'AI 실험실 (토너먼트, 브레이크스루)' },
    { name: 'flow', description: '워크플로 실행' },
    { name: 'patrol', description: '시스템 순찰 모니터링' },
  ],
  paths: {
    /* ─────────────── System ─────────────── */
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
                    status: { type: 'string', enum: ['ok', 'degraded', 'down'] },
                    version: { type: 'string' },
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
    '/api/docs': {
      get: {
        tags: ['system'],
        summary: 'OpenAPI 3.0 스펙',
        description: 'API 문서 JSON 반환. 인증 불필요.',
        responses: {
          '200': { description: 'OpenAPI 3.0 JSON 스펙' },
        },
      },
    },
    '/api/og': {
      get: {
        tags: ['system'],
        summary: 'OG 이미지 생성',
        description: '소셜 미디어 공유용 OG 이미지 동적 생성. 인증 불필요.',
        responses: {
          '200': { description: 'PNG 이미지' },
        },
      },
    },
    '/api/contact': {
      post: {
        tags: ['system'],
        summary: '문의 접수',
        description: '사용자 문의 이메일 발송. 인증 불필요.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'message'],
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: '접수 완료' },
          '400': { description: '입력 오류' },
        },
      },
    },
    '/api/error-report': {
      post: {
        tags: ['system'],
        summary: '에러 리포트 전송',
        description: '클라이언트 에러 리포트 수집. 인증 불필요.',
        responses: {
          '200': { description: '접수 완료' },
        },
      },
    },
    '/api/system/error-report': {
      post: {
        tags: ['system'],
        summary: '시스템 에러 리포트 (Linear 연동)',
        description: '에러 리포트를 Linear 이슈로 생성. 인증 불필요.',
        responses: {
          '200': { description: '리포트 전송 완료' },
        },
      },
    },
    '/api/system/integrations/status': {
      get: {
        tags: ['system'],
        summary: '외부 연동 상태',
        description: 'Supabase, Redis, Linear 등 외부 서비스 연결 상태 확인.',
        responses: {
          '200': { description: '연동 상태 객체' },
        },
      },
    },
    '/api/system/proactive': {
      get: {
        tags: ['system'],
        summary: '사전 모니터링',
        description: '시스템 사전 점검 및 경고.',
        responses: {
          '200': { description: '점검 결과' },
        },
      },
    },
    '/api/system/test-slack': {
      get: {
        tags: ['system'],
        summary: 'Slack 알림 테스트',
        description: 'Slack 연동 테스트 메시지 발송.',
        responses: {
          '200': { description: '발송 결과' },
        },
      },
    },
    '/api/patrol/status': {
      get: {
        tags: ['patrol'],
        summary: '순찰 모니터링 상태',
        description: '시스템 순찰 모니터링 결과 조회. 인증 불필요.',
        responses: {
          '200': { description: '순찰 상태 객체' },
        },
      },
    },

    /* ─────────────── Auth ─────────────── */
    '/api/auth/me': {
      get: {
        tags: ['auth'],
        summary: '현재 사용자 정보',
        description: '로그인된 사용자 프로필 및 플랜 정보 반환.',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': { description: '사용자 프로필' },
          '401': { description: '로그인 필요' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['auth'],
        summary: '로그인',
        description: 'Supabase Auth를 통한 이메일/소셜 로그인.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: '로그인 성공' },
          '401': { description: '인증 실패' },
        },
      },
    },
    '/api/auth/gate': {
      post: {
        tags: ['auth'],
        summary: '접근 게이트 생성',
        description: '프로젝트/리소스 접근 권한 게이트 생성.',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': { description: '게이트 생성 완료' },
          '401': { description: '로그인 필요' },
        },
      },
      delete: {
        tags: ['auth'],
        summary: '접근 게이트 삭제',
        description: '프로젝트/리소스 접근 권한 게이트 삭제.',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': { description: '게이트 삭제 완료' },
          '401': { description: '로그인 필요' },
        },
      },
    },
    '/api/auth/error': {
      get: {
        tags: ['auth'],
        summary: '인증 에러 페이지',
        description: '인증 에러 발생 시 리다이렉트 대상.',
        responses: {
          '200': { description: '에러 정보' },
        },
      },
    },

    /* ─────────────── AI ─────────────── */
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
                  mode: { type: 'string', enum: ['openai', 'anthropic', 'gemini', 'grok'] },
                  prompt: { type: 'string' },
                  system: { type: 'string' },
                  messages: { type: 'array', items: { type: 'object' } },
                  apiKey: { type: 'string', description: 'Optional client-side key override' },
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
    '/api/ai/chat': {
      post: {
        tags: ['ai'],
        summary: 'AI 채팅 (비스트리밍)',
        description: 'AI 모델에 동기 요청. 응답 전체를 JSON으로 반환.',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': { description: '{ reply: string }' },
          '401': { description: '로그인 필요' },
        },
      },
    },
    '/api/ai/orders': {
      get: {
        tags: ['ai'],
        summary: 'AI 주문 목록 조회',
        description: 'AI 자동 생성 주문 목록.',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': { description: '주문 배열' },
        },
      },
      post: {
        tags: ['ai'],
        summary: 'AI 주문 생성',
        description: '새 AI 주문 생성.',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': { description: '생성된 주문' },
        },
      },
    },
    '/api/ai/orders/{id}': {
      get: {
        tags: ['ai'],
        summary: 'AI 주문 상세 조회',
        description: '특정 AI 주문 상세 정보.',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: '주문 상세' },
          '404': { description: '주문 없음' },
        },
      },
      patch: {
        tags: ['ai'],
        summary: 'AI 주문 수정',
        description: '특정 AI 주문 부분 수정.',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: '수정 완료' },
        },
      },
    },
    '/api/ai/orders/generate': {
      post: {
        tags: ['ai'],
        summary: 'AI 주문 자동 생성',
        description: 'AI가 주문 데이터를 자동 생성.',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': { description: '생성된 주문 데이터' },
        },
      },
    },
    '/api/ai/orders/import': {
      post: {
        tags: ['ai'],
        summary: 'AI 주문 일괄 가져오기',
        description: '외부 데이터에서 AI 주문 일괄 임포트.',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': { description: '임포트 결과' },
        },
      },
    },
    '/api/ai/orders/process': {
      post: {
        tags: ['ai'],
        summary: 'AI 주문 처리',
        description: 'AI 주문 일괄 처리 실행.',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': { description: '처리 결과' },
        },
      },
    },

    /* ─────────────── Projects ─────────────── */
    '/api/projects': {
      get: {
        tags: ['projects'],
        summary: '프로젝트 목록',
        description: '로그인 사용자의 프로젝트 목록 조회.',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': { description: '프로젝트 배열' },
          '401': { description: '로그인 필요' },
        },
      },
      post: {
        tags: ['projects'],
        summary: '프로젝트 저장/업데이트',
        description: '프로젝트 생성 또는 업데이트.',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['id', 'name'],
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string', maxLength: 100 },
                  files: { type: 'object' },
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
    '/api/projects/{id}': {
      get: {
        tags: ['projects'],
        summary: '프로젝트 상세 조회',
        description: '특정 프로젝트 상세 정보.',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: '프로젝트 상세' },
          '404': { description: '프로젝트 없음' },
        },
      },
      delete: {
        tags: ['projects'],
        summary: '프로젝트 삭제',
        description: '특정 프로젝트 삭제.',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: '삭제 완료' },
          '401': { description: '로그인 필요' },
        },
      },
    },
    '/api/projects/publish': {
      post: {
        tags: ['projects'],
        summary: '앱 배포 (공개 URL 생성)',
        description: '프로젝트를 공개 URL로 배포.',
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
                  name: { type: 'string', maxLength: 100 },
                  html: { type: 'string', maxLength: 2000000 },
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
    '/api/projects/fork': {
      post: {
        tags: ['projects'],
        summary: '프로젝트 포크',
        description: '기존 프로젝트를 복제하여 새 프로젝트 생성.',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': { description: '포크된 프로젝트' },
          '401': { description: '로그인 필요' },
        },
      },
    },

    /* ─────────────── Published Apps ─────────────── */
    '/api/published': {
      get: {
        tags: ['published'],
        summary: '배포된 앱 목록',
        description: '로그인 사용자의 배포된 앱 목록.',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': { description: '배포된 앱 배열' },
        },
      },
    },
    '/api/published/{slug}': {
      get: {
        tags: ['published'],
        summary: '배포된 앱 조회',
        description: '슬러그로 배포된 앱 HTML 조회. 인증 불필요.',
        parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: '앱 HTML' },
          '404': { description: '앱 없음' },
        },
      },
      delete: {
        tags: ['published'],
        summary: '배포된 앱 삭제',
        description: '배포된 앱 삭제 (소유자만).',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: '삭제 완료' },
          '401': { description: '로그인 필요' },
        },
      },
    },

    /* ─────────────── Domains ─────────────── */
    '/api/domains': {
      get: {
        tags: ['domains'],
        summary: '도메인 목록',
        description: '사용자 커스텀 도메인 목록 조회.',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': { description: '도메인 배열' },
        },
      },
      post: {
        tags: ['domains'],
        summary: '도메인 등록',
        description: '새 커스텀 도메인 등록.',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': { description: '등록된 도메인' },
        },
      },
    },
    '/api/domains/{id}': {
      delete: {
        tags: ['domains'],
        summary: '도메인 삭제',
        description: '커스텀 도메인 삭제.',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: '삭제 완료' },
        },
      },
    },

    /* ─────────────── Billing ─────────────── */
    '/api/billing/checkout': {
      post: {
        tags: ['billing'],
        summary: '결제 세션 생성',
        description: 'Stripe/Polar 결제 세션 생성 후 결제 URL 반환.',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['plan'],
                properties: {
                  plan: { type: 'string', enum: ['pro', 'team'] },
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
    '/api/billing/success': {
      get: {
        tags: ['billing'],
        summary: '결제 성공 콜백',
        description: '결제 성공 후 리다이렉트 처리.',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': { description: '결제 완료 확인' },
        },
      },
    },
    '/api/billing/cancel': {
      post: {
        tags: ['billing'],
        summary: '구독 취소',
        description: '현재 구독 취소 요청.',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': { description: '취소 완료' },
          '400': { description: '취소 불가 (활성 구독 없음)' },
        },
      },
    },
    '/api/billing/downgrade': {
      post: {
        tags: ['billing'],
        summary: '플랜 다운그레이드',
        description: '상위 플랜에서 하위 플랜으로 다운그레이드.',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': { description: '다운그레이드 완료' },
        },
      },
    },
    '/api/billing/refund': {
      post: {
        tags: ['billing'],
        summary: '환불 요청',
        description: '결제 건 환불 처리.',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': { description: '환불 완료' },
          '400': { description: '환불 불가' },
        },
      },
    },
    '/api/billing/portal': {
      post: {
        tags: ['billing'],
        summary: 'Stripe 고객 포털',
        description: 'Stripe Customer Portal URL 생성.',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': { description: '{ url: string }' },
        },
      },
    },
    '/api/billing/history': {
      get: {
        tags: ['billing'],
        summary: '결제 내역',
        description: '사용자 결제 내역 조회.',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': { description: '결제 내역 배열' },
        },
      },
    },
    '/api/billing/usage': {
      get: {
        tags: ['billing'],
        summary: '사용량 조회',
        description: '현재 기간 API 사용량 조회.',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': { description: '사용량 데이터' },
        },
      },
      post: {
        tags: ['billing'],
        summary: '사용량 기록',
        description: 'API 사용량 기록 추가.',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': { description: '기록 완료' },
        },
      },
    },
    '/api/billing/top-up': {
      post: {
        tags: ['billing'],
        summary: '토큰 충전 세션 생성',
        description: 'TossPayments 토큰 충전 결제 세션 생성.',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': { description: '결제 세션 정보' },
        },
      },
    },
    '/api/billing/top-up/confirm': {
      get: {
        tags: ['billing'],
        summary: '토큰 충전 확인',
        description: '충전 결제 완료 후 토큰 적립 확인.',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': { description: '충전 완료' },
        },
      },
    },
    '/api/billing/invoice': {
      get: {
        tags: ['billing'],
        summary: '인보이스 생성 (Cron)',
        description: '정기 인보이스 자동 생성. CRON_SECRET 인증.',
        responses: {
          '200': { description: '인보이스 생성 결과' },
        },
      },
      post: {
        tags: ['billing'],
        summary: '인보이스 생성 (수동)',
        description: '인보이스 수동 생성 트리거.',
        responses: {
          '200': { description: '인보이스 생성 결과' },
        },
      },
    },
    '/api/billing/webhook': {
      post: {
        tags: ['billing'],
        summary: 'Stripe 웹훅',
        description: 'Stripe 이벤트 수신. 서명 검증 필수.',
        responses: {
          '200': { description: '처리 완료' },
          '400': { description: '서명 검증 실패' },
        },
      },
    },

    /* ─────────────── Payment (TossPayments) ─────────────── */
    '/api/payment/confirm': {
      get: {
        tags: ['payment'],
        summary: 'TossPayments 결제 확인',
        description: '결제 승인 요청 및 확인 처리.',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': { description: '결제 확인 완료' },
        },
      },
    },
    '/api/payment/toss/webhook': {
      post: {
        tags: ['payment'],
        summary: 'TossPayments 웹훅',
        description: 'TossPayments 이벤트 수신. 서명 검증 필수.',
        responses: {
          '200': { description: '처리 완료' },
          '400': { description: '서명 검증 실패' },
        },
      },
    },
    '/api/payment/toss/cancel': {
      post: {
        tags: ['payment'],
        summary: 'TossPayments 결제 취소',
        description: 'TossPayments 결제 건 취소/환불.',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': { description: '취소 완료' },
          '400': { description: '취소 불가' },
        },
      },
    },

    /* ─────────────── Tokens ─────────────── */
    '/api/tokens': {
      get: {
        tags: ['tokens'],
        summary: '토큰 잔액 조회',
        description: '로그인 사용자의 토큰 잔액.',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': { description: '{ balance: number }' },
        },
      },
      patch: {
        tags: ['tokens'],
        summary: '토큰 차감',
        description: '토큰 차감 (낙관적 잠금). 음수 delta만 허용.',
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

    /* ─────────────── Analytics ─────────────── */
    '/api/analytics': {
      get: {
        tags: ['analytics'],
        summary: '사용량 분석 데이터',
        description: '프로젝트 수, 배포된 앱, 조회수, 토큰 잔액 등.',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': { description: '분석 데이터 객체' },
        },
      },
    },

    /* ─────────────── Cowork (협업 문서) ─────────────── */
    '/api/cowork/docs': {
      get: {
        tags: ['cowork'],
        summary: '협업 문서 목록',
        description: '사용자 협업 문서 목록 조회.',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': { description: '문서 배열' },
        },
      },
      post: {
        tags: ['cowork'],
        summary: '협업 문서 생성',
        description: '새 협업 문서 생성.',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': { description: '생성된 문서' },
        },
      },
    },
    '/api/cowork/docs/{id}': {
      get: {
        tags: ['cowork'],
        summary: '협업 문서 상세',
        description: '특정 협업 문서 상세 조회.',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: '문서 상세' },
          '404': { description: '문서 없음' },
        },
      },
      patch: {
        tags: ['cowork'],
        summary: '협업 문서 수정',
        description: '협업 문서 내용 부분 수정.',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: '수정 완료' },
        },
      },
      delete: {
        tags: ['cowork'],
        summary: '협업 문서 삭제',
        description: '협업 문서 삭제.',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: '삭제 완료' },
        },
      },
    },

    /* ─────────────── Collab (실시간 협업) ─────────────── */
    '/api/collab': {
      get: {
        tags: ['collab'],
        summary: '협업 세션 조회',
        description: '실시간 협업 세션 상태 조회.',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': { description: '세션 정보' },
        },
      },
      post: {
        tags: ['collab'],
        summary: '협업 세션 생성',
        description: '새 실시간 협업 세션 생성.',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': { description: '생성된 세션' },
        },
      },
    },
    '/api/collab/sync': {
      get: {
        tags: ['collab'],
        summary: '협업 동기화 상태',
        description: '실시간 협업 동기화 상태 조회.',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': { description: '동기화 상태' },
        },
      },
      post: {
        tags: ['collab'],
        summary: '협업 데이터 동기화',
        description: '협업 데이터 동기화 요청.',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': { description: '동기화 완료' },
        },
      },
    },

    /* ─────────────── Canvas ─────────────── */
    '/api/canvas/generate': {
      post: {
        tags: ['canvas'],
        summary: 'AI Canvas 생성',
        description: 'AI를 활용한 Canvas 컨텐츠 생성.',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': { description: '생성된 Canvas 데이터' },
          '401': { description: '로그인 필요' },
        },
      },
    },

    /* ─────────────── LM (Language Models) ─────────────── */
    '/api/lm/models': {
      get: {
        tags: ['lm'],
        summary: '사용 가능한 LM 모델 목록',
        description: '현재 활성화된 AI 모델(OpenAI, Anthropic, Gemini, Grok) 목록.',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': { description: '모델 배열 (provider, name, available)' },
        },
      },
    },
    '/api/lm/generate': {
      post: {
        tags: ['lm'],
        summary: 'LM 텍스트 생성',
        description: '선택된 언어 모델로 텍스트 생성.',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': { description: '생성된 텍스트' },
          '401': { description: '로그인 필요' },
        },
      },
    },

    /* ─────────────── Lab (AI 실험실) ─────────────── */
    '/api/lab/tournaments': {
      get: {
        tags: ['lab'],
        summary: 'AI 토너먼트 목록',
        description: 'AI 모델 간 토너먼트 목록 조회.',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': { description: '토너먼트 배열' },
        },
      },
      post: {
        tags: ['lab'],
        summary: 'AI 토너먼트 생성',
        description: '새 AI 토너먼트 생성.',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': { description: '생성된 토너먼트' },
        },
      },
    },
    '/api/lab/tournaments/{id}': {
      get: {
        tags: ['lab'],
        summary: '토너먼트 상세 조회',
        description: '특정 토너먼트 상세 정보 및 결과.',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: '토너먼트 상세' },
          '404': { description: '토너먼트 없음' },
        },
      },
    },
    '/api/lab/tournaments/{id}/round': {
      post: {
        tags: ['lab'],
        summary: '토너먼트 라운드 실행',
        description: '토너먼트 다음 라운드 실행.',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: '라운드 결과' },
        },
      },
    },
    '/api/lab/breakthroughs': {
      get: {
        tags: ['lab'],
        summary: 'AI 브레이크스루 목록',
        description: 'AI 실험 브레이크스루(발견) 목록.',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': { description: '브레이크스루 배열' },
        },
      },
    },

    /* ─────────────── Flow (워크플로) ─────────────── */
    '/api/flow/execute': {
      post: {
        tags: ['flow'],
        summary: '워크플로 실행',
        description: '정의된 워크플로 파이프라인 실행.',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': { description: '실행 결과' },
          '401': { description: '로그인 필요' },
        },
      },
    },

    /* ─────────────── Admin ─────────────── */
    '/api/admin/verify': {
      get: {
        tags: ['admin'],
        summary: '어드민 권한 검증',
        description: '현재 사용자의 어드민 권한 확인.',
        security: [{ cookieAuth: [] }, { adminSecret: [] }],
        responses: {
          '200': { description: '{ admin: true }' },
          '403': { description: '권한 없음' },
        },
      },
    },
    '/api/admin/overview': {
      get: {
        tags: ['admin'],
        summary: '어드민 대시보드 개요',
        description: '전체 서비스 통계 요약.',
        security: [{ cookieAuth: [] }, { adminSecret: [] }],
        responses: {
          '200': { description: '서비스 통계' },
        },
      },
    },
    '/api/admin/stats': {
      get: {
        tags: ['admin'],
        summary: '상세 통계',
        description: '상세 서비스 통계 데이터.',
        security: [{ cookieAuth: [] }, { adminSecret: [] }],
        responses: {
          '200': { description: '통계 데이터' },
        },
      },
    },
    '/api/admin/revenue': {
      get: {
        tags: ['admin'],
        summary: '매출 데이터',
        description: '기간별 매출 통계.',
        security: [{ cookieAuth: [] }, { adminSecret: [] }],
        responses: {
          '200': { description: '매출 데이터' },
        },
      },
    },
    '/api/admin/users': {
      get: {
        tags: ['admin'],
        summary: '사용자 목록',
        description: '전체 사용자 목록 (페이지네이션).',
        security: [{ cookieAuth: [] }, { adminSecret: [] }],
        responses: {
          '200': { description: '사용자 배열' },
        },
      },
    },
    '/api/admin/users/{id}/plan': {
      patch: {
        tags: ['admin'],
        summary: '사용자 플랜 변경',
        description: '특정 사용자 플랜 강제 변경.',
        security: [{ cookieAuth: [] }, { adminSecret: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: '플랜 변경 완료' },
        },
      },
    },
    '/api/admin/subscriptions': {
      get: {
        tags: ['admin'],
        summary: '구독 목록',
        description: '전체 구독 현황 조회.',
        security: [{ cookieAuth: [] }, { adminSecret: [] }],
        responses: {
          '200': { description: '구독 배열' },
        },
      },
    },
    '/api/admin/billing-events': {
      get: {
        tags: ['admin'],
        summary: '결제 이벤트 로그',
        description: '결제 관련 이벤트 기록 조회.',
        security: [{ cookieAuth: [] }, { adminSecret: [] }],
        responses: {
          '200': { description: '이벤트 배열' },
        },
      },
    },
    '/api/admin/audit-log': {
      get: {
        tags: ['admin'],
        summary: '감사 로그',
        description: '시스템 감사 로그 조회.',
        security: [{ cookieAuth: [] }, { adminSecret: [] }],
        responses: {
          '200': { description: '감사 로그 배열' },
        },
      },
    },
    '/api/admin/customers': {
      get: {
        tags: ['admin'],
        summary: '고객 목록',
        description: '결제 고객 목록 조회.',
        security: [{ cookieAuth: [] }, { adminSecret: [] }],
        responses: {
          '200': { description: '고객 배열' },
        },
      },
      post: {
        tags: ['admin'],
        summary: '고객 등록',
        description: '새 결제 고객 수동 등록.',
        security: [{ cookieAuth: [] }, { adminSecret: [] }],
        responses: {
          '200': { description: '등록된 고객' },
        },
      },
    },
    '/api/admin/customers/{id}': {
      patch: {
        tags: ['admin'],
        summary: '고객 정보 수정',
        description: '고객 정보 부분 수정.',
        security: [{ cookieAuth: [] }, { adminSecret: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: '수정 완료' },
        },
      },
      delete: {
        tags: ['admin'],
        summary: '고객 삭제',
        description: '고객 레코드 삭제.',
        security: [{ cookieAuth: [] }, { adminSecret: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: '삭제 완료' },
        },
      },
    },
    '/api/admin/orders': {
      get: {
        tags: ['admin'],
        summary: '주문 목록',
        description: '전체 주문 목록 조회.',
        security: [{ cookieAuth: [] }, { adminSecret: [] }],
        responses: {
          '200': { description: '주문 배열' },
        },
      },
      post: {
        tags: ['admin'],
        summary: '주문 생성',
        description: '수동 주문 생성.',
        security: [{ cookieAuth: [] }, { adminSecret: [] }],
        responses: {
          '200': { description: '생성된 주문' },
        },
      },
    },
    '/api/admin/orders/{id}': {
      patch: {
        tags: ['admin'],
        summary: '주문 수정',
        description: '주문 상태 또는 내용 수정.',
        security: [{ cookieAuth: [] }, { adminSecret: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: '수정 완료' },
        },
      },
      delete: {
        tags: ['admin'],
        summary: '주문 삭제',
        description: '주문 레코드 삭제.',
        security: [{ cookieAuth: [] }, { adminSecret: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: '삭제 완료' },
        },
      },
    },
    '/api/admin/orders/simulate': {
      post: {
        tags: ['admin'],
        summary: '주문 시뮬레이션',
        description: '테스트용 주문 시뮬레이션 실행.',
        security: [{ cookieAuth: [] }, { adminSecret: [] }],
        responses: {
          '200': { description: '시뮬레이션 결과' },
        },
      },
    },
    '/api/admin/analyze': {
      post: {
        tags: ['admin'],
        summary: 'AI 분석 실행',
        description: '서비스 데이터 AI 분석 실행.',
        security: [{ cookieAuth: [] }, { adminSecret: [] }],
        responses: {
          '200': { description: '분석 결과' },
        },
      },
    },
    '/api/admin/migrate': {
      post: {
        tags: ['admin'],
        summary: '데이터 마이그레이션',
        description: '데이터 마이그레이션 실행.',
        security: [{ cookieAuth: [] }, { adminSecret: [] }],
        responses: {
          '200': { description: '마이그레이션 결과' },
        },
      },
    },
    '/api/admin/db-migrate': {
      get: {
        tags: ['admin'],
        summary: 'DB 마이그레이션 상태',
        description: '현재 DB 마이그레이션 상태 조회.',
        security: [{ cookieAuth: [] }, { adminSecret: [] }],
        responses: {
          '200': { description: '마이그레이션 상태' },
        },
      },
      post: {
        tags: ['admin'],
        summary: 'DB 마이그레이션 실행',
        description: 'DB 스키마 마이그레이션 실행.',
        security: [{ cookieAuth: [] }, { adminSecret: [] }],
        responses: {
          '200': { description: '마이그레이션 결과' },
        },
      },
    },

    /* ─────────────── Cron ─────────────── */
    '/api/cron/cleanup-audit': {
      get: {
        tags: ['cron'],
        summary: '감사 로그 정리',
        description: '오래된 감사 로그 정리. CRON_SECRET 헤더 인증.',
        responses: {
          '200': { description: '정리 완료' },
          '401': { description: 'CRON_SECRET 불일치' },
        },
      },
    },
    '/api/cron/expire-plans': {
      get: {
        tags: ['cron'],
        summary: '만료 플랜 처리',
        description: '만료된 구독 플랜 자동 다운그레이드. CRON_SECRET 헤더 인증.',
        responses: {
          '200': { description: '처리 완료' },
          '401': { description: 'CRON_SECRET 불일치' },
        },
      },
    },
    '/api/cron/trial-reminder': {
      get: {
        tags: ['cron'],
        summary: '트라이얼 만료 알림',
        description: '트라이얼 만료 예정 사용자에게 이메일 알림. CRON_SECRET 헤더 인증.',
        responses: {
          '200': { description: '알림 발송 완료' },
          '401': { description: 'CRON_SECRET 불일치' },
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
      adminSecret: {
        type: 'apiKey',
        in: 'header',
        name: 'x-admin-secret',
        description: 'ADMIN_SECRET 환경변수와 일치하는 비밀 키',
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
