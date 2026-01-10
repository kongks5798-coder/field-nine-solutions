# 🌐 Field Nine 전체 사이트 개요

**보스님, Field Nine 사이트의 전체 구조를 한눈에 보여드립니다.**

---

## 📍 사이트 맵

```
fieldnine.io (또는 Vercel URL)
│
├── 📄 공개 페이지 (인증 불필요)
│   ├── /                    → 자동 리다이렉트 (로그인 시 /dashboard, 미로그인 시 /login)
│   ├── /login               → 카카오톡/구글 로그인
│   ├── /intro               → 서비스 소개
│   ├── /pricing             → 요금 안내
│   ├── /cases               → 고객 사례
│   └── /contact             → 문의하기
│
├── 🏠 대시보드 (인증 필요)
│   ├── /dashboard           → 메인 대시보드 (통계, 빠른 액션)
│   ├── /dashboard/inventory → 재고 관리 (상품 CRUD)
│   ├── /dashboard/orders    → 주문 관리 (주문 조회/수정/동기화)
│   ├── /dashboard/settings  → 설정 (스토어 연결, API 키 관리)
│   └── /dashboard/analytics → 분석 대시보드
│
├── 🤖 AI 기능
│   └── /ai-demo             → AI 데모 센터 (로그인 필요)
│       ├── 수요 예측 (Demand Forecasting)
│       ├── 재고 최적화 (Inventory Optimization)
│       ├── 가격 최적화 (Pricing Optimization)
│       └── 기능 추천 (Feature Recommendation)
│
└── 🔧 디버그/진단
    ├── /debug-env           → 환경 변수 디버거
    └── /diagnosis           → 시스템 진단
```

---

## 🎨 페이지별 상세 설명

### 1. 홈 페이지 (`/`)

**기능**: 세션 확인 후 자동 리다이렉트
- 로그인된 사용자 → `/dashboard`
- 미로그인 사용자 → `/login`

**구현**: `app/page.tsx` (Server Component)

---

### 2. 로그인 페이지 (`/login`)

**기능**:
- 카카오톡 OAuth 로그인
- 구글 OAuth 로그인
- NextAuth.js 세션 관리

**UI 요소**:
- Field Nine 로고
- 카카오톡 로그인 버튼 (노란색)
- 구글 로그인 버튼 (흰색)
- 로딩 상태 표시

**구현**: `app/login/page.tsx` (Client Component)

**인증 플로우**:
1. 사용자가 로그인 버튼 클릭
2. NextAuth.js가 OAuth Provider로 리다이렉트
3. 인증 성공 후 JWT 토큰 생성
4. `/dashboard`로 리다이렉트

---

### 3. 메인 대시보드 (`/dashboard`)

**기능**:
- 매출 통계 (DashboardStats 컴포넌트)
  - 총 매출
  - 총 주문 수
  - 평균 주문 금액
  - 저재고 상품 알림
- 빠른 액션 버튼
  - 재고 관리
  - 주문 관리
  - 설정
  - AI 데모
- AI 자동화 준비 섹션

**레이아웃**: SidebarLayout 사용
- 왼쪽 사이드바 (네비게이션)
- 상단 헤더 (페이지 제목)
- 메인 콘텐츠 영역

**구현**: `app/dashboard/page.tsx` (Server Component)

---

### 4. 재고 관리 (`/dashboard/inventory`)

**기능**:
- 상품 목록 조회 (Supabase)
- 상품 추가/수정/삭제
- 재고 현황 표시
- 검색 및 필터링

**데이터 소스**: Supabase `products` 테이블

**구현**: `app/dashboard/inventory/page.tsx` (Client Component)

---

### 5. 주문 관리 (`/dashboard/orders`)

**기능**:
- 주문 목록 조회 (Supabase)
- 주문 상태 변경 (PAID, PREPARING, SHIPPED, DELIVERED, CANCELLED)
- 주문 검색/필터링
- 주문 상세 보기 (모달)
- 외부 플랫폼 주문 동기화

**데이터 소스**: Supabase `orders`, `order_items` 테이블

**구현**: `app/dashboard/orders/page.tsx` (Client Component)

---

### 6. 설정 (`/dashboard/settings`)

**기능**:
- 스토어 연결 관리
- API 키 암호화 저장/관리
- 사용자 설정

**보안**: API 키는 AES-256-GCM으로 암호화되어 저장

**구현**: `app/dashboard/settings/page.tsx`

---

### 7. AI 데모 센터 (`/ai-demo`)

**기능**: RTX 5090 AI 기능 테스트

#### 7.1 수요 예측 (Demand Forecasting)
- **API**: `/api/ai/forecast`
- **기능**: 과거 데이터 기반 수요 예측
- **입력**: `productId`, `timeframe` (daily/weekly/monthly)
- **출력**: 예측 수요량, 신뢰도, 히스토리 데이터 포인트

#### 7.2 재고 최적화 (Inventory Optimization)
- **API**: `/api/ai/optimize-inventory`
- **기능**: 쇼핑몰별 최적 재고 분배
- **입력**: `productId`, `targetDistribution` (쇼핑몰별 목표 비율)
- **출력**: 현재 분배, 제안 분배, 적용 가능 여부

#### 7.3 가격 최적화 (Pricing Optimization)
- **API**: `/api/ai/optimize-pricing`
- **기능**: 시장 데이터 기반 가격 조정
- **입력**: `productId`, `strategy` (aggressive/balanced/conservative)
- **출력**: 현재 가격, 제안 가격, 예상 매출 증가

#### 7.4 기능 추천 (Feature Recommendation)
- **API**: `/api/ai/recommend-features`
- **기능**: 사용자 예산 기반 기능 추천
- **입력**: `userId`, `monthlyBudget`, `currentSubscriptions`
- **출력**: 추천 기능 목록, 총 비용, 남은 예산

**인증**: NextAuth.js 세션 필요 (미로그인 시 `/login`으로 리다이렉트)

**구현**: `app/ai-demo/page.tsx` (Client Component)

---

## 🔐 인증 및 보안

### 인증 시스템
- **프레임워크**: NextAuth.js v5
- **Providers**: 카카오톡, 구글
- **세션 관리**: JWT 토큰
- **데이터베이스**: Prisma (Account, Session, User 테이블)

### 보안 기능
- API 키 암호화 (AES-256-GCM)
- Supabase RLS (Row Level Security)
- 미들웨어 인증 체크
- 환경 변수 보호

---

## 🗄️ 데이터베이스 구조

### Supabase (PostgreSQL)
- `products` - 상품 정보
- `orders` - 주문 정보
- `order_items` - 주문 상품 상세
- `stores` - 스토어 연결 정보
- `users` - 사용자 정보

### Prisma (로컬/클라우드 PostgreSQL)
- `MallInventory` - 쇼핑몰별 재고 분배
- `FeatureSubscription` - 기능 구독
- NextAuth.js 테이블 (Account, Session, User, VerificationToken)

---

## 🎨 디자인 시스템

### 색상
- **Primary**: #1A5D3F (Field Nine Green)
- **Background**: #F9F9F7 (Light), #0F0F0F (Dark)
- **Text**: #171717 (Light), #F5F5F5 (Dark)
- **Border**: #E5E5E0 (Light), #2A2A2A (Dark)

### 폰트
- **Sans**: Geist Sans
- **Mono**: Geist Mono

### 컴포넌트
- Shadcn/UI 기반
- Tailwind CSS 스타일링
- 다크 모드 완전 지원

---

## 📱 반응형 디자인

### 브레이크포인트
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### 모바일 최적화
- 사이드바 → 햄버거 메뉴
- 테이블 → 스크롤 가능한 카드 뷰
- 터치 친화적 버튼 크기

---

## 🚀 배포 정보

### 플랫폼
- **호스팅**: Vercel
- **지역**: ICN1 (서울)
- **빌드 시간**: ~34초

### 환경 변수
필요한 환경 변수는 `.env.example` 참조

### 커스텀 도메인
- **예정**: fieldnine.io
- **현재**: Vercel 자동 생성 URL 사용

---

## 📊 성능 지표

### 로딩 시간
- **초기 로드**: < 2초
- **페이지 전환**: < 500ms
- **API 응답**: < 1초

### 최적화
- 이미지 최적화 (Next.js Image)
- 코드 스플리팅
- 정적 생성 (가능한 페이지)

---

## 🔄 업데이트 로그

### 최근 업데이트
- ✅ AI 데모 페이지 완성
- ✅ 로그인 기능 (카카오톡/구글) 완성
- ✅ 재고/주문 관리 완성
- ✅ 다크 모드 지원
- ✅ 반응형 디자인 완성

### 다음 업데이트 예정
- ⏳ 커스텀 도메인 연결
- ⏳ E2E 테스트
- ⏳ 프로덕션 모니터링

---

**Field Nine - 비즈니스의 미래를 함께** 🚀
