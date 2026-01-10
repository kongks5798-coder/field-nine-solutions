# 🚀 Field Nine 웹앱 배포 완벽 가이드

**목표**: GitHub 저장소를 Vercel에 연결하여 완벽한 웹앱 배포

---

## 📋 Step 1: GitHub 저장소 준비

### 1-1. GitHub 저장소 생성

1. **GitHub 접속**: https://github.com
2. **새 저장소 생성**:
   - 우측 상단 `+` 클릭 → `New repository`
   - Repository name: `field-nine-solutions` (또는 원하는 이름)
   - Public 또는 Private 선택
   - **Initialize this repository with a README** 체크 해제
   - `Create repository` 클릭

### 1-2. 로컬 프로젝트를 GitHub에 푸시

터미널에서 다음 명령어 실행:

```bash
# 현재 디렉토리 확인
cd c:\Users\polor\field-nine-solutions

# Git 초기화 (이미 되어있다면 스킵)
git init

# 모든 파일 추가
git add .

# 첫 커밋
git commit -m "Initial commit: Field Nine 100% 완성본"

# GitHub 저장소 연결 (YOUR_USERNAME을 실제 GitHub 사용자명으로 변경)
git remote add origin https://github.com/YOUR_USERNAME/field-nine-solutions.git

# 또는 SSH 사용 시
# git remote add origin git@github.com:YOUR_USERNAME/field-nine-solutions.git

# 메인 브랜치로 변경
git branch -M main

# GitHub에 푸시
git push -u origin main
```

---

## 📋 Step 2: Vercel 프로젝트 생성 및 배포

### 2-1. Vercel에 GitHub 저장소 연결

1. **Vercel 접속**: https://vercel.com
2. **로그인**: GitHub 계정으로 로그인
3. **새 프로젝트 생성**:
   - `Add New...` → `Project` 클릭
   - `Import Git Repository`에서 `field-nine-solutions` 선택
   - 또는 `Import` 버튼 클릭

### 2-2. 프로젝트 설정

**프로젝트 설정 화면에서:**

1. **Framework Preset**: `Next.js` 선택 (자동 감지됨)
2. **Root Directory**: `/` (기본값)
3. **Build Command**: `npm run build` (기본값)
4. **Output Directory**: `.next` (기본값)
5. **Install Command**: `npm ci --legacy-peer-deps` (수동 입력)

**환경 변수 설정 (중요!):**

`Environment Variables` 섹션을 펼치고 다음 변수 추가:

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
(배포 후 자동 생성된 URL로 업데이트 필요)

NEXTAUTH_SECRET
= your_random_secret_key_min_32_chars
(예: openssl rand -base64 32 명령어로 생성)
```

**각 환경별 설정:**
- Production: ✅ 체크
- Preview: ✅ 체크
- Development: ✅ 체크

### 2-3. 배포 실행

1. **`Deploy` 버튼 클릭**
2. **배포 진행 상황 확인**:
   - 빌드 로그 확인
   - 에러 발생 시 로그 확인

---

## 📋 Step 3: Supabase 마이그레이션 실행

### 3-1. Supabase Dashboard 접속

1. **Supabase 접속**: https://supabase.com/dashboard
2. **프로젝트 선택**: Field Nine 프로젝트 선택
3. **SQL Editor 열기**: 왼쪽 메뉴에서 `SQL Editor` 클릭

### 3-2. 마이그레이션 실행

**순서대로 실행** (각 파일을 복사하여 SQL Editor에 붙여넣고 `Run` 클릭):

#### 1️⃣ 재고 자동 차감 트리거

파일: `supabase/migrations/014_auto_deduct_inventory_trigger.sql`

```sql
-- 파일 내용을 복사하여 SQL Editor에 붙여넣기
-- Run 클릭
```

#### 2️⃣ 주문 상태 자동 전환 트리거

파일: `supabase/migrations/015_auto_update_order_status.sql`

```sql
-- 파일 내용을 복사하여 SQL Editor에 붙여넣기
-- Run 클릭
```

#### 3️⃣ 수수료 자동 계산 트리거

파일: `supabase/migrations/016_auto_calculate_fees.sql`

```sql
-- 파일 내용을 복사하여 SQL Editor에 붙여넣기
-- Run 클릭
```

**각 마이그레이션 실행 후 확인:**
- ✅ "Success. No rows returned" 메시지 확인
- 또는 ✅ "Success" 메시지 확인

---

## 📋 Step 4: 배포 후 환경 변수 업데이트

### 4-1. 배포 URL 확인

Vercel Dashboard에서 배포 완료 후 생성된 URL 확인:
```
https://your-project-name.vercel.app
```

### 4-2. NEXTAUTH_URL 업데이트

1. **Vercel Dashboard** → **Settings** → **Environment Variables**
2. **`NEXTAUTH_URL`** 찾기
3. **Edit** 클릭
4. **Value**를 배포된 URL로 업데이트:
   ```
   https://your-project-name.vercel.app
   ```
5. **Save** 클릭
6. **Redeploy** 실행 (자동 또는 수동)

---

## 📋 Step 5: 연결 테스트

### 5-1. 헬스 체크

브라우저에서 다음 URL 접속:

```
https://your-project-name.vercel.app/api/health
```

**예상 응답**:
```json
{
  "status": "ok",
  "message": "All systems operational",
  "database": "connected"
}
```

### 5-2. 연결 테스트

```
https://your-project-name.vercel.app/api/test-connection
```

**예상 응답**:
```json
{
  "status": "ok",
  "timestamp": "2025-01-09T...",
  "checks": {
    "supabase_client": { "status": "ok" },
    "database_connection": { "status": "ok" },
    "environment_variables": {
      "NEXT_PUBLIC_SUPABASE_URL": "set",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY": "set",
      "DATABASE_URL": "set"
    }
  }
}
```

---

## 📋 Step 6: 기능 테스트

### 6-1. 기본 페이지 테스트

- [ ] `/` - 홈페이지 로드
- [ ] `/login` - 로그인 페이지
- [ ] `/dashboard` - 대시보드 (로그인 후)
- [ ] `/dashboard/inventory` - 재고 관리
- [ ] `/dashboard/orders` - 주문 관리
- [ ] `/dashboard/analytics` - 분석 대시보드
- [ ] `/products/[id]` - 상품 상세 페이지

### 6-2. 비즈니스 로직 테스트

- [ ] **상품 추가** → 재고 확인
- [ ] **주문 동기화** → 재고 자동 차감 확인
- [ ] **송장번호 입력** → 주문 상태 자동 전환 확인
- [ ] **주문 생성** → 수수료 자동 계산 확인

---

## 🔧 문제 해결

### 문제 1: 빌드 실패

**원인**: 환경 변수 누락 또는 잘못된 설정

**해결**:
1. Vercel Dashboard → Settings → Environment Variables 확인
2. 모든 필수 변수가 설정되어 있는지 확인
3. 변수 이름이 정확한지 확인 (대소문자 구분)
4. 재배포 실행

### 문제 2: 데이터베이스 연결 실패

**원인**: `DATABASE_URL` 또는 Supabase 키 오류

**해결**:
1. Supabase Dashboard → Settings → API에서 키 확인
2. `NEXT_PUBLIC_SUPABASE_URL`과 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 확인
3. Vercel 환경 변수 업데이트
4. 재배포 실행

### 문제 3: 인증 오류

**원인**: `NEXTAUTH_URL`이 잘못 설정됨

**해결**:
1. 배포된 URL 확인
2. `NEXTAUTH_URL`을 정확한 URL로 업데이트
3. `NEXTAUTH_SECRET`이 설정되어 있는지 확인
4. 재배포 실행

---

## ✅ 완료 체크리스트

### 배포 전
- [x] GitHub 저장소 생성
- [x] 로컬 코드 푸시
- [x] Vercel 프로젝트 생성
- [ ] 환경 변수 설정

### 배포 중
- [ ] Vercel 배포 실행
- [ ] 빌드 성공 확인
- [ ] 배포 URL 확인

### 배포 후
- [ ] Supabase 마이그레이션 실행
- [ ] `NEXTAUTH_URL` 업데이트
- [ ] 연결 테스트 API 호출
- [ ] 모든 페이지 테스트
- [ ] 비즈니스 로직 테스트

---

## 🎯 최종 확인

배포가 완료되면 다음을 확인하세요:

1. **배포 URL**: https://your-project-name.vercel.app
2. **연결 테스트**: `/api/test-connection` 응답 확인
3. **로그인 기능**: 정상 작동 확인
4. **대시보드**: 데이터 로드 확인
5. **재고 관리**: 상품 추가/수정 확인

---

**보스, 이 가이드를 따라하시면 완벽한 웹앱 배포가 완료됩니다!**

**인프라 연결까지 완벽하게 준비되었습니다!** 🚀
