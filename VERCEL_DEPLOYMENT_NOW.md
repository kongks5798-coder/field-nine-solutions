# 🚀 Field Nine - Vercel 배포 실행 가이드

**현재 상태:** ✅ 데이터베이스 연결 완료, 로컬 테스트 통과  
**목표:** Vercel에 배포하여 실제 URL 공유 가능하게 만들기

---

## 📋 Step 1: Git 커밋 및 GitHub 푸시

### 1-1. 모든 변경사항 추가

**터미널에 입력:**
```powershell
git add .
```

**설명:** 새로 생성된 모든 파일과 수정된 파일을 Git에 추가합니다.

---

### 1-2. 커밋 생성

**터미널에 입력:**
```powershell
git commit -m "feat: Add Supabase integration and inventory system"
```

**설명:** 변경사항을 커밋합니다. 메시지는 자유롭게 변경 가능합니다.

---

### 1-3. GitHub에 푸시

**터미널에 입력:**
```powershell
git push origin main
```

**설명:** GitHub 리포지토리에 코드를 업로드합니다.

**만약 에러가 발생하면:**
- GitHub 리포지토리가 없으면 먼저 생성해야 합니다 (아래 참고)

---

### 1-4. GitHub 리포지토리 확인

**이미 리포지토리가 있다면:**
- ✅ 위의 `git push` 명령어만 실행하면 됩니다.

**리포지토리가 없다면:**

1. **GitHub 웹사이트 접속:**
   ```
   https://github.com
   ```

2. **오른쪽 위 "+" 버튼 클릭** → **"New repository"**

3. **리포지토리 정보 입력:**
   - **Repository name:** `field-nine-solutions`
   - **Public** 또는 **Private** 선택
   - **체크박스 모두 해제** (README, .gitignore, license)

4. **"Create repository" 버튼 클릭**

5. **리포지토리 생성 후:**
   - GitHub가 표시하는 명령어는 무시하고
   - 위의 `git push origin main` 명령어만 실행하면 됩니다.

---

## 📋 Step 2: Vercel 연결 및 배포

### 2-1. Vercel 대시보드 접속

1. **브라우저에서 접속:**
   ```
   https://vercel.com/dashboard
   ```

2. **로그인** (GitHub 계정 권장)

---

### 2-2. 새 프로젝트 추가

1. **"Add New..."** 버튼 클릭
   - 화면 오른쪽 위에 있습니다

2. **"Project"** 선택

---

### 2-3. GitHub 리포지토리 선택

1. **"Import Git Repository"** 섹션에서
2. `field-nine-solutions` 리포지토리 찾기
   - 검색창에 `field-nine-solutions` 입력
3. **"Import"** 버튼 클릭

---

### 2-4. 프로젝트 설정 (자동 감지됨)

**다음 설정들이 자동으로 감지됩니다:**

- ✅ **Framework Preset:** Next.js
- ✅ **Root Directory:** `./`
- ✅ **Build Command:** `npm run build`
- ✅ **Output Directory:** `.next`
- ✅ **Install Command:** `npm install --legacy-peer-deps`

**변경할 필요 없습니다!** 그대로 두세요.

---

### 2-5. ⚠️ 환경 변수 설정 (중요!)

**이 단계를 건너뛰면 배포가 실패합니다!**

1. **"Environment Variables"** 섹션 클릭
   - 화면 아래쪽에 있습니다

2. **`.env.local` 파일 열기**
   - 프로젝트 폴더에서 `.env.local` 파일 찾기
   - 메모장으로 열기

3. **환경 변수 하나씩 추가:**

#### 변수 1: NEXT_PUBLIC_SUPABASE_URL
- **Name:** `NEXT_PUBLIC_SUPABASE_URL`
- **Value:** `.env.local` 파일에서 복사
  ```
  https://ivazoqddehjbfhmfdmck.supabase.co
  ```
- **Environment:** ✅ Production, ✅ Preview, ✅ Development 모두 체크
- **"Add"** 버튼 클릭

#### 변수 2: NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value:** `.env.local` 파일에서 복사
  ```
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2YXpvcWRkZWhqYmZobWZkbWNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MDYyODYsImV4cCI6MjA4MzI4MjI4Nn0.Sb-lQPN5apyh3Y9KU-wjvsWJzIG8UOM-WH5T1dF1Qq4
  ```
- **Environment:** ✅ Production, ✅ Preview, ✅ Development 모두 체크
- **"Add"** 버튼 클릭

#### 변수 3: SUPABASE_SERVICE_ROLE_KEY (있는 경우)
- **Name:** `SUPABASE_SERVICE_ROLE_KEY`
- **Value:** `.env.local` 파일에서 복사
- **Environment:** ✅ Production, ✅ Preview, ✅ Development 모두 체크
- **"Add"** 버튼 클릭

#### 변수 4: ENCRYPTION_KEY (있는 경우)
- **Name:** `ENCRYPTION_KEY`
- **Value:** `.env.local` 파일에서 복사
- **Environment:** ✅ Production, ✅ Preview, ✅ Development 모두 체크
- **"Add"** 버튼 클릭

#### 변수 5: NEXT_PUBLIC_PYTHON_SERVER_URL (있는 경우)
- **Name:** `NEXT_PUBLIC_PYTHON_SERVER_URL`
- **Value:** `.env.local` 파일에서 복사
- **Environment:** ✅ Production, ✅ Preview, ✅ Development 모두 체크
- **"Add"** 버튼 클릭

**⚠️ 중요:** 모든 환경 변수를 추가한 후에만 배포하세요!

---

### 2-6. 배포 실행

1. **모든 환경 변수를 추가한 후**
2. **"Deploy"** 버튼 클릭
   - 초록색 버튼입니다
   - 화면 아래쪽에 있습니다

3. **배포 진행 상황 확인**
   - "Building..." 메시지가 나타납니다
   - 약 2-3분 소요됩니다

---

## 📋 Step 3: 배포 완료 확인

### 3-1. 배포 상태 확인

**배포가 완료되면:**

1. **"Ready"** 또는 **"Deployed"** 상태로 변경됨
2. **배포 URL 표시됨** (예: `field-nine-solutions.vercel.app`)
3. **URL 클릭하여 사이트 열기**

---

### 3-2. 최종 검증 체크리스트

**배포된 사이트에서 다음 항목들을 확인하세요:**

#### ✅ 기본 기능 확인

- [ ] **사이트 접속 가능**
  - 배포 URL이 정상적으로 열림
  - 에러 메시지 없음

- [ ] **로그인 페이지 작동**
  - `/login` 페이지 접속 가능
  - 로그인 버튼 클릭 가능

- [ ] **대시보드 접속 가능**
  - 로그인 후 `/dashboard` 접속 가능
  - 사이드바 메뉴 표시됨

#### ✅ 재고 관리 기능 확인

- [ ] **재고 관리 페이지 접속**
  - `/dashboard/inventory` 접속 가능
  - 로딩 스켈레톤 표시 후 상품 목록 표시

- [ ] **상품 목록 표시**
  - Supabase에 저장된 상품들이 표시됨
  - 테이블이 정상적으로 렌더링됨

- [ ] **상품 추가 기능**
  - "상품 추가" 버튼 클릭 가능
  - 모달이 정상적으로 열림
  - 상품 정보 입력 후 추가 가능
  - 추가 후 목록에 즉시 반영됨

- [ ] **검색 기능**
  - 검색창에 입력하면 실시간 필터링됨

- [ ] **필터 기능**
  - "재고 부족만" 버튼 작동
  - 가격 정렬 버튼 작동

#### ✅ 데이터베이스 연결 확인

- [ ] **Supabase 연결 확인**
  - 상품 목록이 Supabase 데이터와 일치함
  - 새 상품 추가 시 Supabase에 저장됨
  - Supabase 대시보드에서 새 상품 확인 가능

#### ✅ 성능 확인

- [ ] **페이지 로딩 속도**
  - 페이지가 빠르게 로드됨 (3초 이내)
  - 로딩 스켈레톤이 적절히 표시됨

- [ ] **에러 없음**
  - 브라우저 콘솔에 에러 없음 (F12로 확인)
  - 네트워크 탭에 실패한 요청 없음

---

## 🚨 문제 해결

### 문제 1: "Build Failed" 에러

**원인:** 환경 변수 누락 또는 타입 에러

**해결:**
1. Vercel 배포 로그 확인
2. 환경 변수가 모두 추가되었는지 확인
3. 로컬에서 `npm run build` 실행하여 에러 확인

---

### 문제 2: "Unauthorized" 또는 "Database Error"

**원인:** 환경 변수 값이 잘못됨

**해결:**
1. Vercel 대시보드 > Settings > Environment Variables
2. 각 변수의 값이 `.env.local`과 일치하는지 확인
3. 저장 후 "Redeploy" 버튼 클릭

---

### 문제 3: 상품 목록이 표시되지 않음

**원인:** Supabase 연결 실패 또는 RLS 정책 문제

**해결:**
1. 브라우저 콘솔 확인 (F12)
2. 네트워크 탭에서 `/api/products` 요청 확인
3. Supabase 대시보드에서 RLS 정책 확인

---

## 🎉 배포 완료!

**축하합니다! Field Nine이 성공적으로 배포되었습니다!**

이제:
- ✅ 배포 URL을 다른 사람들과 공유할 수 있습니다
- ✅ 코드 수정 → `git push` → 자동 배포
- ✅ Tesla 스타일 자동 업데이트 시스템 완성

---

## 📝 다음 단계 (선택사항)

### 도메인 연결 (fieldnine.io)

1. Vercel 대시보드 > Settings > Domains
2. `fieldnine.io` 추가
3. DNS 설정 안내 따르기

자세한 내용은 `DEPLOY_GUIDE.md` 참고하세요.

---

**준비되면 첫 번째 명령어부터 시작하세요!** 🚀
