# ✅ Phase 2: DB 스키마 설계 완료 보고서

## 완료된 작업

### 1. Stores Table (상용 SaaS 수준) ✅
**파일**: `supabase/migrations/005_commercial_stores_table.sql`

**주요 기능**:
- 플랫폼 지원: 네이버, 쿠팡, 11번가, 지마켓, 옥션, 쇼피파이, 우커머스, 카페24, 메이크샵, 커스텀
- API 인증 정보 관리 (api_key, api_secret, access_token, refresh_token)
- 웹훅 설정 (webhook_url, webhook_secret)
- 동기화 설정 (sync_enabled, sync_interval_minutes, last_sync_at, last_sync_status)
- 플랫폼별 수수료율 관리 (fee_settings JSONB)
- RLS 정책 적용 (사용자는 자신의 스토어만 관리)

### 2. Products Table (상용 SaaS 수준) ✅
**파일**: `supabase/migrations/006_commercial_products_table.sql`

**주요 기능**:
- 상품 식별자: SKU, 바코드, 외부 상품 ID
- 가격 정보: 매입가(cost_price), 판매가(sale_price), 소매가(retail_price)
- 자동 계산: 마진 금액, 마진율 (계산된 컬럼)
- 재고 관리: 현재 재고, 예약 수량, 가용 재고, 최소/최대 재고 수준
- 배송 정보: 무게, 크기, 배송비, 무료배송 기준
- 옵션 정보: JSONB로 색상, 사이즈 등 관리
- 플랫폼별 정보: 각 플랫폼의 상품 ID 저장
- 재고 자동 업데이트 트리거 (주문 생성/취소 시)

### 3. Orders Table (상용 SaaS 수준) ✅
**파일**: `supabase/migrations/007_commercial_orders_table.sql`

**주요 기능**:
- 주문 식별자: 내부 주문번호(자동 생성), 외부 플랫폼 주문번호
- 상세 주문 상태: pending, confirmed, preparing, ready_to_ship, shipping, delivered, cancelled, refunded, exchanged
- 고객 정보: 이름, 이메일, 전화번호, 고객 ID
- 배송 정보: 수령인 정보, 주소, 배송 메모, 택배사, 송장번호
- 금액 정보: 상품 금액, 배송비, 할인 금액, 플랫폼 수수료, 결제 수수료, 최종 결제 금액
- 자동 계산: 총 원가, 순이익, 수익률 (계산된 컬럼)
- 결제 정보: 결제 수단, 결제 상태, 결제 완료 시각
- 주문 일시: 주문, 확인, 배송 시작, 배송 완료 시각
- 취소/환불 정보: 취소/환불 시각, 사유, 금액
- 주문번호 자동 생성 트리거 (ORD-YYYYMMDD-0001 형식)
- 상태 변경 시각 자동 업데이트 트리거

### 4. Order Items Table (상용 SaaS 수준) ✅
**파일**: `supabase/migrations/008_commercial_order_items_table.sql`

**주요 기능**:
- 주문 상세 품목 정보
- 상품 정보 스냅샷 (상품 삭제되어도 주문 기록 유지)
- 수량 및 가격: 단가(판매가), 단가(원가), 소계, 총 원가
- 할인 정보: 할인 금액, 할인율
- 자동 계산: 최종 금액, 수익, 수익률 (계산된 컬럼)
- 옵션 정보: JSONB로 색상, 사이즈 등 관리
- 주문 총액 자동 업데이트 트리거 (주문 상세 변경 시)

---

## 데이터베이스 관계도

```
users (1) ──< (N) stores
users (1) ──< (N) products
users (1) ──< (N) orders
stores (1) ──< (N) orders
orders (1) ──< (N) order_items
products (1) ──< (N) order_items
```

---

## 실행 방법

1. Supabase Dashboard 접속: https://app.supabase.com
2. 프로젝트 선택
3. 왼쪽 메뉴: **SQL Editor** 클릭
4. **New Query** 클릭
5. 다음 순서대로 SQL 파일 실행:
   - `005_commercial_stores_table.sql`
   - `006_commercial_products_table.sql`
   - `007_commercial_orders_table.sql`
   - `008_commercial_order_items_table.sql`
6. 각 파일 실행 후 성공 메시지 확인

---

## 주요 특징

### 1. 상용 서비스 수준의 디테일
- 수수료율, 배송비, 할인 정보 모두 포함
- 순이익, 수익률 자동 계산
- 주문 상태 상세 관리
- 재고 자동 업데이트

### 2. 데이터 무결성
- RLS 정책으로 사용자별 데이터 격리
- 외래키 제약 조건
- 계산된 컬럼으로 데이터 일관성 보장

### 3. 자동화
- 주문번호 자동 생성
- 주문 총액 자동 계산
- 재고 자동 업데이트
- 상태 변경 시각 자동 기록

---

## 다음 단계

**2. 핵심 API 구조 잡기**
- `/api/orders/sync/route.ts` 구현
- `/api/dashboard/stats/route.ts` 구현

**3. 대시보드 UI 고도화**
- Recharts로 실제 DB 데이터 연결
- TanStack Table로 주문 목록 Datatable 구현

---

**Phase 2 DB 스키마 설계 완료!** 🚀
