# 🚀 TrendStream

**인스타그램/틱톡 비전 분석 기반 패션 트렌드 예측 SaaS**

> "Next Week's Bestsellers, Today"

## 📊 프로젝트 진행률: **85%**

### Phase별 완료도
- ✅ Phase 1: Foundation (100%)
- ✅ Phase 2: Backend Integration (100%)
- ✅ Phase 3: Full Feature (100%)
- 🚧 Phase 4: Production (60%)

## 🎯 주요 기능

### ✅ 완료된 기능
- **랜딩 페이지**: Tesla Style 미니멀 디자인
- **대시보드**: 해시태그 분석 및 결과 표시
- **사용자 인증**: Supabase Auth 통합
- **분석 히스토리**: 과거 분석 결과 조회
- **Python 백엔드**: FastAPI 서버 (Mock AI)
- **보안**: Rate Limiting, Input Validation
- **로깅**: 통합 로깅 시스템

### ⏳ 진행 중
- 실제 크롤링 API 통합
- 실제 비전 AI 모델 통합
- 구독 결제 시스템
- 모니터링 대시보드

## 🚀 빠른 시작

### 1. 환경 설정

```bash
# 의존성 설치
npm install

# 환경 변수 설정 (.env.local)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
PYTHON_BACKEND_URL=http://localhost:8000
```

### 2. Python 백엔드 실행

```bash
cd python_backend
pip install -r requirements.txt
python main.py
```

### 3. Next.js 프론트엔드 실행

```bash
npm run dev
```

### 4. Supabase 설정

```bash
# Supabase SQL Editor에서 실행
cat supabase/schema.sql
```

## 📁 프로젝트 구조

```
/
  /app              # Next.js App Router
  /components       # React 컴포넌트
  /lib              # 유틸리티 및 Supabase 클라이언트
  /store            # Zustand 상태 관리
  /python_backend   # FastAPI 서버
  /supabase         # 데이터베이스 스키마
```

## 🎨 디자인 시스템

- **Background**: #F9F9F7 (Warm Ivory)
- **Text**: #171717 (Deep Black)
- **Accent**: #C0392B (Vintage Red)
- **Border Radius**: 최대 4px
- **Font**: Inter (영문), Pretendard (한글)

## 🔒 보안

- ✅ Rate Limiting (1분당 10회)
- ✅ Input Validation
- ✅ RLS (Row Level Security)
- ✅ 보안 헤더 (CSP, XSS Protection)
- ✅ 인증 미들웨어

## 📦 배포

### Docker
```bash
docker build -t trendstream .
docker run -p 3000:3000 trendstream
```

### Vercel
```bash
vercel --prod
```

## 📚 문서

- [PROJECT_SPEC.md](./PROJECT_SPEC.md) - 프로젝트 명세서
- [PROJECT_PROGRESS.md](./PROJECT_PROGRESS.md) - 진행률 리포트
- [PHASE_1_COMPLETE.md](./PHASE_1_COMPLETE.md) - Phase 1 완료 보고
- [PHASE_2_COMPLETE.md](./PHASE_2_COMPLETE.md) - Phase 2 완료 보고
- [PHASE_3_COMPLETE.md](./PHASE_3_COMPLETE.md) - Phase 3 완료 보고
- [PHASE_4_COMPLETE.md](./PHASE_4_COMPLETE.md) - Phase 4 완료 보고

---

**보스, 인프라 연결까지 완벽하게 준비되었습니다!** 🚀
