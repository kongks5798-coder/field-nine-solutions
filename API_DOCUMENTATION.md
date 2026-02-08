# Field Nine API 문서

## 개요

Field Nine은 Next.js 15와 Supabase를 기반으로 구축된 SaaS 플랫폼입니다.

---

## 인증 API

### POST `/api/auth/callback`

OAuth 콜백 처리

**Query Parameters:**
- `code`: 인증 코드
- `next`: 리다이렉트 경로 (기본값: `/dashboard`)
- `provider`: OAuth 프로바이더 (`google`, `kakao`)

**Response:**
- `302 Redirect`: 성공 시 `next` 경로로 리다이렉트
- `302 Redirect`: 실패 시 `/login?error=...`로 리다이렉트

---

## 블록체인 API

### POST `/api/blockchain/store-auth`

인증 이벤트를 블록체인에 저장

**Request Body:**
```json
{
  "userId": "string",
  "action": "signup" | "login" | "logout",
  "metadata": {
    "method": "email" | "oauth",
    "provider": "google" | "kakao" (optional)
  }
}
```

**Response:**
```json
{
  "success": true,
  "hash": "string"
}
```

---

## 로깅 API

### POST `/api/logs`

클라이언트 로그 수집

**Request Body:**
```json
{
  "level": "debug" | "info" | "warn" | "error",
  "message": "string",
  "context": {},
  "url": "string"
}
```

**Response:**
```json
{
  "success": true
}
```

---

## 에러 리포트 API

### POST `/api/errors`

클라이언트 에러 리포트 수집

**Request Body:**
```json
{
  "message": "string",
  "stack": "string",
  "componentStack": "string",
  "timestamp": "string",
  "userAgent": "string",
  "url": "string"
}
```

**Response:**
```json
{
  "success": true
}
```

---

## 데이터베이스 스키마

### Tables

#### `profiles`
- `id` (UUID, PK): 사용자 ID
- `email` (TEXT): 이메일
- `full_name` (TEXT): 이름
- `role` (TEXT): 역할 (`admin`, `employee`)

#### `orders`
- `id` (UUID, PK)
- `external_order_id` (TEXT, UNIQUE): 외부 주문번호
- `customer_name` (TEXT)
- `customer_email` (TEXT)
- `total_amount` (DECIMAL)
- `status` (TEXT): `pending`, `processing`, `picked`, `packed`, `shipped`, `delivered`, `cancelled`
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

---

## 환경 변수

### 필수 변수

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 선택 변수

```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (서버 전용)
```

---

## 보안

- CSRF 보호: SameSite 쿠키
- Rate Limiting: `/auth/callback` 엔드포인트
- XSS 방지: 입력 검증
- Open Redirect 방지: URL 검증

---

## 에러 코드

- `oauth_error`: OAuth 오류
- `provider_not_enabled`: 프로바이더 미활성화
- `oauth_config_error`: OAuth 설정 오류
- `no_code`: 인증 코드 없음
- `session_exchange_failed`: 세션 교환 실패
- `session_expired`: 세션 만료
- `rate_limit_exceeded`: 요청 제한 초과
