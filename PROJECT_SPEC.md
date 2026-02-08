# TrendStream Master Blueprint

## 1. Project Identity
- **Name:** TrendStream
- **Goal:** 인스타그램/틱톡 비전 분석 기반 패션 트렌드 예측 SaaS
- **Target:** 1인 셀러, 동대문 도매/소매업자
- **Value Proposition:** "Next Week's Bestsellers, Today" - AI가 소셜미디어를 실시간 분석하여 다음 주에 팔릴 옷을 예측

## 2. Design System (Tesla Style)
- **Background:** #F9F9F7 (Warm Ivory) - 전체 배경색, 고급스러운 느낌
- **Text:** #171717 (Deep Black) - 최고 가독성을 위한 진한 검정
- **Accent:** #C0392B (Vintage Red) - 포인트 컬러, CTA 버튼 등에 사용
- **Font:** 
  - Inter (English) - 영문 폰트, 깔끔하고 모던한 느낌
  - Pretendard (Korean) - 한글 폰트, 가독성 최우선
- **Vibe:** Minimal, Sharp, Professional
- **Border Radius:** 최대 4px - 둥근 모서리 최소화로 날카롭고 전문적인 느낌

## 3. Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router) - 서버 사이드 렌더링 및 최적화
- **Language:** TypeScript - 타입 안정성 보장
- **Styling:** Tailwind CSS - 유틸리티 퍼스트 CSS 프레임워크
- **UI Components:** Shadcn/UI - 접근성과 디자인 품질이 검증된 컴포넌트
- **Icons:** Lucide React - 일관된 아이콘 시스템
- **State Management:** Zustand - 가볍고 빠른 상태 관리

### Backend (Local AI)
- **Framework:** Python FastAPI - 고성능 비동기 API 서버
- **Hardware:** Local GPU (5090) - 비전 분석 AI 모델 실행
- **Purpose:** 인스타그램/틱톡 이미지 크롤링 및 비전 분석

### Database
- **Platform:** Supabase - PostgreSQL 기반 백엔드 서비스
- **Usage:** 사용자 데이터, 분석 결과 저장, 인증

## 4. Directory Structure Plan

```
/
  /app (Next.js App Router Pages)
    /dashboard
    /api
    layout.tsx
    page.tsx
    globals.css
  
  /components
    /ui (Shadcn Components)
    /dashboard (Business Logic Components)
    /landing (Marketing Components)
  
  /lib
    /utils (Utility Functions)
    /supabase (Supabase Client Setup)
  
  /store (Zustand State Management)
    /slices
  
  /python_backend (AI Engine - Separate Folder)
    /routers (FastAPI Routes)
    /services (Crawling, Analysis Services)
    main.py
    requirements.txt
```

## 5. Core Features (MVP)

### Landing Page
- **Hero Section:**
  - 헤드카피: "TrendStream: Next Week's Bestsellers, Today"
  - 서브카피: AI 분석 설명
  - CTA 버튼: "Get Started" → 대시보드로 이동
- **Design:** 미니멀, 압도적인 첫인상, Tesla Style 엄격 준수

### Dashboard
- **Search Bar:** 인스타그램 해시태그 입력 (#OOTD 등)
- **Analysis Results:**
  - Top 3 Colors (예측된 인기 색상)
  - Top 3 Items (예측된 인기 아이템)
- **Real-time Updates:** 분석 진행 상태 표시

## 6. Business Logic

### AI Analysis Flow
1. 사용자가 해시태그 입력 (#OOTD, #fashion 등)
2. Python 백엔드가 인스타그램/틱톡 크롤링
3. 비전 AI 모델이 이미지 분석 (색상, 아이템 추출)
4. 트렌드 예측 알고리즘 실행
5. 결과를 Supabase에 저장
6. 프론트엔드에 실시간 업데이트

### Target User Journey
1. **Discovery:** 랜딩 페이지에서 서비스 발견
2. **Sign Up:** 간단한 회원가입 (Supabase Auth)
3. **First Analysis:** 첫 해시태그 분석 실행
4. **Results:** 예측 결과 확인
5. **Action:** 예측된 트렌드 기반으로 상품 구매/판매 결정

## 7. Technical Requirements

### Performance
- **Page Load:** < 2초 (Lighthouse 기준)
- **API Response:** < 3초 (분석 결과 반환)
- **Real-time Updates:** WebSocket 또는 Server-Sent Events

### Security
- **Authentication:** Supabase Auth (이메일/소셜 로그인)
- **API Security:** Rate Limiting, CORS 설정
- **Data Privacy:** 사용자 데이터 암호화

### Scalability
- **Database:** Supabase 자동 스케일링
- **AI Backend:** GPU 서버 독립 운영 (로컬 5090)
- **Frontend:** Vercel 배포 (자동 스케일링)

## 8. Development Phases

### Phase 1: Foundation (Current)
- ✅ PROJECT_SPEC.md 작성
- ✅ 디자인 시스템 적용
- ✅ 랜딩 페이지 구현
- ✅ 기본 대시보드 UI

### Phase 2: Backend Integration
- Python FastAPI 서버 구축
- 인스타그램/틱톡 크롤링 서비스
- 비전 AI 모델 통합
- Supabase 스키마 설계

### Phase 3: Full Feature
- 사용자 인증 (Supabase Auth)
- 실시간 분석 결과 표시
- 분석 히스토리 저장
- 구독 결제 시스템

### Phase 4: Production
- 성능 최적화
- 보안 강화
- 모니터링 및 로깅
- 배포 및 CI/CD

## 9. Success Metrics

### User Metrics
- **Sign-up Rate:** 랜딩 페이지 방문 대비 가입률
- **Active Users:** 주간 활성 사용자 수
- **Analysis Frequency:** 사용자당 월평균 분석 횟수

### Business Metrics
- **Conversion Rate:** 무료 → 유료 전환율
- **Churn Rate:** 구독 해지율
- **MRR (Monthly Recurring Revenue):** 월간 반복 수익

### Technical Metrics
- **API Uptime:** 99.9% 이상
- **Analysis Accuracy:** 예측 정확도 (사후 검증)
- **Response Time:** 평균 API 응답 시간

---

**이 명세서는 TrendStream 프로젝트의 모든 개발 작업의 기준이 됩니다.**
**모든 코드는 이 명세서를 엄격히 준수하여 작성됩니다.**
