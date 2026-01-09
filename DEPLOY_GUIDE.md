# 🚀 Field Nine - Vercel 배포 가이드

**이 가이드는 Field Nine을 Vercel에 배포하고 `fieldnine.io` 도메인을 연결하는 완벽한 가이드입니다.**

---

## 📋 사전 준비사항

### 완료해야 할 항목:

- [x] Supabase 데이터베이스 스키마 생성 완료
- [x] 환경 변수 설정 완료 (`.env.local`)
- [x] 로컬에서 테스트 완료 (`npm run dev`)
- [x] Git 저장소에 코드 푸시 완료

---

## 🎯 1단계: Vercel 프로젝트 생성

### 1-1. Vercel 대시보드 접속

1. 브라우저에서 접속:
   ```
   https://vercel.com/dashboard
   ```

2. 로그인 (GitHub 계정 권장)

### 1-2. 새 프로젝트 추가

1. **"Add New..."** 버튼 클릭
2. **"Project"** 선택

### 1-3. GitHub 리포지토리 연결

1. **"Import Git Repository"** 섹션에서
2. `field-nine-solutions` 리포지토리 선택
3. **"Import"** 버튼 클릭

---

## 🎯 2단계: 프로젝트 설정

### 2-1. 기본 설정 (자동 감지됨)

- **Framework Preset:** Next.js ✅
- **Root Directory:** `./` ✅
- **Build Command:** `npm run build` ✅
- **Output Directory:** `.next` ✅
- **Install Command:** `npm install --legacy-peer-deps` ✅

**변경할 필요 없습니다!** 그대로 두세요.

---

## 🎯 3단계: 환경 변수 설정 (중요!)

### 3-1. 환경 변수 추가

1. **"Environment Variables"** 섹션 클릭
2. 다음 변수들을 **하나씩 추가**:

#### 변수 1: NEXT_PUBLIC_SUPABASE_URL
- **Name:** `NEXT_PUBLIC_SUPABASE_URL`
- **Value:** `https://ivazoqddehjbfhmfdmck.supabase.co`
- **Environment:** ✅ Production, ✅ Preview, ✅ Development 모두 체크
- **"Add"** 버튼 클릭

#### 변수 2: NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2YXpvcWRkZWhqYmZobWZkbWNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MDYyODYsImV4cCI6MjA4MzI4MjI4Nn0.Sb-lQPN5apyh3Y9KU-wjvsWJzIG8UOM-WH5T1dF1Qq4`
- **Environment:** ✅ Production, ✅ Preview, ✅ Development 모두 체크
- **"Add"** 버튼 클릭

#### 변수 3: SUPABASE_SERVICE_ROLE_KEY
- **Name:** `SUPABASE_SERVICE_ROLE_KEY`
- **Value:** (Supabase 대시보드 > Settings > API > service_role key에서 복사)
- **Environment:** ✅ Production, ✅ Preview, ✅ Development 모두 체크
- **"Add"** 버튼 클릭

#### 변수 4: ENCRYPTION_KEY
- **Name:** `ENCRYPTION_KEY`
- **Value:** (64자리 hex 문자열, 로컬 `.env.local`에서 복사)
- **Environment:** ✅ Production, ✅ Preview, ✅ Development 모두 체크
- **"Add"** 버튼 클릭

#### 변수 5: NEXT_PUBLIC_PYTHON_SERVER_URL (선택사항)
- **Name:** `NEXT_PUBLIC_PYTHON_SERVER_URL`
- **Value:** (Python 서버 URL, 있으면 추가)
- **Environment:** ✅ Production, ✅ Preview, ✅ Development 모두 체크
- **"Add"** 버튼 클릭

---

## 🎯 4단계: 배포 실행

### 4-1. 배포 시작

1. 모든 환경 변수를 추가한 후
2. **"Deploy"** 버튼 클릭
3. 배포 진행 상황 확인 (약 2-3분 소요)

### 4-2. 배포 완료 확인

- **"Ready"** 상태가 나타나면 완료
- 배포 URL이 표시됨 (예: `field-nine-solutions.vercel.app`)

---

## 🎯 5단계: 도메인 연결 (fieldnine.io)

### 5-1. 도메인 추가

1. Vercel 대시보드에서 프로젝트 선택
2. **"Settings"** 클릭
3. **"Domains"** 클릭
4. **"Add Domain"** 버튼 클릭
5. 도메인 입력: `fieldnine.io`
6. **"Add"** 버튼 클릭

### 5-2. DNS 설정

Vercel이 DNS 설정 방법을 안내합니다:

#### 방법 1: A 레코드 (권장)

도메인 제공업체에서 다음 A 레코드 추가:

- **Type:** A
- **Name:** `@` (또는 루트 도메인)
- **Value:** `76.76.21.21`
- **TTL:** 3600 (또는 기본값)

#### 방법 2: CNAME 레코드

- **Type:** CNAME
- **Name:** `@` (또는 루트 도메인)
- **Value:** `cname.vercel-dns.com`
- **TTL:** 3600 (또는 기본값)

### 5-3. DNS 전파 대기

- DNS 변경 사항이 전파되는 데 **최대 48시간** 소요
- 일반적으로 **5-30분** 내에 완료됨

### 5-4. 연결 확인

1. Vercel 대시보드에서 도메인 상태 확인
2. **"Valid Configuration"** 표시되면 성공
3. 브라우저에서 `https://fieldnine.io` 접속 테스트

---

## 🎯 6단계: 자동 배포 설정 확인

### 6-1. Git 연동 확인

1. **"Settings"** > **"Git"** 클릭
2. GitHub 리포지토리가 연결되어 있는지 확인

### 6-2. 자동 배포 테스트

1. 로컬에서 코드 수정
2. Git에 푸시:
   ```powershell
   git add .
   git commit -m "Test auto deployment"
   git push
   ```
3. Vercel 대시보드에서 자동 배포 시작 확인

---

## ✅ 배포 완료 체크리스트

- [ ] Vercel 프로젝트 생성 완료
- [ ] GitHub 리포지토리 연결 완료
- [ ] 환경 변수 5개 모두 추가 완료
- [ ] 배포 성공 (Ready 상태)
- [ ] 도메인 연결 완료 (fieldnine.io)
- [ ] DNS 설정 완료
- [ ] 사이트 접속 테스트 성공
- [ ] 자동 배포 테스트 성공

---

## 🚨 문제 해결

### 빌드 실패

**원인:** 환경 변수 누락 또는 타입 에러

**해결:**
1. Vercel 배포 로그 확인
2. 환경 변수가 모두 추가되었는지 확인
3. 로컬에서 `npm run build` 실행하여 에러 확인

### 도메인 연결 실패

**원인:** DNS 설정 오류

**해결:**
1. DNS 레코드가 올바르게 설정되었는지 확인
2. DNS 전파 대기 (최대 48시간)
3. Vercel 대시보드의 도메인 설정 안내 따르기

### 환경 변수 누락

**원인:** 환경 변수가 추가되지 않음

**해결:**
1. Vercel 대시보드 > Settings > Environment Variables 확인
2. 모든 환경에 체크되어 있는지 확인 (Production, Preview, Development)
3. 저장 후 재배포

---

## 📝 배포 후 확인사항

### 1. 사이트 접속 테스트

- [ ] `https://fieldnine.io` 접속 가능
- [ ] 로그인 페이지 정상 작동
- [ ] 대시보드 페이지 정상 작동
- [ ] 재고 관리 페이지 정상 작동

### 2. 데이터베이스 연결 테스트

- [ ] 상품 목록이 표시됨
- [ ] 상품 추가 기능 작동
- [ ] 데이터가 Supabase에 저장됨

### 3. 성능 확인

- [ ] 페이지 로딩 속도 정상
- [ ] 이미지 최적화 작동
- [ ] 모바일 반응형 작동

---

## 🎉 완료!

**축하합니다! Field Nine이 성공적으로 배포되었습니다!**

이제:
- ✅ 코드 수정 → `git push` → 자동 배포
- ✅ Tesla 스타일 자동 업데이트 시스템 완성
- ✅ `fieldnine.io` 도메인으로 접속 가능

---

## 💡 유지보수 팁

### 환경 변수 업데이트

1. Vercel 대시보드 > Settings > Environment Variables
2. 변수 수정 또는 추가
3. **중요:** 저장 후 "Redeploy" 버튼 클릭

### 로그 확인

1. Vercel 대시보드 > 프로젝트 선택
2. "Deployments" 탭
3. 배포 클릭하여 로그 확인

---

**문제가 발생하면 배포 로그를 확인하세요!** 🚀
