# 🚀 Vercel 배포 가이드 (초등학생도 따라 할 수 있는 가이드)

이 가이드는 **초등학생도 따라 할 수 있도록** 매우 상세하게 작성되었습니다.

---

## 📋 준비물

1. **GitHub 계정** (없으면 https://github.com 에서 무료로 만들기)
2. **Vercel 계정** (없으면 https://vercel.com 에서 무료로 만들기)
3. **Supabase 프로젝트** (이미 있음)

---

## 1단계: GitHub에 코드 올리기

### 1-1. GitHub 저장소 만들기

1. **GitHub 웹사이트 접속**
   - 브라우저에서 https://github.com 접속
   - 로그인 (없으면 회원가입)

2. **새 저장소 만들기**
   - 오른쪽 위 **"+"** 버튼 클릭
   - **"New repository"** 클릭
   - **Repository name**: `field-nine-solutions` 입력
   - **Public** 선택 (무료로 사용 가능)
   - **"Create repository"** 버튼 클릭

### 1-2. 코드를 GitHub에 올리기

**방법 1: GitHub Desktop 사용 (가장 쉬움)**

1. **GitHub Desktop 다운로드**
   - https://desktop.github.com 접속
   - **"Download for Windows"** 클릭
   - 설치 프로그램 실행

2. **GitHub Desktop에서 저장소 추가**
   - GitHub Desktop 실행
   - **"File"** → **"Add Local Repository"** 클릭
   - **"Choose..."** 버튼 클릭
   - `C:\Users\polor\field-nine-solutions` 폴더 선택
   - **"Add repository"** 클릭

3. **코드 올리기**
   - 왼쪽 아래 **"Commit to main"** 입력란에 "Initial commit" 입력
   - **"Commit to main"** 버튼 클릭
   - **"Push origin"** 버튼 클릭
   - GitHub 계정 로그인 (처음 한 번만)

**방법 2: 터미널 사용 (고급)**

터미널에서 다음 명령어를 **순서대로** 입력하세요:

```powershell
# 1. 프로젝트 폴더로 이동
cd C:\Users\polor\field-nine-solutions

# 2. Git 초기화 (처음 한 번만)
git init

# 3. 모든 파일 추가
git add .

# 4. 커밋 (저장)
git commit -m "Initial commit"

# 5. GitHub 저장소 연결 (YOUR_USERNAME을 본인 GitHub 사용자명으로 변경)
git remote add origin https://github.com/YOUR_USERNAME/field-nine-solutions.git

# 6. 코드 올리기
git branch -M main
git push -u origin main
```

---

## 2단계: Vercel에 배포하기

### 2-1. Vercel 계정 만들기

1. **Vercel 웹사이트 접속**
   - 브라우저에서 https://vercel.com 접속
   - **"Sign Up"** 버튼 클릭
   - **"Continue with GitHub"** 클릭 (GitHub 계정으로 로그인)

### 2-2. 프로젝트 배포하기

1. **새 프로젝트 만들기**
   - Vercel 대시보드에서 **"Add New..."** → **"Project"** 클릭
   - **"Import Git Repository"** 클릭
   - 방금 만든 `field-nine-solutions` 저장소 선택
   - **"Import"** 버튼 클릭

2. **프로젝트 설정**
   - **Framework Preset**: Next.js (자동 감지됨)
   - **Root Directory**: `./` (그대로 두기)
   - **Build Command**: `npm run build` (자동 입력됨)
   - **Output Directory**: `.next` (자동 입력됨)
   - **Install Command**: `npm install` (자동 입력됨)

3. **환경 변수 설정** (중요!)
   - **"Environment Variables"** 섹션 클릭
   - 다음 3개 변수를 추가:

   **변수 1:**
   - **Name**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**: Supabase Dashboard > Settings > API > Project URL 복사
   - **"Add"** 버튼 클릭

   **변수 2:**
   - **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value**: Supabase Dashboard > Settings > API > anon public 키 복사
   - **"Add"** 버튼 클릭

   **변수 3:**
   - **Name**: `SUPABASE_SERVICE_ROLE_KEY`
   - **Value**: Supabase Dashboard > Settings > API > service_role 키 복사
   - **"Add"** 버튼 클릭

4. **배포 시작**
   - **"Deploy"** 버튼 클릭
   - 배포가 완료될 때까지 기다리기 (약 2-3분)

5. **배포 완료 확인**
   - 배포가 완료되면 **"Visit"** 버튼이 나타남
   - 클릭하면 배포된 사이트가 열림!
   - URL 예시: `https://field-nine-solutions.vercel.app`

---

## 3단계: Supabase 데이터베이스 마이그레이션 실행

배포된 사이트가 작동하려면 Supabase에 데이터베이스 테이블을 만들어야 합니다.

1. **Supabase Dashboard 접속**
   - https://app.supabase.com 접속
   - 프로젝트 선택

2. **SQL Editor 열기**
   - 왼쪽 메뉴에서 **"SQL Editor"** 클릭
   - **"New Query"** 버튼 클릭

3. **마이그레이션 실행**
   - `supabase/migrations/009_oms_core_schema.sql` 파일 열기
   - 전체 내용 복사
   - Supabase SQL Editor에 붙여넣기
   - **"Run"** 버튼 클릭
   - 성공 메시지 확인

---

## 4단계: 배포 확인 및 테스트

1. **배포된 사이트 접속**
   - Vercel 대시보드에서 **"Visit"** 버튼 클릭
   - 또는 배포된 URL 직접 접속

2. **기능 테스트**
   - 로그인 페이지 접속
   - 회원가입/로그인 테스트
   - 대시보드 접속 확인

---

## 🐛 문제 해결

### 문제 1: "Build Failed" 오류

**해결 방법:**
1. Vercel 대시보드에서 **"Deployments"** 클릭
2. 실패한 배포 클릭
3. **"Logs"** 탭에서 오류 메시지 확인
4. 오류 메시지를 보고 코드 수정
5. GitHub에 푸시하면 자동으로 다시 배포됨

### 문제 2: "Environment Variable Missing" 오류

**해결 방법:**
1. Vercel 대시보드에서 프로젝트 선택
2. **"Settings"** → **"Environment Variables"** 클릭
3. 누락된 환경 변수 추가
4. **"Redeploy"** 버튼 클릭

### 문제 3: "Database Error" 오류

**해결 방법:**
1. Supabase Dashboard에서 SQL 마이그레이션 실행 확인
2. RLS 정책이 올바르게 적용되었는지 확인
3. 환경 변수가 올바르게 설정되었는지 확인

---

## ✅ 배포 완료 체크리스트

- [ ] GitHub에 코드 올리기 완료
- [ ] Vercel에 프로젝트 배포 완료
- [ ] 환경 변수 3개 모두 설정 완료
- [ ] Supabase 마이그레이션 실행 완료
- [ ] 배포된 사이트 접속 확인
- [ ] 로그인 기능 테스트 완료

---

## 🎉 완료!

이제 배포된 사이트 URL을 공유하면 누구나 접속할 수 있습니다!

**배포된 URL 예시**: `https://field-nine-solutions.vercel.app`

---

**문제가 생기면 Vercel 대시보드의 "Logs"를 확인하세요!** 🔍
