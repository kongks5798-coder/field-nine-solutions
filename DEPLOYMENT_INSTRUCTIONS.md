# 🚀 TrendStream 배포 가이드

## 배포 전 체크리스트

### 1. Vercel 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수를 설정해야 합니다:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
PYTHON_BACKEND_URL=your_python_backend_url (또는 http://localhost:8000)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn (선택)
```

**설정 방법:**
1. Vercel 대시보드 접속
2. 프로젝트 선택
3. Settings → Environment Variables
4. 위 환경 변수 추가

### 2. Supabase 스키마 실행

Supabase SQL Editor에서 다음 파일들을 실행:

```sql
-- 1. 기본 스키마
-- supabase/schema.sql

-- 2. 구독 스키마
-- supabase/schema_subscriptions.sql
```

### 3. 배포 명령

```bash
# GitHub에 푸시하면 자동 배포 (CI/CD)
git push origin main

# 또는 수동 배포
npx vercel --prod
```

---

## 배포 후 확인

### 1. 헬스 체크
```
GET https://your-domain.vercel.app/api/health
```

### 2. 랜딩 페이지 확인
```
https://your-domain.vercel.app
```

### 3. 대시보드 확인
```
https://your-domain.vercel.app/dashboard
```

---

## 문제 해결

### 환경 변수 오류
- Vercel 대시보드에서 환경 변수가 올바르게 설정되었는지 확인
- Production, Preview, Development 환경 모두 설정

### 빌드 오류
- `npm run build` 로컬에서 테스트
- TypeScript 오류 확인
- 의존성 설치 확인

### 런타임 오류
- Sentry 대시보드에서 에러 확인
- Vercel 로그 확인
- Supabase 연결 확인

---

**보스, 인프라 연결까지 완벽하게 준비되었습니다!** 🚀
