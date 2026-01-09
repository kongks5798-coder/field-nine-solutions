# 🚀 Field Nine Core System - 완성 가이드

**프로젝트 상태:** ✅ Phase 1 & 2 완료 (Sidebar Layout + Inventory System)

---

## 📁 새로 생성된 파일 위치

### 1. UI 컴포넌트 (Shadcn/UI 기반)

**위치:** `components/ui/`

- **`button.tsx`** - 버튼 컴포넌트 (다양한 스타일 지원)
- **`input.tsx`** - 입력 필드 컴포넌트
- **`table.tsx`** - 테이블 컴포넌트 (재고 목록 표시용)
- **`dialog.tsx`** - 모달 다이얼로그 (상품 추가 폼용)

**설명:**
- 모든 UI 컴포넌트는 Shadcn/UI 스타일을 따릅니다
- Field Nine 브랜드 컬러 (`#1A5D3F`) 적용
- 재사용 가능한 컴포넌트로 설계

---

### 2. 레이아웃 컴포넌트

**위치:** `components/layout/`

- **`SidebarLayout.tsx`** - 메인 사이드바 레이아웃

**기능:**
- 좌측 사이드바 (데스크톱)
- 모바일 반응형 메뉴
- 활성 라우트 하이라이트
- 사용자 정보 표시

**사용법:**
```tsx
<SidebarLayout userName="홍길동" userEmail="user@example.com">
  <YourPageContent />
</SidebarLayout>
```

---

### 3. 타입 정의

**위치:** `types/`

- **`product.ts`** - 상품 타입 정의

**포함 내용:**
- `Product` 인터페이스 (상품 데이터 구조)
- `ProductFormData` 인터페이스 (상품 추가/수정 폼)

---

### 4. Mock 데이터

**위치:** `lib/`

- **`mock-data.ts`** - 임시 상품 데이터

**포함 내용:**
- 8개의 샘플 상품 데이터
- `getAllProducts()` - 모든 상품 조회
- `getProductById()` - ID로 상품 조회
- `getLowStockProducts()` - 재고 부족 상품 조회

**중요:** 나중에 Supabase로 교체 예정

---

### 5. 유틸리티 함수

**위치:** `lib/`

- **`utils.ts`** - `cn()` 함수 (Tailwind 클래스 병합)

---

### 6. 페이지 파일

**위치:** `app/dashboard/`

#### 수정된 파일:
- **`page.tsx`** - 대시보드 메인 페이지 (새 SidebarLayout 사용)

#### 새로 생성된 파일:
- **`inventory/page.tsx`** - 재고 관리 페이지

**기능:**
- ✅ 상품 목록 테이블
- ✅ 검색 기능 (상품명, SKU, 카테고리)
- ✅ 재고 부족 필터
- ✅ 가격 정렬 (오름차순/내림차순)
- ✅ 상품 추가 모달
- ✅ 재고 부족 경고 표시

---

## 🎨 디자인 시스템

### 색상 팔레트

- **Primary Green:** `#1A5D3F` (Field Nine 브랜드 컬러)
- **Background:** `#F9F9F7` (아이보리 배경)
- **Text Primary:** `#171717` (진한 회색)
- **Text Muted:** `#6B6B6B` (회색)
- **Border:** `#E5E5E0` (연한 회색)
- **Hover:** `#F5F5F5` (호버 배경)

### 폰트

- **Sans:** Geist Sans (기본)
- **Mono:** Geist Mono (SKU 표시용)

---

## 🔧 사용 방법

### 1. 대시보드 접속

1. 로그인 후 `/dashboard` 접속
2. 좌측 사이드바에서 메뉴 선택:
   - **Dashboard** - 홈 (통계 및 빠른 액션)
   - **Inventory** - 재고 관리
   - **Orders** - 주문 관리
   - **Settings** - 설정

### 2. 재고 관리 페이지 사용

**접속:** `/dashboard/inventory`

**기능 사용법:**

1. **검색:**
   - 상단 검색창에 상품명, SKU, 카테고리 입력
   - 실시간으로 필터링됨

2. **재고 부족 필터:**
   - "재고 부족만" 버튼 클릭
   - 재고가 10개 미만인 상품만 표시

3. **가격 정렬:**
   - "가격 정렬" 버튼 클릭
   - 오름차순 → 내림차순 → 정렬 없음 순서로 전환

4. **상품 추가:**
   - "상품 추가" 버튼 클릭
   - 모달에서 정보 입력
   - 필수: 상품명, SKU, 판매가
   - 선택: 원가, 재고 수량, 카테고리

---

## 🚧 향후 개발 예정 (Placeholder)

### AI 자동화 모듈

**위치:** `lib/mock-data.ts`, `app/dashboard/page.tsx`

코드에 다음 주석이 있습니다:
```typescript
// TODO: Add AI Stock Prediction Module Here
// TODO: Add Coupang/Naver API Integration Here
```

**추가 예정 기능:**
- 재고 소진 예측 (AI)
- 자동 주문 생성
- 스마트 분석

### API 통합 준비

**현재:** Mock 데이터 사용
**향후:** Supabase 데이터베이스 연결

**교체 위치:**
- `lib/mock-data.ts` → Supabase 쿼리로 교체
- `app/dashboard/inventory/page.tsx` → API 호출로 교체

---

## 📝 코드 구조 설명

### 컴포넌트 계층 구조

```
app/dashboard/
├── page.tsx (Dashboard 메인)
│   └── SidebarLayout
│       └── DashboardStats
│
└── inventory/
    └── page.tsx (Inventory 페이지)
        └── SidebarLayout
            ├── Search & Filters
            ├── Product Table
            └── Add Product Modal
```

### 데이터 흐름

1. **Mock 데이터:**
   ```
   lib/mock-data.ts → getAllProducts() → products 배열
   ```

2. **상태 관리:**
   ```
   useState → filteredProducts (검색/필터/정렬 적용)
   ```

3. **UI 렌더링:**
   ```
   filteredProducts → Table 컴포넌트 → 화면 표시
   ```

---

## ✅ 완료된 기능

- [x] Sidebar Layout 컴포넌트 생성
- [x] 대시보드 페이지 리팩토링
- [x] 재고 관리 페이지 생성
- [x] 상품 테이블 (검색, 필터, 정렬)
- [x] 상품 추가 모달
- [x] Mock 데이터 구조
- [x] Shadcn/UI 컴포넌트 설정

---

## 🔜 다음 단계 (Phase 3)

1. **Dark Mode 추가**
   - 다크 모드 토글 버튼
   - 전역 스타일 업데이트

2. **Supabase 연동**
   - Mock 데이터 → 실제 데이터베이스
   - CRUD API 구현

3. **주문 관리 페이지**
   - 주문 목록 테이블
   - 주문 상태 관리

4. **AI 모듈 통합**
   - 재고 예측 알고리즘
   - 자동화 스크립트

---

## 💡 개발 팁

### 새 상품 추가하기

1. `lib/mock-data.ts` 파일 열기
2. `mockProducts` 배열에 새 객체 추가:
```typescript
{
  id: "9",
  name: "새 상품명",
  sku: "NEW-009",
  price: 50000,
  stock: 20,
  // ... 기타 필드
}
```

### 스타일 수정하기

- **색상:** `app/globals.css`의 CSS 변수 수정
- **컴포넌트 스타일:** `components/ui/` 폴더의 각 컴포넌트 파일 수정

### 새 페이지 추가하기

1. `app/dashboard/새페이지/page.tsx` 생성
2. `SidebarLayout`으로 감싸기
3. `components/layout/SidebarLayout.tsx`의 `navItems` 배열에 메뉴 추가

---

## 🐛 문제 해결

### 빌드 에러 발생 시

1. **타입 에러:**
   - `npm run build` 실행하여 에러 확인
   - TypeScript 타입 정의 확인

2. **모듈을 찾을 수 없음:**
   - `npm install` 재실행
   - `node_modules` 삭제 후 재설치

### 페이지가 보이지 않을 때

1. **라우팅 확인:**
   - 파일 경로가 `app/dashboard/inventory/page.tsx`인지 확인
   - Next.js App Router 규칙 준수

2. **컴포넌트 import 확인:**
   - 모든 import 경로가 올바른지 확인
   - `@/` 별칭이 `tsconfig.json`에 정의되어 있는지 확인

---

## 📞 지원

문제가 발생하면:
1. 브라우저 콘솔 확인 (F12)
2. 터미널 에러 메시지 확인
3. 코드 주석의 TODO 항목 확인

---

**축하합니다! Field Nine Core System의 기본 구조가 완성되었습니다!** 🎉
