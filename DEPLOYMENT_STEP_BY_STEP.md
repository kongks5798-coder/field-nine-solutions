# 🚀 TrendStream 배포 완벽 가이드 (초보자용)

## 📋 목차
1. [준비물 체크리스트](#1-준비물-체크리스트)
2. [Vercel 계정 만들기](#2-vercel-계정-만들기)
3. [프로젝트 연결하기](#3-프로젝트-연결하기)
4. [환경 변수 설정하기](#4-환경-변수-설정하기)
5. [Supabase 설정하기](#5-supabase-설정하기)
6. [배포 실행하기](#6-배포-실행하기)
7. [문제 해결하기](#7-문제-해결하기)

---

## 1. 준비물 체크리스트 ✅

배포를 시작하기 전에 다음이 준비되어 있어야 합니다:

- [ ] GitHub 계정 (이미 있음)
- [ ] Vercel 계정 (만들어야 함)
- [ ] Supabase 계정 (만들어야 함)
- [ ] Supabase 프로젝트 URL과 API 키

---

## 2. Vercel 계정 만들기

### 2-1. Vercel 웹사이트 접속
1. 브라우저를 엽니다 (Chrome, Edge 등)
2. 주소창에 `https://vercel.com` 입력
3. Enter 키를 누릅니다

### 2-2. 회원가입
1. 화면 오른쪽 위에 있는 **"Sign Up"** 버튼을 클릭합니다
2. **"Continue with GitHub"** 버튼을 클릭합니다 (GitHub 계정으로 가입)
3. GitHub 로그인 화면이 나오면:
   - GitHub 아이디와 비밀번호 입력
   - 로그인 버튼 클릭
4. Vercel이 GitHub 접근 권한을 요청하면:
   - **"Authorize Vercel"** 버튼을 클릭합니다

### 2-3. 확인
- Vercel 대시보드 화면이 나오면 성공입니다! ✅

---

## 3. 프로젝트 연결하기

### 3-1. 새 프로젝트 만들기
1. Vercel 대시보드에서 **"Add New..."** 버튼을 클릭합니다
2. **"Project"**를 선택합니다

### 3-2. GitHub 저장소 선택
1. **"Import Git Repository"** 섹션에서
2. **"field-nine-solutions"** 프로젝트를 찾습니다
3. 프로젝트 옆의 **"Import"** 버튼을 클릭합니다

### 3-3. 프로젝트 설정
다음 화면에서 설정을 확인합니다:

**Framework Preset:**
- 자동으로 "Next.js"로 감지되어야 합니다 ✅

**Root Directory:**
- `.` (기본값, 그대로 둡니다)

**Build Command:**
- `npm run build` (자동으로 설정됨)

**Output Directory:**
- `.next` (자동으로 설정됨)

**Install Command:**
- `npm install` (자동으로 설정됨)

### 3-4. 환경 변수 설정 (일단 건너뛰기)
- 이 단계에서는 **"Deploy"** 버튼을 누르지 마세요!
- 화면을 그대로 두고 다음 단계로 넘어갑니다

---

## 4. 환경 변수 설정하기

### 4-1. 환경 변수 화면으로 이동
1. 프로젝트 설정 화면에서
2. 왼쪽 메뉴에서 **"Environment Variables"** 클릭
3. 또는 아래로 스크롤해서 **"Environment Variables"** 섹션 찾기

### 4-2. 환경 변수 추가하기

다음 4개의 환경 변수를 하나씩 추가합니다:

#### 변수 1: NEXT_PUBLIC_SUPABASE_URL
1. **"Key"** 입력란에: `NEXT_PUBLIC_SUPABASE_URL` 입력
2. **"Value"** 입력란에: Supabase 프로젝트 URL 입력
   - 예: `https://abcdefghijklmnop.supabase.co`
3. **"Environment"** 체크박스:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
   - (모두 체크)
4. **"Add"** 버튼 클릭

#### 변수 2: NEXT_PUBLIC_SUPABASE_ANON_KEY
1. **"Key"** 입력란에: `NEXT_PUBLIC_SUPABASE_ANON_KEY` 입력
2. **"Value"** 입력란에: Supabase Anon Key 입력
   - Supabase 대시보드 → Settings → API → anon public 키 복사
3. **"Environment"** 체크박스:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
   - (모두 체크)
4. **"Add"** 버튼 클릭

#### 변수 3: PYTHON_BACKEND_URL
1. **"Key"** 입력란에: `PYTHON_BACKEND_URL` 입력
2. **"Value"** 입력란에: Python 백엔드 URL 입력
   - 예: `http://localhost:8000` (로컬 개발용)
   - 또는 실제 배포된 Python 서버 URL
3. **"Environment"** 체크박스:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
   - (모두 체크)
4. **"Add"** 버튼 클릭

#### 변수 4: NEXT_PUBLIC_SENTRY_DSN (선택사항)
1. **"Key"** 입력란에: `NEXT_PUBLIC_SENTRY_DSN` 입력
2. **"Value"** 입력란에: Sentry DSN 입력 (없으면 건너뛰기)
3. **"Environment"** 체크박스:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
   - (모두 체크)
4. **"Add"** 버튼 클릭

### 4-3. 확인
- 총 3-4개의 환경 변수가 추가되었는지 확인합니다
- 각 변수 옆에 Production, Preview, Development가 모두 체크되어 있는지 확인합니다

---

## 5. Supabase 설정하기

### 5-1. Supabase 계정 만들기
1. 브라우저에서 `https://supabase.com` 접속
2. **"Start your project"** 버튼 클릭
3. GitHub로 로그인
4. 새 프로젝트 만들기

### 5-2. 프로젝트 정보 확인
1. Supabase 대시보드에서
2. 왼쪽 메뉴에서 **"Settings"** 클릭
3. **"API"** 메뉴 클릭
4. 다음 정보를 복사해둡니다:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public** 키: 긴 문자열

### 5-3. 데이터베이스 스키마 실행
1. Supabase 대시보드에서
2. 왼쪽 메뉴에서 **"SQL Editor"** 클릭
3. **"New query"** 버튼 클릭

#### 첫 번째 스키마 실행
1. 프로젝트 폴더에서 `supabase/schema.sql` 파일을 엽니다
2. 파일 내용 전체를 복사합니다 (Ctrl+A, Ctrl+C)
3. Supabase SQL Editor에 붙여넣습니다 (Ctrl+V)
4. **"Run"** 버튼을 클릭합니다
5. 성공 메시지가 나오면 ✅

#### 두 번째 스키마 실행
1. 프로젝트 폴더에서 `supabase/schema_subscriptions.sql` 파일을 엽니다
2. 파일 내용 전체를 복사합니다 (Ctrl+A, Ctrl+C)
3. Supabase SQL Editor에서 **"New query"** 버튼을 다시 클릭
4. 붙여넣습니다 (Ctrl+V)
5. **"Run"** 버튼을 클릭합니다
6. 성공 메시지가 나오면 ✅

---

## 6. 배포 실행하기

### 6-1. Vercel에서 배포 시작
1. Vercel 프로젝트 설정 화면으로 돌아갑니다
2. 모든 환경 변수가 추가되었는지 다시 한 번 확인합니다
3. 화면 맨 아래로 스크롤합니다
4. **"Deploy"** 버튼을 클릭합니다

### 6-2. 배포 진행 상황 확인
1. 배포가 시작되면 진행 상황이 표시됩니다
2. 다음 단계들이 순서대로 진행됩니다:
   - Installing dependencies (의존성 설치)
   - Building (빌드)
   - Deploying (배포)
3. 약 2-5분 정도 걸립니다

### 6-3. 배포 완료 확인
1. 배포가 완료되면 **"Visit"** 버튼이 나타납니다
2. **"Visit"** 버튼을 클릭하면 배포된 사이트가 열립니다
3. URL은 다음과 같습니다:
   - `https://field-nine-solutions-xxxxx.vercel.app`

---

## 7. 문제 해결하기

### 문제 1: "Environment Variable not found" 오류

**증상:**
- 배포가 실패하고 환경 변수 오류가 나타남

**해결 방법:**
1. Vercel 대시보드 → 프로젝트 → Settings → Environment Variables
2. 모든 환경 변수가 추가되었는지 확인
3. 각 변수의 Environment 체크박스가 모두 체크되어 있는지 확인
4. 변수를 삭제하고 다시 추가해보기

### 문제 2: "Build failed" 오류

**증상:**
- 빌드 단계에서 실패

**해결 방법:**
1. Vercel 대시보드에서 배포 로그 확인
2. 로컬에서 테스트:
   ```bash
   npm install
   npm run build
   ```
3. 오류 메시지를 확인하고 수정

### 문제 3: "Supabase connection error" 오류

**증상:**
- 사이트는 열리지만 데이터베이스 연결 오류

**해결 방법:**
1. Supabase 프로젝트가 활성화되어 있는지 확인
2. 환경 변수 `NEXT_PUBLIC_SUPABASE_URL`과 `NEXT_PUBLIC_SUPABASE_ANON_KEY`가 올바른지 확인
3. Supabase 대시보드에서 프로젝트 상태 확인

### 문제 4: "Page not found" 오류

**증상:**
- 사이트는 열리지만 404 오류

**해결 방법:**
1. Vercel 대시보드 → 프로젝트 → Settings → General
2. **"Framework Preset"**이 "Next.js"로 설정되어 있는지 확인
3. **"Root Directory"**가 `.` (점 하나)로 설정되어 있는지 확인

---

## 8. 배포 확인하기

### 8-1. 헬스 체크
1. 브라우저에서 다음 URL 열기:
   ```
   https://your-project.vercel.app/api/health
   ```
2. 다음과 같은 JSON이 나타나면 성공:
   ```json
   {
     "status": "healthy",
     "timestamp": "...",
     "services": {
       "database": "healthy",
       "python_backend": "healthy"
     }
   }
   ```

### 8-2. 랜딩 페이지 확인
1. 브라우저에서 다음 URL 열기:
   ```
   https://your-project.vercel.app
   ```
2. TrendStream 랜딩 페이지가 나타나면 성공 ✅

### 8-3. 대시보드 확인
1. 브라우저에서 다음 URL 열기:
   ```
   https://your-project.vercel.app/dashboard
   ```
2. 로그인 페이지가 나타나면 성공 ✅

---

## 📝 체크리스트

배포 전 최종 확인:

- [ ] Vercel 계정 생성 완료
- [ ] GitHub 저장소 연결 완료
- [ ] 환경 변수 3개 이상 추가 완료
- [ ] Supabase 프로젝트 생성 완료
- [ ] Supabase 스키마 2개 실행 완료
- [ ] 배포 버튼 클릭 완료
- [ ] 배포 성공 확인 완료

---

## 🆘 도움이 필요하신가요?

문제가 계속되면 다음을 확인하세요:

1. **Vercel 로그 확인:**
   - Vercel 대시보드 → 프로젝트 → Deployments → 최신 배포 클릭 → Logs 탭

2. **로컬 빌드 테스트:**
   ```bash
   npm install
   npm run build
   ```

3. **환경 변수 재확인:**
   - Vercel 대시보드 → Settings → Environment Variables
   - 모든 변수가 Production, Preview, Development에 모두 설정되어 있는지 확인

---

**보스, 이 가이드를 따라하시면 배포가 완료됩니다!** 🚀
