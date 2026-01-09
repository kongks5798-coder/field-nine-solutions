# 🚀 Vercel과 GitHub 연결하기 (완벽 가이드)

**현재 상태:** ✅ GitHub에 코드가 성공적으로 올라갔습니다!
**다음 단계:** Vercel과 GitHub를 연결하여 자동 배포를 설정합니다!

---

## 📋 전체 순서 (3단계)

1. **Vercel 대시보드 접속** (1분)
2. **GitHub 리포지토리 연결** (3분)
3. **자동 배포 확인** (1분)

**총 소요 시간: 약 5분** ⏱️

---

## 1단계: Vercel 대시보드 접속

### 1-1. Vercel 웹사이트 열기

1. **브라우저에서 새 탭 열기**
   - `Ctrl + T` 키 누르기

2. **주소창에 입력:**
   ```
   https://vercel.com/dashboard
   ```

3. **Enter 키 누르기**

---

### 1-2. 로그인하기

1. **오른쪽 위에 "Log in" 버튼 클릭**
   - 이미 로그인되어 있다면 이 단계 건너뛰기

2. **GitHub로 로그인 권장**
   - "Continue with GitHub" 버튼 클릭
   - GitHub 계정으로 로그인

---

## 2단계: GitHub 리포지토리 연결

### 2-1. 새 프로젝트 추가

1. **대시보드에서 "Add New..." 버튼 클릭**
   - 화면 오른쪽 위에 있음
   - 또는 중앙에 "Add New Project" 버튼

2. **"Project" 선택**
   - 드롭다운 메뉴에서 선택

---

### 2-2. GitHub 리포지토리 선택

1. **"Import Git Repository" 섹션에서**
   - GitHub 리포지토리 목록이 나타납니다

2. **리포지토리 찾기**
   - `field-nine-solutions` 리포지토리를 찾으세요
   - 또는 검색창에 `field-nine-solutions` 입력

3. **리포지토리 선택**
   - `field-nine-solutions` 옆의 **"Import"** 버튼 클릭

---

### 2-3. 프로젝트 설정

**다음 정보가 자동으로 설정됩니다:**

- ✅ **Project Name:** `field-nine-solutions`
- ✅ **Framework Preset:** Next.js (자동 감지)
- ✅ **Root Directory:** `./` (기본값)
- ✅ **Build Command:** `npm run build` (자동 설정)
- ✅ **Output Directory:** `.next` (자동 설정)
- ✅ **Install Command:** `npm install --legacy-peer-deps` (자동 설정)

**변경할 필요 없습니다!** 그대로 두세요.

---

### 2-4. 환경 변수 설정 (중요!)

**⚠️ 반드시 설정해야 합니다!**

1. **"Environment Variables" 섹션 클릭**
   - 화면 아래쪽에 있습니다

2. **다음 변수들을 하나씩 추가:**

   **변수 1:**
   - **Name:** `NEXT_PUBLIC_SUPABASE_URL`
   - **Value:** (본인의 Supabase URL 입력)
   - **Environment:** ✅ Production, ✅ Preview, ✅ Development 모두 체크
   - **"Add" 버튼 클릭**

   **변수 2:**
   - **Name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value:** (본인의 Supabase Anon Key 입력)
   - **Environment:** ✅ Production, ✅ Preview, ✅ Development 모두 체크
   - **"Add" 버튼 클릭**

   **변수 3:**
   - **Name:** `SUPABASE_SERVICE_ROLE_KEY`
   - **Value:** (본인의 Supabase Service Role Key 입력)
   - **Environment:** ✅ Production, ✅ Preview, ✅ Development 모두 체크
   - **"Add" 버튼 클릭**

   **변수 4:**
   - **Name:** `ENCRYPTION_KEY`
   - **Value:** (64자리 hex 키 입력)
   - **Environment:** ✅ Production, ✅ Preview, ✅ Development 모두 체크
   - **"Add" 버튼 클릭**

   **변수 5:**
   - **Name:** `NEXT_PUBLIC_PYTHON_SERVER_URL`
   - **Value:** (Python 서버 URL 입력)
   - **Environment:** ✅ Production, ✅ Preview, ✅ Development 모두 체크
   - **"Add" 버튼 클릭**

---

### 2-5. 배포 실행

1. **모든 환경 변수를 추가한 후**
2. **"Deploy" 버튼 클릭**
   - 초록색 버튼입니다
   - 화면 아래쪽에 있습니다

3. **배포 시작**
   - "Building..." 메시지가 나타납니다
   - 약 2-3분 소요됩니다

---

## 3단계: 자동 배포 확인

### 3-1. 배포 완료 확인

1. **배포가 완료되면:**
   - "Ready" 상태가 나타납니다
   - 배포 URL이 표시됩니다 (예: `field-nine-solutions.vercel.app`)

2. **배포 URL 클릭**
   - 새 탭에서 사이트가 열립니다

---

### 3-2. 자동 배포 테스트

**이제 `git push`만 하면 자동으로 배포됩니다!**

1. **로컬에서 코드 수정**
   - 아무 파일이나 수정

2. **GitHub에 올리기:**
   ```powershell
   git add .
   git commit -m "Test auto deployment"
   git push
   ```

3. **Vercel 대시보드 확인**
   - 자동으로 새 배포가 시작됩니다!
   - "Building..." 상태가 나타납니다

---

## ✅ 완료 확인

### 성공 확인 방법:

1. **Vercel 대시보드에서:**
   - ✅ 프로젝트가 생성됨
   - ✅ 배포가 완료됨 (Ready 상태)
   - ✅ 배포 URL이 표시됨

2. **GitHub에서:**
   - ✅ `https://github.com/kongks5798-coder/field-nine-solutions` 접속
   - ✅ 코드가 올라가 있음

3. **자동 배포 테스트:**
   - ✅ `git push` 후 Vercel에서 자동 배포 시작됨

---

## 🎉 축하합니다!

이제 **Tesla 스타일 자동 업데이트 시스템**이 완성되었습니다!

- ✅ 코드 수정 → `git push` → 자동 배포
- ✅ 더 이상 수동 배포할 필요 없음!
- ✅ `fieldnine.io` 도메인 연결도 가능!

---

## 📞 다음 단계 (선택사항)

### 도메인 연결하기

1. **Vercel 대시보드에서:**
   - 프로젝트 선택
   - Settings > Domains 이동
   - `fieldnine.io` 추가
   - DNS 설정 안내 따르기

---

## 💡 문제 해결

### 문제: "Repository not found"
- **해결:** GitHub에서 리포지토리를 먼저 만들어야 합니다
- **가이드:** `CREATE_GITHUB_REPO_FIRST.md` 참고

### 문제: "Environment Variables missing"
- **해결:** Vercel 대시보드에서 환경 변수를 모두 추가해야 합니다
- **가이드:** 위의 "2-4. 환경 변수 설정" 참고

### 문제: "Build failed"
- **해결:** 로컬에서 `npm run build` 실행하여 에러 확인
- **가이드:** 에러 메시지를 확인하고 수정

---

**이제 Vercel 대시보드로 가서 프로젝트를 연결하세요!** 🚀
