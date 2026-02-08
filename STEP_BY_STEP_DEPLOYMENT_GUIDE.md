# 🚀 Field Nine 상용화: 초등학생도 이해하는 단계별 가이드

**목표**: 92% → 100% 완성도 달성 및 배포 완료

---

## 📋 Step 1: Vercel에 웹사이트 올리기 (가장 중요!)

### 1-1. Vercel 웹사이트 열기

1. **인터넷 브라우저 열기** (크롬, 엣지 등)
2. **주소창에 입력**: `https://vercel.com`
3. **Enter 키 누르기**
4. **화면이 열리면**: 오른쪽 위에 "Sign Up" 또는 "Log In" 버튼이 보입니다

### 1-2. GitHub로 로그인하기

1. **"Log In" 버튼 클릭**
2. **"Continue with GitHub" 버튼 클릭**
   - 이렇게 하면 GitHub 계정으로 자동 로그인됩니다
   - 만약 GitHub 계정이 없다면 먼저 GitHub에 가입해야 합니다

### 1-3. 새 프로젝트 만들기

1. **화면 왼쪽 위에 "Add New..." 버튼 찾기**
2. **"Add New..." 버튼 클릭**
3. **작은 메뉴가 나타나면 "Project" 클릭**

### 1-4. GitHub 저장소 연결하기

1. **"Import Git Repository" 라는 큰 제목이 보입니다**
2. **아래에 저장소 목록이 보입니다**
3. **"kongks5798-coder/field-nine-solutions" 찾기**
   - 만약 안 보이면 "Configure GitHub App"을 클릭해서 권한을 허용해야 합니다
4. **"field-nine-solutions" 옆에 "Import" 버튼 클릭**

### 1-5. 프로젝트 설정하기

**이제 프로젝트 설정 화면이 나타납니다. 아래 순서대로 설정하세요:**

#### A. Framework 설정
- **"Framework Preset"** 이라는 항목 찾기
- **드롭다운 메뉴 클릭**
- **"Next.js" 선택** (보통 자동으로 선택되어 있습니다)

#### B. Root Directory 설정
- **"Root Directory"** 항목 찾기
- **"/" (슬래시 하나) 입력되어 있는지 확인**
- **그대로 두기** (변경하지 않음)

#### C. Build and Deploy Settings 펼치기
- **"Build and Deploy Settings"** 라는 제목 옆에 **▼ (아래 화살표)** 클릭
- **펼쳐지면 다음 설정 확인:**

**Build Command:**
- 입력창에 `npm run build` 라고 되어 있는지 확인
- 없으면 입력하기

**Output Directory:**
- `.next` 라고 되어 있는지 확인
- 없으면 입력하기

**Install Command:**
- **중요!** 이 부분을 수정해야 합니다
- 기존 값 지우고 `npm ci --legacy-peer-deps` 입력하기

#### D. Environment Variables 설정 (가장 중요!)

1. **"Environment Variables"** 라는 제목 옆에 **▼ (아래 화살표)** 클릭
2. **펼쳐지면 "Add New" 버튼이 보입니다**
3. **아래 6개 변수를 하나씩 추가하세요:**

**변수 1: NEXT_PUBLIC_SUPABASE_URL**
- **Name (이름)**: `NEXT_PUBLIC_SUPABASE_URL`
- **Value (값)**: `https://your-project.supabase.co`
  - ⚠️ **주의**: `your-project` 부분을 실제 Supabase 프로젝트 URL로 바꿔야 합니다
  - Supabase Dashboard → Settings → API → Project URL 복사
- **Environment (환경)**: 
  - ✅ Production 체크
  - ✅ Preview 체크
  - ✅ Development 체크
- **"Add" 버튼 클릭**

**변수 2: NEXT_PUBLIC_SUPABASE_ANON_KEY**
- **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: `your_anon_key_here`
  - ⚠️ **주의**: Supabase Dashboard → Settings → API → anon public key 복사
- **Environment**: 모두 체크
- **"Add" 버튼 클릭**

**변수 3: SUPABASE_SERVICE_ROLE_KEY**
- **Name**: `SUPABASE_SERVICE_ROLE_KEY`
- **Value**: `your_service_role_key_here`
  - ⚠️ **주의**: Supabase Dashboard → Settings → API → service_role key 복사
- **Environment**: 모두 체크
- **"Add" 버튼 클릭**

**변수 4: DATABASE_URL**
- **Name**: `DATABASE_URL`
- **Value**: `postgresql://user:password@host:port/database`
  - ⚠️ **주의**: Supabase Dashboard → Settings → Database → Connection string 복사
- **Environment**: 모두 체크
- **"Add" 버튼 클릭**

**변수 5: NEXTAUTH_URL**
- **Name**: `NEXTAUTH_URL`
- **Value**: `https://your-deployment-url.vercel.app`
  - ⚠️ **주의**: 아직 배포 전이므로 임시로 입력 (배포 후 업데이트 필요)
  - 예: `https://field-nine-solutions.vercel.app`
- **Environment**: 모두 체크
- **"Add" 버튼 클릭**

**변수 6: NEXTAUTH_SECRET**
- **Name**: `NEXTAUTH_SECRET`
- **Value**: `your_random_secret_key_min_32_chars`
  - ⚠️ **주의**: 32자 이상의 랜덤 문자열 필요
  - 생성 방법: 터미널에서 `openssl rand -base64 32` 실행
  - 또는 온라인 랜덤 문자열 생성기 사용
- **Environment**: 모두 체크
- **"Add" 버튼 클릭**

### 1-6. 배포 실행하기

1. **모든 설정이 완료되면 화면 맨 아래로 스크롤**
2. **큰 검은색 "Deploy" 버튼 찾기**
3. **"Deploy" 버튼 클릭**
4. **배포가 시작됩니다! (약 2-3분 소요)**

### 1-7. 배포 완료 확인하기

1. **배포가 진행되는 동안 로그가 보입니다**
2. **"Building..." → "Deploying..." → "Ready" 순서로 진행**
3. **"Ready"가 되면 배포 완료!**
4. **화면에 URL이 나타납니다:**
   ```
   https://field-nine-solutions-xxxxx.vercel.app
   ```
5. **이 URL을 복사해두세요! (나중에 필요합니다)**

---

## 📋 Step 2: Supabase 데이터베이스 설정하기

### 2-1. Supabase 웹사이트 열기

1. **브라우저 새 탭 열기**
2. **주소창에 입력**: `https://supabase.com/dashboard`
3. **Enter 키 누르기**
4. **로그인하기** (GitHub 계정으로 로그인 가능)

### 2-2. 프로젝트 선택하기

1. **프로젝트 목록이 보입니다**
2. **Field Nine 프로젝트 찾기**
3. **프로젝트 클릭**

### 2-3. SQL Editor 열기

1. **왼쪽 메뉴에서 "SQL Editor" 찾기**
2. **"SQL Editor" 클릭**
3. **"New query" 버튼 클릭**

### 2-4. 첫 번째 마이그레이션 실행하기

**파일**: `014_auto_deduct_inventory_trigger.sql`

1. **VS Code에서 파일 열기**:
   - `supabase/migrations/014_auto_deduct_inventory_trigger.sql` 파일 열기
   - 전체 내용 선택 (Ctrl+A)
   - 복사 (Ctrl+C)

2. **Supabase SQL Editor로 돌아가기**:
   - SQL Editor의 큰 텍스트 박스에 붙여넣기 (Ctrl+V)

3. **실행하기**:
   - 오른쪽 아래 "Run" 버튼 클릭
   - 또는 Ctrl+Enter 키 누르기

4. **결과 확인**:
   - ✅ "Success. No rows returned" 메시지가 보이면 성공!
   - ❌ 에러 메시지가 보이면 에러 내용 확인

### 2-5. 두 번째 마이그레이션 실행하기

**파일**: `015_auto_update_order_status.sql`

1. **SQL Editor에서 "New query" 버튼 클릭** (새 쿼리 시작)
2. **VS Code에서 파일 열기**:
   - `supabase/migrations/015_auto_update_order_status.sql` 파일 열기
   - 전체 내용 복사
3. **SQL Editor에 붙여넣기**
4. **"Run" 버튼 클릭**
5. **✅ "Success" 메시지 확인**

### 2-6. 세 번째 마이그레이션 실행하기

**파일**: `016_auto_calculate_fees.sql`

1. **SQL Editor에서 "New query" 버튼 클릭**
2. **VS Code에서 파일 열기**:
   - `supabase/migrations/016_auto_calculate_fees.sql` 파일 열기
   - 전체 내용 복사
3. **SQL Editor에 붙여넣기**
4. **"Run" 버튼 클릭**
5. **✅ "Success" 메시지 확인**

---

## 📋 Step 3: 배포 후 설정 완료하기

### 3-1. 배포 URL 확인하기

1. **Vercel Dashboard로 돌아가기**
2. **배포 완료된 프로젝트 클릭**
3. **화면 상단에 URL이 보입니다**
4. **URL 복사하기** (예: `https://field-nine-solutions-xxxxx.vercel.app`)

### 3-2. NEXTAUTH_URL 업데이트하기

1. **Vercel Dashboard → Settings 클릭**
2. **왼쪽 메뉴에서 "Environment Variables" 클릭**
3. **"NEXTAUTH_URL" 찾기**
4. **오른쪽에 "Edit" 버튼 클릭**
5. **Value를 배포된 URL로 변경**:
   - 예: `https://field-nine-solutions-xxxxx.vercel.app`
6. **"Save" 버튼 클릭**
7. **"Redeploy" 버튼 클릭** (자동으로 나타남)

### 3-3. 연결 테스트하기

1. **브라우저 새 탭 열기**
2. **주소창에 입력**: `https://your-deployment-url.vercel.app/api/test-connection`
   - ⚠️ `your-deployment-url` 부분을 실제 배포 URL로 바꾸기
3. **Enter 키 누르기**
4. **화면에 JSON 데이터가 보이면 성공!**
   ```json
   {
     "status": "ok",
     "checks": {
       "supabase_client": { "status": "ok" },
       "database_connection": { "status": "ok" }
     }
   }
   ```

---

## 📋 Step 4: 기능 테스트하기

### 4-1. 홈페이지 테스트

1. **브라우저에서 배포 URL 열기**: `https://your-deployment-url.vercel.app`
2. **홈페이지가 정상적으로 보이는지 확인**

### 4-2. 로그인 테스트

1. **"/login" 페이지로 이동**: `https://your-deployment-url.vercel.app/login`
2. **로그인 페이지가 정상적으로 보이는지 확인**

### 4-3. 대시보드 테스트 (로그인 후)

1. **로그인 완료 후 "/dashboard" 페이지로 이동**
2. **대시보드가 정상적으로 보이는지 확인**
3. **통계 데이터가 표시되는지 확인**

### 4-4. 재고 관리 테스트

1. **"/dashboard/inventory" 페이지로 이동**
2. **상품 목록이 보이는지 확인**
3. **상품 추가 버튼 클릭해서 상품 추가 테스트**

### 4-5. 주문 관리 테스트

1. **"/dashboard/orders" 페이지로 이동**
2. **주문 목록이 보이는지 확인**

### 4-6. 분석 대시보드 테스트

1. **"/dashboard/analytics" 페이지로 이동**
2. **차트가 정상적으로 표시되는지 확인**

---

## ✅ 완료 체크리스트

### Step 1: Vercel 배포
- [ ] Vercel 로그인
- [ ] 프로젝트 생성
- [ ] GitHub 저장소 연결
- [ ] Framework 설정 (Next.js)
- [ ] Install Command 설정 (`npm ci --legacy-peer-deps`)
- [ ] 환경 변수 6개 추가
- [ ] 배포 실행
- [ ] 배포 완료 확인

### Step 2: Supabase 마이그레이션
- [ ] Supabase 로그인
- [ ] SQL Editor 열기
- [ ] 첫 번째 마이그레이션 실행 (014)
- [ ] 두 번째 마이그레이션 실행 (015)
- [ ] 세 번째 마이그레이션 실행 (016)

### Step 3: 배포 후 설정
- [ ] 배포 URL 확인
- [ ] NEXTAUTH_URL 업데이트
- [ ] Redeploy 실행
- [ ] 연결 테스트 API 호출

### Step 4: 기능 테스트
- [ ] 홈페이지 테스트
- [ ] 로그인 테스트
- [ ] 대시보드 테스트
- [ ] 재고 관리 테스트
- [ ] 주문 관리 테스트
- [ ] 분석 대시보드 테스트

---

## 🎯 최종 목표

**모든 단계를 완료하면 100% 상용화 완료!**

---

**보스, 이 가이드를 따라하시면 완벽하게 배포됩니다!**

**인프라 연결까지 완벽하게 준비되었습니다!** 🚀
