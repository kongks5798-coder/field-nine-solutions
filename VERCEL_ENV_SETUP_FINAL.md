# 🚀 필살기: Vercel 환경 변수 한 번에 설정하기

**이 방법으로 5분 안에 모든 환경 변수를 설정하고 사이트를 작동시킬 수 있습니다!**

---

## ⚡ 방법 1: Vercel CLI로 한 번에 설정 (가장 빠름!)

### 1단계: 로컬 .env.local 파일 확인

프로젝트 루트에 `.env.local` 파일이 있는지 확인하고, 다음 변수들이 있는지 확인하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ENCRYPTION_KEY=your-32-character-encryption-key
NEXT_PUBLIC_PYTHON_SERVER_URL=http://localhost:8000
```

### 2단계: PowerShell 스크립트 실행

터미널에서 다음 명령어를 실행하세요:

```powershell
# 프로젝트 디렉토리로 이동
cd c:\Users\polor\field-nine-solutions

# 환경 변수 설정 스크립트 실행
.\scripts\set-vercel-env.ps1
```

**또는 직접 명령어 실행:**

```powershell
# 1. NEXT_PUBLIC_SUPABASE_URL 설정
vercel env add NEXT_PUBLIC_SUPABASE_URL production preview development

# 2. NEXT_PUBLIC_SUPABASE_ANON_KEY 설정
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production preview development

# 3. SUPABASE_SERVICE_ROLE_KEY 설정
vercel env add SUPABASE_SERVICE_ROLE_KEY production preview development

# 4. ENCRYPTION_KEY 설정
vercel env add ENCRYPTION_KEY production preview development

# 5. NEXT_PUBLIC_PYTHON_SERVER_URL 설정 (선택사항)
vercel env add NEXT_PUBLIC_PYTHON_SERVER_URL production preview development
```

각 명령어 실행 시 값을 입력하라는 프롬프트가 나타납니다. `.env.local` 파일에서 값을 복사해서 붙여넣으세요.

### 3단계: 재배포

환경 변수 설정 후 자동으로 재배포되거나, 수동으로 재배포:

```powershell
vercel --prod --yes
```

---

## 🎯 방법 2: Vercel 대시보드에서 설정 (시각적 방법)

### 1단계: Vercel 대시보드 접속

1. 브라우저에서 https://vercel.com/dashboard 접속
2. 로그인 (이미 로그인되어 있을 수 있음)
3. `field-nine-solutions` 프로젝트 클릭

### 2단계: Settings > Environment Variables 이동

1. 프로젝트 페이지에서 **Settings** 탭 클릭
2. 왼쪽 메뉴에서 **Environment Variables** 클릭

### 3단계: 환경 변수 추가

다음 변수들을 **하나씩 추가**하세요:

#### 변수 1: NEXT_PUBLIC_SUPABASE_URL
- **Key:** `NEXT_PUBLIC_SUPABASE_URL`
- **Value:** `.env.local` 파일에서 복사한 값
- **Environment:** ✅ Production, ✅ Preview, ✅ Development 모두 체크
- **Add** 버튼 클릭

#### 변수 2: NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Key:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value:** `.env.local` 파일에서 복사한 값
- **Environment:** ✅ Production, ✅ Preview, ✅ Development 모두 체크
- **Add** 버튼 클릭

#### 변수 3: SUPABASE_SERVICE_ROLE_KEY
- **Key:** `SUPABASE_SERVICE_ROLE_KEY`
- **Value:** `.env.local` 파일에서 복사한 값
- **Environment:** ✅ Production, ✅ Preview, ✅ Development 모두 체크
- **Add** 버튼 클릭

#### 변수 4: ENCRYPTION_KEY
- **Key:** `ENCRYPTION_KEY`
- **Value:** `.env.local` 파일에서 복사한 값 (32자 이상)
- **Environment:** ✅ Production, ✅ Preview, ✅ Development 모두 체크
- **Add** 버튼 클릭

#### 변수 5: NEXT_PUBLIC_PYTHON_SERVER_URL (선택사항)
- **Key:** `NEXT_PUBLIC_PYTHON_SERVER_URL`
- **Value:** `http://localhost:8000` 또는 실제 Python 서버 URL
- **Environment:** ✅ Production, ✅ Preview, ✅ Development 모두 체크
- **Add** 버튼 클릭

### 4단계: 재배포

환경 변수를 추가한 후:

1. **Deployments** 탭으로 이동
2. 최신 배포 옆의 **"..."** 메뉴 클릭
3. **Redeploy** 선택
4. 또는 자동으로 재배포될 때까지 대기 (몇 분 소요)

---

## 🔍 Supabase 키 찾는 방법

`.env.local` 파일이 없다면:

1. **Supabase 대시보드 접속**
   - https://app.supabase.com
   - 프로젝트 선택

2. **Settings > API 메뉴로 이동**
   - 왼쪽 메뉴에서 **Settings** 클릭
   - **API** 탭 클릭

3. **키 복사**
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`에 사용
   - **anon public** 키 → `NEXT_PUBLIC_SUPABASE_ANON_KEY`에 사용
   - **service_role** 키 → `SUPABASE_SERVICE_ROLE_KEY`에 사용

4. **ENCRYPTION_KEY 생성**
   - 32자 이상의 랜덤 문자열 생성
   - 예: `openssl rand -base64 32` 명령어로 생성
   - 또는 온라인 랜덤 문자열 생성기 사용

---

## ✅ 확인 방법

환경 변수 설정 후:

1. **Vercel 대시보드에서 확인**
   - Settings > Environment Variables에서 모든 변수가 추가되었는지 확인

2. **사이트 접속 테스트**
   - https://field-nine-solutions-ij38saz8i-kaus2025.vercel.app 접속
   - 에러가 사라지고 정상적으로 로그인 페이지가 보여야 합니다

3. **환경 변수 진단 페이지 확인**
   - https://field-nine-solutions-ij38saz8i-kaus2025.vercel.app/debug-env 접속
   - 모든 변수가 "✅ SET" 상태여야 합니다

---

## 🚨 문제 해결

### 환경 변수를 추가했는데도 에러가 발생하는 경우

1. **재배포 확인**
   - 환경 변수 추가 후 자동 재배포가 완료되었는지 확인
   - Deployments 탭에서 최신 배포 상태 확인

2. **변수 이름 확인**
   - 대소문자 정확히 일치하는지 확인
   - `NEXT_PUBLIC_` 접두사 확인

3. **모든 환경에 추가 확인**
   - Production, Preview, Development 모두 체크했는지 확인

4. **값 확인**
   - 공백이나 특수문자가 잘못 포함되지 않았는지 확인
   - 따옴표 없이 값만 입력했는지 확인

---

## 📋 체크리스트

- [ ] `.env.local` 파일에서 Supabase 키 확인
- [ ] Vercel 대시보드 또는 CLI로 환경 변수 추가
- [ ] 모든 환경(Production, Preview, Development)에 추가 확인
- [ ] 재배포 완료 대기
- [ ] 사이트 접속하여 에러 확인
- [ ] 환경 변수 진단 페이지에서 확인

---

**이 방법으로 5분 안에 모든 문제를 해결할 수 있습니다!** 🚀
