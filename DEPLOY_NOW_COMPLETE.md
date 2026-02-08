# 🚀 Field Nine 웹앱 배포 - 지금 바로 시작!

**현재 상태**: Git 저장소 연결됨, 배포 준비 완료 ✅

---

## ⚡ 빠른 배포 (3단계)

### Step 1: 변경사항 커밋 및 푸시

터미널에서 실행:

```bash
cd c:\Users\polor\field-nine-solutions

# 모든 변경사항 추가
git add .

# 커밋
git commit -m "100% 완성본: 재고 자동화, 분석 대시보드, PWA 완성"

# GitHub에 푸시
git push origin main
```

### Step 2: Vercel에서 GitHub 저장소 연결

1. **Vercel 접속**: https://vercel.com
2. **프로젝트 생성**:
   - `Add New...` → `Project`
   - `Import Git Repository`에서 `field-nine-solutions` 선택
   - 또는 이미 프로젝트가 있다면 `Settings` → `Git`에서 저장소 확인

3. **프로젝트 설정**:
   - Framework: `Next.js` (자동 감지)
   - Root Directory: `/`
   - Build Command: `npm run build`
   - Install Command: `npm ci --legacy-peer-deps`

### Step 3: 환경 변수 설정 및 배포

**환경 변수 추가** (Vercel Dashboard → Settings → Environment Variables):

```
NEXT_PUBLIC_SUPABASE_URL
= https://your-project.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY
= your_anon_key_here

SUPABASE_SERVICE_ROLE_KEY
= your_service_role_key_here

DATABASE_URL
= postgresql://user:password@host:port/database

NEXTAUTH_URL
= https://your-deployment-url.vercel.app
(배포 후 자동 생성된 URL로 업데이트)

NEXTAUTH_SECRET
= your_random_secret_key_min_32_chars
```

**배포 실행**:
1. `Deploy` 버튼 클릭
2. 배포 완료 대기 (약 2-3분)

---

## 📋 배포 후 필수 작업

### 1. Supabase 마이그레이션 실행

Supabase Dashboard → SQL Editor에서 순서대로 실행:

1. `supabase/migrations/014_auto_deduct_inventory_trigger.sql`
2. `supabase/migrations/015_auto_update_order_status.sql`
3. `supabase/migrations/016_auto_calculate_fees.sql`

### 2. NEXTAUTH_URL 업데이트

배포 완료 후 생성된 URL로 `NEXTAUTH_URL` 업데이트:

1. Vercel Dashboard → Settings → Environment Variables
2. `NEXTAUTH_URL` 찾기 → Edit
3. 배포된 URL로 업데이트
4. Save → Redeploy

### 3. 연결 테스트

```
https://your-deployment-url.vercel.app/api/test-connection
```

---

## ✅ 완료 체크리스트

- [ ] Git 커밋 및 푸시
- [ ] Vercel 프로젝트 생성
- [ ] 환경 변수 설정
- [ ] 배포 실행
- [ ] Supabase 마이그레이션 실행
- [ ] NEXTAUTH_URL 업데이트
- [ ] 연결 테스트
- [ ] 기능 테스트

---

**보스, 이제 바로 배포하실 수 있습니다!**

**인프라 연결까지 완벽하게 준비되었습니다!** 🚀
