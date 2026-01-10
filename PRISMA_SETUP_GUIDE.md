# 🔧 Prisma 설정 가이드

**Field Nine - Prisma + Supabase 통합**

---

## 📋 1단계: 환경 변수 설정

### `.env` 파일에 DATABASE_URL 추가

Prisma는 Supabase PostgreSQL에 직접 연결합니다. `.env` 파일에 다음을 추가하세요:

```env
# Prisma Database URL (Supabase PostgreSQL)
# 형식: postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?pgbouncer=true
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres?pgbouncer=true"
```

### Supabase 연결 정보 찾기

1. **Supabase Dashboard** 접속: https://supabase.com/dashboard
2. 프로젝트 선택
3. **Settings** > **Database** 메뉴
4. **Connection string** 섹션에서 **URI** 복사
5. 비밀번호를 실제 비밀번호로 교체

**또는 Connection Pooling 사용 (권장):**
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:6543/postgres?pgbouncer=true"
```

---

## 📋 2단계: Supabase 마이그레이션 실행

### 2-1. Mall Inventory 테이블 생성

1. Supabase Dashboard > **SQL Editor**
2. `supabase/migrations/012_create_mall_inventory_table.sql` 파일 내용 복사
3. 붙여넣기 후 **Run** 클릭

### 2-2. Feature Subscriptions 테이블 생성

1. Supabase Dashboard > **SQL Editor**
2. `supabase/migrations/013_create_feature_subscriptions_table.sql` 파일 내용 복사
3. 붙여넣기 후 **Run** 클릭

---

## 📋 3단계: Prisma 마이그레이션

### 3-1. Prisma 스키마 확인

`prisma/schema.prisma` 파일이 올바르게 작성되었는지 확인:

```prisma
model Product {
  id          String         @id @default(cuid())
  name        String
  sku         String         @unique
  totalStock  Int            @default(0)
  mallStocks  MallInventory[]
  price       Int
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
}

model MallInventory {
  id        String   @id @default(cuid())
  mallName  String
  stock     Int      @default(0)
  product   Product  @relation(fields: [productId], references: [id])
  productId String
}

model FeatureSubscription {
  id          String   @id @default(cuid())
  featureId   String   @unique
  featureName String
  isActive    Boolean  @default(false)
  monthlyFee  Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 3-2. Prisma 마이그레이션 실행

```powershell
# Prisma가 데이터베이스를 스키마와 동기화
npx prisma db push

# 또는 마이그레이션 파일 생성 (버전 관리용)
npx prisma migrate dev --name init
```

### 3-3. Prisma Client 생성

```powershell
npx prisma generate
```

---

## 📋 4단계: Prisma Client 사용

### 4-1. Prisma Client 인스턴스 생성

`lib/prisma.ts` 파일 생성:

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### 4-2. 사용 예시

```typescript
import { prisma } from '@/lib/prisma'

// 상품 생성
const product = await prisma.product.create({
  data: {
    name: '새 상품',
    sku: 'SKU-001',
    price: 10000,
    totalStock: 100,
  },
})

// 쇼핑몰별 재고 분배
const mallStock = await prisma.mallInventory.create({
  data: {
    productId: product.id,
    mallName: '쿠팡',
    stock: 50,
  },
})

// 기능 구독 활성화
const feature = await prisma.featureSubscription.update({
  where: { featureId: 'ai-demand-forecast' },
  data: { isActive: true },
})
```

---

## 🔄 Supabase와 Prisma 통합 전략

### 현재 구조
- **Supabase Client**: 인증, 실시간 구독, RLS (Row Level Security)
- **Prisma Client**: 타입 안전한 데이터베이스 쿼리, 관계 관리

### 사용 권장 사항
- **Supabase Client**: 사용자 인증, RLS가 필요한 작업
- **Prisma Client**: 복잡한 쿼리, 관계 조인, 타입 안전성이 중요한 작업

---

## ✅ 체크리스트

- [ ] `.env` 파일에 `DATABASE_URL` 추가
- [ ] Supabase 마이그레이션 실행 (mall_inventory, feature_subscriptions)
- [ ] Prisma 마이그레이션 실행 (`npx prisma db push`)
- [ ] Prisma Client 생성 (`npx prisma generate`)
- [ ] `lib/prisma.ts` 파일 생성
- [ ] Prisma Client 사용 테스트

---

## 🐛 문제 해결

### 문제 1: DATABASE_URL 연결 실패
**해결:**
- Supabase Dashboard에서 연결 정보 확인
- 비밀번호가 올바른지 확인
- Connection Pooling 사용 시 포트 6543 사용

### 문제 2: 테이블이 이미 존재함
**해결:**
```powershell
# Prisma가 기존 테이블을 인식하도록
npx prisma db pull
```

### 문제 3: 타입 에러
**해결:**
```powershell
# Prisma Client 재생성
npx prisma generate
```

---

## 📚 참고 자료

- [Prisma 공식 문서](https://www.prisma.io/docs)
- [Supabase + Prisma 가이드](https://supabase.com/docs/guides/integrations/prisma)
- [Prisma Schema 참조](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)

---

**Prisma 설정 완료! 🎉**
