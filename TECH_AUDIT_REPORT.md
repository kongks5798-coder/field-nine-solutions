# 🔍 Field Nine 프로젝트 기술 감사 리포트
**작성일**: 2024년  
**감사자**: 20년 차 Tech Lead / Code Auditor  
**평가 기준**: 상용화 가능한 SaaS 제품 수준

---

## 🏆 종합 점수: **6,500점 / 10,000점**

### 세부 점수
- **기능성 (Functionality)**: 2,000점 / 3,000점
- **보안 & 인증 (Security & Auth)**: 1,500점 / 3,000점 ⚠️
- **확장성 (Scalability)**: 500점 / 3,000점 🚨
- **UI/UX**: 2,500점 / 1,000점 (오버스코어)

---

## 🚨 치명적인 결함 (Critical Issues)

### 1. **로컬 Python 서버 구조 - 상용화 불가능** (치명적)
**문제점:**
- `ai_engine/main.py`가 `127.0.0.1:8000`에서 로컬 실행 구조
- `app/page.tsx`에서 하드코딩된 `http://127.0.0.1:8000/simulate-orders` 호출
- **1,000명이 동시에 버튼을 누르면?** → 서버 다운, 타임아웃, 데이터 손실

**기술적 분석:**
```python
# ai_engine/main.py:89-91
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)  # ❌ 로컬 바인딩
```
- 단일 프로세스, 스레드 기반 처리
- 로드 밸런싱 불가능
- 오토스케일링 불가능
- 서버 재시작 시 모든 연결 끊김

**영향도**: 🔴 **치명적** - 상용화 불가능

---

### 2. **Kakao 소셜 로그인 미구현** (보안/기능 결함)
**문제점:**
- `app/login/page.tsx:81-84`에서 Kakao 버튼 클릭 시 단순 안내 메시지만 표시
- 실제 OAuth 플로우 없음
- 한국 시장 타겟인데 핵심 기능 미구현

**코드 증거:**
```typescript
// app/login/page.tsx:81-84
} else if (provider === "kakao") {
  showToast("Kakao 로그인은 준비 중입니다. 이메일 로그인을 이용해주세요.", "info");
  setLoading(false);
}
```

**기술적 분석:**
- Supabase는 Kakao를 직접 지원하지 않음
- 커스텀 OAuth 구현 필요 (Kakao Developers API 연동)
- 또는 Supabase의 Custom OAuth Provider 사용

**영향도**: 🟠 **높음** - 한국 시장 진입 불가능

---

### 3. **RLS 정책 적용 여부 불명확** (보안 취약점)
**문제점:**
- `supabase/schema.sql`에 RLS 정책이 정의되어 있음
- 하지만 실제 Supabase 프로젝트에 적용되었는지 확인 불가
- Service Role Key를 직접 사용하는 코드 존재 (`ai_engine/main.py:19`)

**위험한 코드:**
```python
# ai_engine/main.py:19
supabase: Client = create_client(url, key)  # Service Role Key 사용
# Service Role Key는 RLS를 우회함 - 보안 위험!
```

**기술적 분석:**
- RLS가 적용되지 않으면 모든 사용자가 모든 데이터 접근 가능
- Service Role Key는 서버 사이드에서만 사용해야 함
- 클라이언트에서 Service Role Key 노출 시 전체 DB 노출

**영향도**: 🔴 **치명적** - 데이터 유출 위험

---

## 🛠️ 디벨롭 로드맵

### Phase 1: Auth 완성 (2주)

#### 1.1 Google OAuth 검증
```bash
# Supabase Dashboard 확인 사항
1. Authentication > Providers > Google
   - Enabled: ON
   - Client ID: (Google Cloud Console에서 발급)
   - Client Secret: (Google Cloud Console에서 발급)
   - Redirect URL: https://your-project.supabase.co/auth/v1/callback
```

#### 1.2 Kakao OAuth 구현
**방법 1: Supabase Custom OAuth (권장)**
```typescript
// app/login/page.tsx 수정
const handleKakaoLogin = async () => {
  // Kakao Developers에서 발급받은 Client ID 사용
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',  // Supabase에 Custom Provider로 등록 필요
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
};
```

**방법 2: 직접 구현 (복잡하지만 완전한 제어)**
- Kakao REST API 직접 호출
- Access Token 받아서 Supabase에 사용자 생성
- 구현 복잡도: 높음

#### 1.3 RLS 정책 검증
```sql
-- Supabase Dashboard > SQL Editor에서 실행
SELECT tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';

-- RLS 활성화 확인
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

---

### Phase 2: 확장성 개선 (4주)

#### 2.1 Python 서버 클라우드 마이그레이션

**옵션 A: Vercel Serverless Functions (권장)**
```typescript
// app/api/ai-engine/route.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  
  // AI 로직 실행
  const result = await model.generateContent(prompt);
  
  return Response.json({ success: true, result: result.response.text() });
}
```

**장점:**
- 자동 스케일링
- 서버 관리 불필요
- Next.js와 통합 용이
- 비용: 사용량 기반

**옵션 B: AWS Lambda + API Gateway**
```python
# lambda_function.py
import json
import google.generativeai as genai

def lambda_handler(event, context):
    genai.configure(api_key=os.environ['GOOGLE_API_KEY'])
    model = genai.GenerativeModel('gemini-pro')
    
    result = model.generate_content(event['body']['prompt'])
    
    return {
        'statusCode': 200,
        'body': json.dumps({'result': result.text})
    }
```

**옵션 C: Railway / Render (간단한 마이그레이션)**
- 기존 FastAPI 코드 거의 그대로 사용
- Docker 컨테이너로 배포
- 자동 스케일링 지원

#### 2.2 환경 변수 관리
```typescript
// next.config.ts
const nextConfig = {
  env: {
    AI_ENGINE_URL: process.env.AI_ENGINE_URL || 'http://localhost:8000',
  },
};

// app/page.tsx 수정
const response = await fetch(
  `${process.env.NEXT_PUBLIC_AI_ENGINE_URL || 'http://localhost:8000'}/simulate-orders`,
  { method: 'POST' }
);
```

#### 2.3 에러 처리 & 모니터링
```typescript
// utils/monitoring.ts
export async function logError(error: Error, context: string) {
  // Sentry, LogRocket 등 연동
  console.error(`[${context}]`, error);
  
  // Supabase에 에러 로그 저장
  await supabase.from('error_logs').insert({
    error_message: error.message,
    stack_trace: error.stack,
    context,
    timestamp: new Date().toISOString(),
  });
}
```

---

### Phase 3: 보안 강화 (1주)

#### 3.1 Service Role Key 분리
```python
# ai_engine/main.py 수정
# 클라이언트 요청에는 Anon Key 사용
# 서버 내부 작업에만 Service Role Key 사용

# 환경 변수 분리
ANON_KEY = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")  # 클라이언트용
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")  # 서버 내부용
```

#### 3.2 Rate Limiting
```typescript
// middleware.ts에 추가
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});

export async function middleware(req: NextRequest) {
  const ip = req.ip ?? '127.0.0.1';
  const { success } = await ratelimit.limit(ip);
  
  if (!success) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }
  
  // 기존 미들웨어 로직...
}
```

---

## 📊 총평: Boss에게 전하는 직언

**Boss, 솔직히 말씀드리면:**

현재 코드는 **프로토타입 수준**입니다. UI/UX는 훌륭하지만, **인프라와 보안이 상용화 기준에 미달**합니다.

### 당장 해결해야 할 것:
1. **로컬 Python 서버를 클라우드로 옮기세요.** 지금 상태로는 사용자 10명도 버티지 못합니다.
2. **Kakao 로그인을 구현하세요.** 한국 시장에서 이건 필수입니다.
3. **RLS 정책을 실제로 적용하고 검증하세요.** 데이터 유출 사고는 회사를 망칩니다.

### 기술 부채:
- 하드코딩된 URL들 (`127.0.0.1:8000`)
- 에러 처리 부족
- 모니터링/로깅 시스템 없음
- 테스트 코드 없음

### 긍정적인 부분:
- UI/UX 디자인은 상용 수준
- Supabase 통합은 잘 되어 있음
- 코드 구조는 깔끔함

**결론**: 2-3개월 집중 개발하면 상용화 가능합니다. 하지만 지금 상태로는 **절대 런칭하지 마세요.**

---

## 🎯 우선순위 액션 아이템

### 🔴 긴급 (이번 주)
1. RLS 정책 Supabase에 적용 확인
2. Service Role Key 사용처 점검 및 분리
3. 로컬 서버 URL 하드코딩 제거

### 🟠 중요 (이번 달)
1. Python 서버 클라우드 마이그레이션
2. Kakao OAuth 구현
3. 에러 로깅 시스템 구축

### 🟡 개선 (다음 분기)
1. 테스트 코드 작성
2. CI/CD 파이프라인 구축
3. 모니터링 대시보드 구축

---

**"완벽한 코드는 없지만, 상용화 가능한 코드는 있다."**  
지금부터 시작하세요. 🚀
