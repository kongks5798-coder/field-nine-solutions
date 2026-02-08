# 🚀 Jarvis Quick Start - Field Nine

**보스님, 3분 안에 시작하는 가이드입니다.**

---

## 📋 필수 작업 (한 번만)

### 1. 환경 변수 설정

`.env` 파일에 추가:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres?pgbouncer=true"
```

**찾는 방법:**
1. Supabase Dashboard > Settings > Database
2. Connection string (URI) 복사
3. 비밀번호 교체

### 2. Supabase 마이그레이션 실행

**Supabase Dashboard > SQL Editor**에서 실행:

1. `supabase/migrations/012_create_mall_inventory_table.sql` 복사 → 실행
2. `supabase/migrations/013_create_feature_subscriptions_table.sql` 복사 → 실행

### 3. Prisma 마이그레이션

```powershell
# Prisma Client 생성
npm run prisma:generate

# 데이터베이스와 동기화
npm run prisma:push

# 샘플 데이터 넣기 (선택)
npm run prisma:seed
```

---

## ✅ 완료!

이제 사용할 수 있습니다:

```typescript
import { getMallStocks, updateMallStock } from '@/lib/prisma-helpers'

// 쇼핑몰별 재고 조회
const stocks = await getMallStocks('supabase-product-uuid')

// 재고 업데이트
await updateMallStock('supabase-product-uuid', '쿠팡', 50)
```

---

**문제 발생 시:** `JARVIS_FINAL_RECOMMENDATION.md` 참고
