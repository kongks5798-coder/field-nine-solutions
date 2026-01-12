# 🎯 TrendStream 배포 완전 가이드 (초보자용)

## ✅ 빌드 성공 확인 완료!

로컬에서 빌드가 성공했습니다! 이제 배포만 하면 됩니다.

---

## 📋 배포 단계별 가이드

### 🎬 1단계: Vercel 계정 만들기 (5분)

#### 1-1. Vercel 웹사이트 접속
1. 브라우저를 엽니다
2. 주소창에 `vercel.com` 입력
3. Enter 키를 누릅니다

#### 1-2. 회원가입
1. 화면 오른쪽 위 **"Sign Up"** 버튼 클릭
2. **"Continue with GitHub"** 버튼 클릭
3. GitHub 로그인
4. **"Authorize Vercel"** 버튼 클릭

✅ **성공 확인:** Vercel 대시보드 화면이 나타나면 성공!

---

### 🎬 2단계: 프로젝트 연결하기 (3분)

#### 2-1. 새 프로젝트 만들기
1. Vercel 대시보드에서 **"Add New..."** 버튼 클릭
2. **"Project"** 선택

#### 2-2. GitHub 저장소 선택
1. **"Import Git Repository"** 섹션에서
2. **"field-nine-solutions"** 프로젝트 찾기
3. **"Import"** 버튼 클릭

#### 2-3. 프로젝트 설정 확인
다음 설정이 자동으로 되어 있는지 확인:
- **Framework Preset:** `Next.js` ✅
- **Root Directory:** `.` (점 하나) ✅
- **Build Command:** `npm run build` ✅
- **Output Directory:** `.next` ✅

⚠️ **중요:** 아직 **"Deploy"** 버튼을 누르지 마세요!

---

### 🎬 3단계: 환경 변수 설정하기 (가장 중요!) (5분)

#### 3-1. 환경 변수 화면으로 이동
1. 프로젝트 설정 화면에서
2. 왼쪽 메뉴에서 **"Environment Variables"** 클릭
   - 또는 화면 아래로 스크롤해서 **"Environment Variables"** 섹션 찾기

#### 3-2. Supabase 정보 준비

**Supabase 계정이 없다면:**
1. 새 브라우저 탭 열기
2. `supabase.com` 접속
3. **"Start your project"** 클릭
4. GitHub로 로그인
5. **"New Project"** 클릭
6. 프로젝트 이름 입력 (예: "trendstream")
7. 데이터베이스 비밀번호 설정 (기억해두세요!)
8. **"Create new project"** 클릭
9. 프로젝트 생성 완료까지 2-3분 대기

**Supabase 정보 가져오기:**
1. Supabase 대시보드에서
2. 왼쪽 메뉴에서 **"Settings"** (톱니바퀴 아이콘) 클릭
3. **"API"** 메뉴 클릭
4. 다음 두 가지를 복사:
   - **Project URL:** `https://xxxxx.supabase.co` (복사)
   - **anon public 키:** 긴 문자열 (복사)

#### 3-3. 환경 변수 추가하기

Vercel로 돌아가서 환경 변수를 추가합니다.

**변수 1: NEXT_PUBLIC_SUPABASE_URL**
1. **"Key"** 입력란에: `NEXT_PUBLIC_SUPABASE_URL` 입력
2. **"Value"** 입력란에: Supabase Project URL 붙여넣기
   - 예: `https://abcdefghijklmnop.supabase.co`
3. **"Environment"** 체크박스 3개 모두 체크:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
4. **"Add"** 버튼 클릭

**변수 2: NEXT_PUBLIC_SUPABASE_ANON_KEY**
1. **"Key"** 입력란에: `NEXT_PUBLIC_SUPABASE_ANON_KEY` 입력
2. **"Value"** 입력란에: Supabase anon public 키 붙여넣기
3. **"Environment"** 체크박스 3개 모두 체크
4. **"Add"** 버튼 클릭

**변수 3: PYTHON_BACKEND_URL**
1. **"Key"** 입력란에: `PYTHON_BACKEND_URL` 입력
2. **"Value"** 입력란에: `http://localhost:8000` 입력
   - (로컬 개발용, 나중에 실제 서버 URL로 변경 가능)
3. **"Environment"** 체크박스 3개 모두 체크
4. **"Add"** 버튼 클릭

#### 3-4. 최종 확인
환경 변수 목록에 다음 3개가 모두 보여야 합니다:
- ✅ NEXT_PUBLIC_SUPABASE_URL
- ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
- ✅ PYTHON_BACKEND_URL

각 변수 옆에 **Production, Preview, Development**가 모두 표시되어 있어야 합니다.

---

### 🎬 4단계: Supabase 데이터베이스 설정하기 (5분)

#### 4-1. SQL Editor 열기
1. Supabase 대시보드로 돌아갑니다
2. 왼쪽 메뉴에서 **"SQL Editor"** 클릭
3. **"New query"** 버튼 클릭

#### 4-2. 첫 번째 스키마 실행
1. 컴퓨터에서 프로젝트 폴더를 엽니다
2. `supabase` 폴더를 찾습니다
3. `schema.sql` 파일을 엽니다 (메모장이나 VS Code로)
4. 파일 내용 **전체**를 선택합니다 (Ctrl+A)
5. 복사합니다 (Ctrl+C)
6. Supabase SQL Editor로 돌아갑니다
7. 빈 화면에 붙여넣습니다 (Ctrl+V)
8. **"Run"** 버튼을 클릭합니다
9. ✅ 성공 메시지가 나타나면 완료!

#### 4-3. 두 번째 스키마 실행
1. Supabase SQL Editor에서
2. **"New query"** 버튼을 다시 클릭합니다
3. 프로젝트 폴더에서 `supabase/schema_subscriptions.sql` 파일을 엽니다
4. 파일 내용 **전체**를 선택합니다 (Ctrl+A)
5. 복사합니다 (Ctrl+C)
6. Supabase SQL Editor의 새 쿼리 화면에 붙여넣습니다 (Ctrl+V)
7. **"Run"** 버튼을 클릭합니다
8. ✅ 성공 메시지가 나타나면 완료!

---

### 🎬 5단계: 배포 실행하기 (2분)

#### 5-1. Vercel로 돌아가기
1. Vercel 프로젝트 설정 화면으로 돌아갑니다
2. 브라우저 탭을 전환하거나 Vercel.com을 다시 엽니다

#### 5-2. 최종 확인
1. 환경 변수가 모두 추가되었는지 다시 확인합니다
2. 각 변수의 Environment가 모두 체크되어 있는지 확인합니다

#### 5-3. 배포 시작
1. 화면 맨 아래로 스크롤합니다
2. **"Deploy"** 버튼을 찾습니다
3. **"Deploy"** 버튼을 클릭합니다

#### 5-4. 배포 진행 상황 보기
1. 배포가 시작되면 진행 상황이 표시됩니다
2. 다음 단계들이 순서대로 진행됩니다:
   - 📦 **Installing dependencies** (의존성 설치 중...)
   - 🔨 **Building** (빌드 중...)
   - 🚀 **Deploying** (배포 중...)
3. 약 **2-5분** 정도 걸립니다
4. ⏳ 기다리는 동안 다른 일을 하셔도 됩니다!

#### 5-5. 배포 완료 확인
1. 배포가 완료되면 **"Visit"** 버튼이 나타납니다
2. **"Visit"** 버튼을 클릭합니다
3. 🎉 사이트가 열리면 성공입니다!

---

## 🎉 배포 완료!

배포가 성공하면 다음과 같은 URL이 생성됩니다:
- `https://field-nine-solutions-xxxxx.vercel.app`
- 또는 커스텀 도메인 (설정한 경우)

---

## 📊 배포 확인하기

### 1. 헬스 체크
1. 배포된 사이트 URL을 복사합니다
2. URL 끝에 `/api/health`를 추가합니다
3. 브라우저에서 이 URL을 엽니다
4. 다음과 같은 JSON이 나타나면 성공:
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

### 2. 랜딩 페이지 확인
1. 배포된 사이트 URL을 엽니다
2. TrendStream 랜딩 페이지가 나타나면 성공 ✅

### 3. 대시보드 확인
1. URL 끝에 `/dashboard`를 추가합니다
2. 로그인 페이지가 나타나면 성공 ✅

---

## 🚨 문제 해결하기

### 문제 1: "Environment Variable not found" 오류

**해결 방법:**
1. Vercel 대시보드 → 프로젝트 → Settings → Environment Variables
2. 모든 환경 변수가 추가되었는지 확인
3. 각 변수의 Environment 체크박스가 **모두** 체크되어 있는지 확인
4. 변수를 삭제하고 다시 추가해보기

### 문제 2: "Build failed" 오류

**해결 방법:**
1. Vercel 대시보드에서:
   - 프로젝트 → Deployments → 최신 배포 클릭 → Logs 탭
2. 오류 메시지를 읽어봅니다
3. 로컬에서 테스트:
   ```bash
   npm install
   npm run build
   ```
4. 오류가 나면 오류 메시지를 확인하고 수정

### 문제 3: "Supabase connection error"

**해결 방법:**
1. Supabase 프로젝트가 활성화되어 있는지 확인
2. 환경 변수 값이 올바른지 확인:
   - `NEXT_PUBLIC_SUPABASE_URL`이 정확한 URL인지
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`가 정확한 키인지
3. Supabase 대시보드에서 프로젝트 상태 확인

---

## 📋 최종 체크리스트

배포 전에 이것들을 모두 확인하세요:

- [ ] Vercel 계정 생성 완료
- [ ] GitHub 저장소 연결 완료
- [ ] 환경 변수 3개 모두 추가 완료
  - [ ] NEXT_PUBLIC_SUPABASE_URL
  - [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
  - [ ] PYTHON_BACKEND_URL
- [ ] 각 환경 변수의 Environment가 모두 체크됨
- [ ] Supabase 프로젝트 생성 완료
- [ ] Supabase 스키마 2개 실행 완료
  - [ ] schema.sql 실행 완료
  - [ ] schema_subscriptions.sql 실행 완료
- [ ] 배포 버튼 클릭 완료
- [ ] 배포 성공 확인 완료

---

## 💡 팁

1. **환경 변수는 대소문자를 정확히 입력해야 합니다**
   - `NEXT_PUBLIC_SUPABASE_URL` ✅
   - `next_public_supabase_url` ❌

2. **Environment 체크박스는 모두 체크해야 합니다**
   - Production ✅
   - Preview ✅
   - Development ✅

3. **Supabase 키를 복사할 때 공백이 들어가지 않도록 주의하세요**

4. **배포는 2-5분 정도 걸립니다. 기다려주세요!**

---

**보스, 이 가이드를 따라하시면 반드시 배포가 완료됩니다!** 🚀

**궁금한 점이 있으면 언제든 물어보세요!**
