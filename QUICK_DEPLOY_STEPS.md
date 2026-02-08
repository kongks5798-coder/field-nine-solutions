# ⚡ 빠른 배포 가이드 (5분 완성)

## 1️⃣ GitHub 저장소 생성 및 푸시

```bash
# 현재 디렉토리에서
cd c:\Users\polor\field-nine-solutions

# Git 초기화 (이미 되어있다면 스킵)
git init
git add .
git commit -m "Field Nine 100% 완성본"

# GitHub 저장소 연결 (YOUR_USERNAME 변경)
git remote add origin https://github.com/YOUR_USERNAME/field-nine-solutions.git
git branch -M main
git push -u origin main
```

## 2️⃣ Vercel 프로젝트 생성

1. https://vercel.com 접속
2. `Add New...` → `Project`
3. GitHub 저장소 `field-nine-solutions` 선택
4. **프로젝트 설정**:
   - Framework: `Next.js` (자동)
   - Root Directory: `/`
   - Build Command: `npm run build`
   - Install Command: `npm ci --legacy-peer-deps`

## 3️⃣ 환경 변수 설정 (중요!)

Vercel Dashboard → Settings → Environment Variables에서 추가:

```
NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = your_anon_key
SUPABASE_SERVICE_ROLE_KEY = your_service_role_key
DATABASE_URL = postgresql://user:password@host:port/database
NEXTAUTH_URL = https://your-deployment-url.vercel.app (배포 후 업데이트)
NEXTAUTH_SECRET = your_random_secret_key_min_32_chars
```

## 4️⃣ 배포 실행

1. `Deploy` 버튼 클릭
2. 배포 완료 대기 (약 2-3분)
3. 배포 URL 확인

## 5️⃣ Supabase 마이그레이션 실행

Supabase Dashboard → SQL Editor에서 순서대로 실행:

1. `014_auto_deduct_inventory_trigger.sql`
2. `015_auto_update_order_status.sql`
3. `016_auto_calculate_fees.sql`

## 6️⃣ NEXTAUTH_URL 업데이트

1. Vercel Dashboard → Settings → Environment Variables
2. `NEXTAUTH_URL`을 배포된 URL로 업데이트
3. Redeploy 실행

## 7️⃣ 테스트

```
https://your-deployment-url.vercel.app/api/test-connection
```

✅ 완료!
