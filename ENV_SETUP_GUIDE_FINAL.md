# 🔧 Field Nine Solutions - 환경 변수 설정 가이드

**최종 업데이트**: 2026-01-11

---

## 📋 필수 환경 변수 목록

### 1. Supabase 설정 (필수)

```env
# Supabase 프로젝트 URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# Supabase Anon Key (클라이언트 사이드용)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Supabase Service Role Key (서버 사이드용, 민감 정보)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**설정 방법:**
1. [Supabase](https://supabase.com)에서 프로젝트 생성
2. Settings > API에서 URL과 키 확인
3. Anon Key는 클라이언트 사이드에서 사용 (공개 가능)
4. Service Role Key는 서버 사이드에서만 사용 (절대 노출 금지)

---

### 2. OAuth 설정 (필수)

#### Google OAuth

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

**설정 방법:**
1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 프로젝트 생성 또는 선택
3. APIs & Services > Credentials
4. OAuth 2.0 Client ID 생성
5. Authorized redirect URIs 추가:
   - 개발: `http://localhost:3000/auth/callback`
   - 프로덕션: `https://your-domain.com/auth/callback`
6. Supabase 대시보드에서:
   - Authentication > Providers > Google 활성화
   - Client ID와 Secret 입력

#### Kakao OAuth

```env
KAKAO_CLIENT_ID=your_kakao_client_id
KAKAO_CLIENT_SECRET=your_kakao_client_secret
```

**설정 방법:**
1. [Kakao Developers](https://developers.kakao.com) 접속
2. 내 애플리케이션 생성
3. 플랫폼 설정:
   - Web 플랫폼 추가
   - 사이트 도메인 등록
4. 카카오 로그인 활성화
5. Redirect URI 등록:
   - 개발: `http://localhost:3000/auth/callback`
   - 프로덕션: `https://your-domain.com/auth/callback`
6. REST API 키 확인 (Client ID)
7. Client Secret 생성 (카카오 로그인 > 보안)
8. Supabase 대시보드에서:
   - Authentication > Providers > Kakao 활성화
   - Client ID와 Secret 입력

---

### 3. Toss Payments 설정 (필수)

```env
# Toss Payments Client Key (클라이언트 사이드용)
NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY=test_ck_xxx

# Toss Payments Secret Key (서버 사이드용, 민감 정보)
TOSS_PAYMENTS_SECRET_KEY=test_sk_xxx
```

**설정 방법:**
1. [Toss Payments](https://www.tosspayments.com) 계정 생성
2. 테스트 모드:
   - 테스트 키 발급 (개발 환경용)
   - 테스트 카드번호 사용 가능
3. 프로덕션 모드:
   - 사업자 등록 완료
   - 프로덕션 키 발급
4. 웹훅 설정:
   - 웹훅 URL: `https://your-domain.com/api/payments/webhook`
   - 이벤트: `PAYMENT_CONFIRMED`, `PAYMENT_FAILED`, `PAYMENT_CANCELED`

---

### 4. AI API 설정 (선택사항)

#### Google Gemini

```env
GOOGLE_GEMINI_API_KEY=your_gemini_api_key
```

**설정 방법:**
1. [Google AI Studio](https://makersuite.google.com/app/apikey) 접속
2. API 키 생성
3. 사용량 제한 설정 (선택사항)

#### OpenAI

```env
OPENAI_API_KEY=your_openai_api_key
```

**설정 방법:**
1. [OpenAI Platform](https://platform.openai.com) 접속
2. API Keys 메뉴
3. 새 API 키 생성
4. 사용량 제한 설정 (선택사항)

---

## 🔐 보안 주의사항

### 클라이언트 사이드 환경 변수
다음 변수는 `NEXT_PUBLIC_` 접두사가 있어 브라우저에 노출됩니다:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY`

**주의**: 민감한 정보는 절대 `NEXT_PUBLIC_` 접두사를 사용하지 마세요.

### 서버 사이드 환경 변수 (절대 노출 금지)
- `SUPABASE_SERVICE_ROLE_KEY`
- `TOSS_PAYMENTS_SECRET_KEY`
- `GOOGLE_CLIENT_SECRET`
- `KAKAO_CLIENT_SECRET`
- `GOOGLE_GEMINI_API_KEY`
- `OPENAI_API_KEY`

---

## 📝 Vercel 환경 변수 설정

### 방법 1: Vercel 대시보드
1. Vercel 프로젝트 선택
2. Settings > Environment Variables
3. 각 환경 변수 추가:
   - Key: 환경 변수 이름
   - Value: 환경 변수 값
   - Environment: Production, Preview, Development 선택

### 방법 2: Vercel CLI
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# ... 나머지 환경 변수도 동일하게 추가
```

---

## ✅ 환경 변수 확인

배포 후 다음 명령어로 환경 변수 확인:
```bash
# 로컬
npm run dev

# 프로덕션
vercel env ls
```

또는 `/api/test-connection` 엔드포인트로 확인 가능 (개발 환경에서만).

---

## 🚨 문제 해결

### 환경 변수가 적용되지 않음
1. Vercel에서 환경 변수 재설정
2. 프로젝트 재배포
3. 브라우저 캐시 클리어

### OAuth 로그인 실패
1. Supabase 대시보드에서 프로바이더 설정 확인
2. 리다이렉트 URI 확인
3. 클라이언트 ID/Secret 재확인

### 결제 실패
1. Toss Payments 키 확인
2. 웹훅 URL 확인
3. 결제 위젯 SDK 로드 확인

---

**보스, 인프라 연결까지 완료되었습니다.**
