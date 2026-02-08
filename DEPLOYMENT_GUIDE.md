# 🚀 Field Nine 상용 SaaS 배포 가이드

## 1단계: 데이터베이스 마이그레이션

### Supabase Dashboard에서 실행할 SQL 파일들

다음 순서대로 Supabase Dashboard > SQL Editor에서 실행하세요:

1. **`supabase/migrations/001_create_users_table.sql`**
   - `public.users` 테이블 생성
   - 자동 생성 Trigger 함수 설정
   - RLS 정책 적용

2. **`supabase/migrations/002_create_stores_table.sql`**
   - `public.stores` 테이블 생성 (쇼핑몰 연동 정보)
   - RLS 정책 적용

3. **`supabase/migrations/003_update_orders_table.sql`**
   - `orders` 테이블에 `user_id`, `store_id` 컬럼 추가
   - RLS 정책 업데이트 (user_id 기반)

4. **`supabase/migrations/004_update_products_table.sql`**
   - `products` 테이블에 `user_id`, `cost_price`, `selling_price`, `margin_rate` 컬럼 추가
   - RLS 정책 업데이트 (user_id 기반)

### 실행 방법

1. https://app.supabase.com 접속
2. 프로젝트 선택
3. 왼쪽 메뉴: **SQL Editor** 클릭
4. **New Query** 클릭
5. 각 SQL 파일의 내용을 복사하여 붙여넣기
6. **Run** 버튼 클릭
7. 성공 메시지 확인

---

## 2단계: OAuth 설정 확인

### Google OAuth
1. Supabase Dashboard > **Authentication** > **Providers** > **Google**
2. **Enable Google** 토글 ON
3. Google Cloud Console에서 Client ID/Secret 가져오기
4. **Authorized redirect URIs**에 추가:
   ```
   https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
   ```

### Kakao OAuth
1. Supabase Dashboard > **Authentication** > **Providers** > **Kakao**
2. **Enable Kakao** 토글 ON
3. Kakao Developers에서 REST API 키 가져오기
4. **Redirect URI**에 추가:
   ```
   https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
   ```

---

## 3단계: 환경 변수 확인

`.env.local` 파일에 다음 변수들이 설정되어 있는지 확인:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## 4단계: 테스트

1. 개발 서버 실행:
   ```bash
   npm run dev
   ```

2. 브라우저에서 `http://localhost:3000/login` 접속

3. Google 또는 Kakao 로그인 테스트

4. 로그인 후 `public.users` 테이블에 데이터가 생성되었는지 확인:
   - Supabase Dashboard > **Table Editor** > **users** 테이블

---

## ✅ 완료 체크리스트

- [ ] 모든 마이그레이션 SQL 실행 완료
- [ ] OAuth 프로바이더 활성화 완료
- [ ] 환경 변수 설정 완료
- [ ] 로그인 테스트 성공
- [ ] `public.users` 테이블에 데이터 생성 확인

---

## 🐛 문제 해결

### "users 테이블이 없다" 오류
- `001_create_users_table.sql`을 다시 실행하세요.

### "OAuth 로그인이 안 된다"
- Supabase Dashboard에서 OAuth 프로바이더가 활성화되어 있는지 확인
- Redirect URI가 올바르게 설정되어 있는지 확인

### "RLS 정책 오류"
- 각 마이그레이션 파일의 RLS 정책이 올바르게 적용되었는지 확인
- Supabase Dashboard > **Authentication** > **Policies**에서 확인
