# 🗄️ Supabase 데이터베이스 스키마 설정 가이드

**이 가이드는 Supabase SQL Editor에서 products 테이블을 생성하는 방법을 설명합니다.**

---

## 📋 단계별 실행 방법

### 1단계: Supabase 대시보드 접속

1. 브라우저에서 접속:
   ```
   https://supabase.com/dashboard
   ```

2. 프로젝트 선택
   - 프로젝트 목록에서 `ivazoqddehjbfhmfdmck` 프로젝트 클릭

---

### 2단계: SQL Editor 열기

1. 왼쪽 메뉴에서 **"SQL Editor"** 클릭
   - 아이콘: `</>` (코드 아이콘)

2. **"New query"** 버튼 클릭
   - 화면 오른쪽 위에 있습니다

---

### 3단계: SQL 스크립트 복사 및 붙여넣기

1. 프로젝트 폴더에서 다음 파일 열기:
   ```
   supabase/migrations/011_create_products_table.sql
   ```

2. **전체 내용 복사** (Ctrl+A → Ctrl+C)

3. Supabase SQL Editor에 **붙여넣기** (Ctrl+V)

---

### 4단계: SQL 실행

1. SQL Editor 하단의 **"Run"** 버튼 클릭
   - 또는 키보드 단축키: `Ctrl + Enter`

2. 실행 결과 확인:
   - ✅ 성공: "Success. No rows returned" 메시지
   - ❌ 실패: 빨간색 에러 메시지 표시

---

### 5단계: 테이블 생성 확인

1. 왼쪽 메뉴에서 **"Table Editor"** 클릭
   - 아이콘: 테이블 모양

2. 테이블 목록에서 **"products"** 확인
   - 테이블이 보이면 성공!

3. 테이블 구조 확인:
   - `id`, `name`, `sku`, `price`, `stock`, `cost`, `category`, `image_url`, `user_id` 컬럼이 있어야 합니다

---

## 🔒 보안 확인 (RLS)

### Row Level Security 활성화 확인

1. **"Table Editor"**에서 `products` 테이블 클릭

2. 오른쪽 상단 **"..."** 메뉴 클릭

3. **"View policies"** 클릭

4. 다음 정책들이 있는지 확인:
   - ✅ "Users can view their own products" (SELECT)
   - ✅ "Users can insert their own products" (INSERT)
   - ✅ "Users can update their own products" (UPDATE)
   - ✅ "Users can delete their own products" (DELETE)

---

## ✅ 완료 확인

다음 항목들이 모두 완료되었는지 확인:

- [ ] SQL 스크립트 실행 완료
- [ ] `products` 테이블이 Table Editor에 표시됨
- [ ] RLS 정책 4개가 모두 생성됨
- [ ] 에러 메시지 없음

---

## 🚨 문제 해결

### "relation already exists" 에러

**원인:** 테이블이 이미 존재함

**해결:**
1. Table Editor에서 `products` 테이블 삭제
2. SQL 스크립트 다시 실행

또는 SQL 스크립트의 `CREATE TABLE IF NOT EXISTS` 구문이 자동으로 처리합니다.

---

### "permission denied" 에러

**원인:** 권한 문제

**해결:**
1. Supabase 대시보드에서 올바른 프로젝트를 선택했는지 확인
2. 프로젝트 소유자인지 확인

---

### RLS 정책이 생성되지 않음

**원인:** 정책 생성 SQL이 실행되지 않음

**해결:**
1. SQL Editor에서 정책 생성 부분만 다시 실행:
   ```sql
   CREATE POLICY "Users can view their own products" ...
   ```
2. 각 정책을 하나씩 실행

---

## 📝 다음 단계

데이터베이스 스키마 생성이 완료되면:

1. ✅ 환경 변수 설정 확인 (`.env.local`)
2. ✅ 앱 재시작 (`npm run dev`)
3. ✅ `/dashboard/inventory` 페이지에서 테스트
4. ✅ "상품 추가" 버튼으로 실제 데이터 저장 테스트

---

## 💡 참고사항

### 테이블 구조

- **id**: UUID (자동 생성)
- **user_id**: 현재 로그인한 사용자 ID (RLS용, 자동 설정)
- **created_at**: 자동 생성
- **updated_at**: 자동 업데이트 (트리거)

### 인덱스

다음 컬럼에 인덱스가 생성되어 검색 성능이 향상됩니다:
- `user_id` (사용자별 조회)
- `sku` (SKU 검색)
- `category` (카테고리 필터)
- `stock` (재고 부족 상품 조회)

---

**완료되면 앱에서 실제 데이터를 사용할 수 있습니다!** 🎉
