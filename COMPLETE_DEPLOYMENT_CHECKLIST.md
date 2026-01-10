# ✅ Field Nine: 완벽한 배포 체크리스트

**목표**: 100% 완벽한 배포 및 연결 확인

---

## 🔧 1. Vercel 환경 변수 설정 (필수)

Vercel Dashboard > Settings > Environment Variables에서 다음 변수 설정:

### 필수 변수

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=postgresql://user:password@host:port/database
NEXTAUTH_URL=https://your-deployment-url.vercel.app
NEXTAUTH_SECRET=your_random_secret_key_min_32_chars
```

### 선택 변수 (OAuth)

```
KAKAO_CLIENT_ID=your_kakao_client_id
KAKAO_CLIENT_SECRET=your_kakao_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Neural Nine AI (선택)

```
NEURAL_NINE_AI_URL=http://neural_nine_ai:8000
```

---

## 🗄️ 2. Supabase 마이그레이션 실행 (필수)

Supabase Dashboard > SQL Editor에서 다음 마이그레이션 실행:

1. `supabase/migrations/014_auto_deduct_inventory_trigger.sql`
2. `supabase/migrations/015_auto_update_order_status.sql`
3. `supabase/migrations/016_auto_calculate_fees.sql`

**실행 순서**:
1. SQL Editor 열기
2. 각 파일 내용 복사
3. 붙여넣기
4. Run 클릭
5. 성공 메시지 확인

---

## 🔗 3. 연결 테스트

### API Health Check

배포 후 다음 URL로 연결 테스트:

```
https://your-deployment-url.vercel.app/api/health
```

**예상 응답**:
```json
{
  "status": "ok",
  "message": "All systems operational",
  "database": "connected"
}
```

### 주요 페이지 테스트

- [ ] `/` - 홈페이지
- [ ] `/login` - 로그인 페이지
- [ ] `/dashboard` - 대시보드 (로그인 필요)
- [ ] `/dashboard/inventory` - 재고 관리
- [ ] `/dashboard/orders` - 주문 관리
- [ ] `/dashboard/analytics` - 분석 대시보드
- [ ] `/dashboard/settings` - 설정
- [ ] `/products/[id]` - 상품 상세

---

## 🐛 4. 일반적인 문제 해결

### 문제 1: "Next.js 버전이 설치되지 않았습니다"

**해결**:
1. `package.json`에서 `next` 버전 확인
2. Vercel Dashboard > Settings > General > Node.js Version을 20.x로 설정
3. 빌드 캐시 클리어
4. 재배포

### 문제 2: "Database connection failed"

**해결**:
1. `DATABASE_URL` 환경 변수 확인
2. Supabase 프로젝트가 활성화되어 있는지 확인
3. RLS 정책 확인

### 문제 3: "Authentication failed"

**해결**:
1. `NEXTAUTH_URL`이 프로덕션 URL과 일치하는지 확인
2. `NEXTAUTH_SECRET`이 설정되어 있는지 확인
3. OAuth Provider 설정 확인

---

## ✅ 5. 최종 확인 사항

- [ ] 모든 환경 변수 설정 완료
- [ ] Supabase 마이그레이션 실행 완료
- [ ] Vercel 배포 성공
- [ ] Health Check API 응답 확인
- [ ] 로그인 기능 작동 확인
- [ ] 상품 관리 기능 작동 확인
- [ ] 주문 동기화 기능 작동 확인
- [ ] 재고 자동 차감 작동 확인
- [ ] 분석 대시보드 차트 표시 확인

---

**완료 후**: 배포 URL을 공유하고 모든 기능이 정상 작동하는지 확인하세요!
