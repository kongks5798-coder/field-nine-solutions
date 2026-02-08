# 🖥️ 로컬 PostgreSQL 설정 가이드 (RTX 5090 AI 환경)

**목적: SaaS 종속성 제거, 로컬 우선 아키텍처**

---

## 🎯 왜 로컬 PostgreSQL?

### 장점
- ✅ **SaaS 종속성 제거**: Supabase 없이도 작동
- ✅ **RTX 5090 최적화**: 로컬 DB = 빠른 AI 학습
- ✅ **데이터 주권**: 모든 데이터가 내 컴퓨터에
- ✅ **비용 절감**: 클라우드 비용 없음
- ✅ **프라이버시**: 데이터가 외부로 나가지 않음

### 언제 사용?
- **개발 환경**: 로컬에서 빠르게 테스트
- **AI 학습**: RTX 5090에서 대량 데이터 처리
- **오프라인 작업**: 인터넷 없이도 작동
- **백업**: 로컬 복사본 유지

---

## 📋 설치 방법

### Windows (Docker 사용 - 추천)

```powershell
# 1. Docker Desktop 설치 (이미 있으면 스킵)
# https://www.docker.com/products/docker-desktop

# 2. PostgreSQL 컨테이너 실행
docker run --name fieldnine-postgres `
  -e POSTGRES_PASSWORD=your-secure-password `
  -e POSTGRES_DB=fieldnine `
  -p 5432:5432 `
  -d postgres:16

# 3. .env 파일에 연결 문자열 추가
DATABASE_URL="postgresql://postgres:your-secure-password@localhost:5432/fieldnine"
```

### Windows (직접 설치)

1. **PostgreSQL 다운로드**: https://www.postgresql.org/download/windows/
2. 설치 중 비밀번호 설정
3. `.env` 파일에 추가:
   ```env
   DATABASE_URL="postgresql://postgres:your-password@localhost:5432/fieldnine"
   ```

### Mac (Homebrew)

```bash
# PostgreSQL 설치
brew install postgresql@16

# 서비스 시작
brew services start postgresql@16

# 데이터베이스 생성
createdb fieldnine

# .env 파일에 추가
DATABASE_URL="postgresql://$(whoami)@localhost:5432/fieldnine"
```

---

## 🔄 Supabase ↔ 로컬 전환

### 환경 변수로 제어

`.env.local` (Supabase 사용):
```env
DATABASE_URL="postgresql://postgres:password@db.project.supabase.co:5432/postgres"
USE_SUPABASE=true
```

`.env.local` (로컬 사용):
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/fieldnine"
USE_SUPABASE=false
```

### 코드에서 자동 감지

```typescript
// lib/prisma.ts (이미 구현됨)
// DATABASE_URL만 변경하면 자동으로 로컬/클라우드 전환
```

---

## 🚀 초기 설정

### 1. Prisma 마이그레이션

```powershell
# 로컬 DB에 스키마 생성
npm run prisma:push

# 또는 마이그레이션 파일 생성
npx prisma migrate dev --name init
```

### 2. 샘플 데이터

```powershell
npm run prisma:seed
```

### 3. 확인

```powershell
# Prisma Studio 실행 (GUI로 데이터 확인)
npx prisma studio
```

---

## 🔄 데이터 동기화 (Supabase ↔ 로컬)

### Supabase → 로컬 (Export)

```typescript
// scripts/export-from-supabase.ts
import { exportAllDataForAI } from '@/lib/ai-data-access'
import fs from 'fs'

async function exportData() {
  const data = await exportAllDataForAI()
  fs.writeFileSync('backup.json', JSON.stringify(data, null, 2))
  console.log('✅ 데이터 Export 완료: backup.json')
}
```

### 로컬 → Supabase (Import)

```typescript
// scripts/import-to-supabase.ts
import { prisma } from '@/lib/prisma'
import fs from 'fs'

async function importData() {
  const data = JSON.parse(fs.readFileSync('backup.json', 'utf-8'))
  
  // mall_inventory 복원
  await prisma.mallInventory.createMany({
    data: data.mallInventory,
    skipDuplicates: true,
  })
  
  // feature_subscriptions 복원
  await prisma.featureSubscription.createMany({
    data: data.featureSubscriptions,
    skipDuplicates: true,
  })
  
  console.log('✅ 데이터 Import 완료')
}
```

---

## 🎯 RTX 5090 AI 환경 최적화

### 배치 처리 설정

```typescript
// lib/ai-data-access.ts의 loadBatchDataForTraining() 사용
// 대량 데이터를 배치로 로드하여 메모리 효율성 확보
```

### 연결 풀 최적화

```typescript
// lib/prisma.ts 수정
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // RTX 5090 환경 최적화
  log: ['error'],
})
```

---

## ✅ 체크리스트

- [ ] PostgreSQL 설치 (또는 Docker)
- [ ] `.env`에 `DATABASE_URL` 추가
- [ ] `npm run prisma:push` 실행
- [ ] `npm run prisma:seed` 실행
- [ ] `npx prisma studio`로 확인
- [ ] AI 함수 테스트 (`lib/ai-data-access.ts`)

---

**로컬 환경 준비 완료! 🎉**
