# 🎯 단계별 해결 가이드 (지금 바로 따라하세요!)

**현재 상태:** 환경 변수 일부 누락 + 재배포 필요

---

## ✅ 현재 Vercel에 설정된 환경 변수

- ✅ NEXT_PUBLIC_SUPABASE_URL
- ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
- ✅ SUPABASE_SERVICE_ROLE_KEY
- ✅ NEXT_PUBLIC_KAKAO_REST_API_KEY
- ✅ NEXT_PUBLIC_SITE_URL

---

## ❌ 누락된 환경 변수 2개

1. **NEXT_PUBLIC_PYTHON_SERVER_URL**
2. **ENCRYPTION_KEY**

---

## 🚀 지금 바로 할 일 (5분)

### 1단계: Vercel 대시보드 열기 (30초)

1. 브라우저에서 이 링크 열기:
   ```
   https://vercel.com/dashboard
   ```

2. `field-nine-solutions` 프로젝트 클릭

3. 왼쪽 메뉴에서 **"Settings"** 클릭

4. **"Environment Variables"** 클릭

---

### 2단계: 누락된 환경 변수 추가 (2분)

#### ✅ 변수 1: NEXT_PUBLIC_PYTHON_SERVER_URL

1. **"Add New"** 버튼 클릭 (또는 "Add" 버튼)

2. **Key 입력:**
   ```
   NEXT_PUBLIC_PYTHON_SERVER_URL
   ```
   ⚠️ **정확히 이렇게 입력하세요!** (대소문자, 언더스코어 정확히)

3. **Value 입력:**
   ```
   http://localhost:8000
   ```
   (또는 실제 Python 서버 URL)

4. **Environment 체크박스:**
   - ✅ **Production** 체크
   - ✅ **Preview** 체크
   - ✅ **Development** 체크
   
   ⚠️ **3개 모두 체크해야 합니다!**

5. **"Add"** 버튼 클릭

---

#### ✅ 변수 2: ENCRYPTION_KEY

1. **"Add New"** 버튼 클릭

2. **Key 입력:**
   ```
   ENCRYPTION_KEY
   ```
   ⚠️ **정확히 이렇게 입력하세요!**

3. **Value 입력:**
   ```
   field-nine-encryption-key-2024-secure-32chars
   ```
   (32자 이상의 아무 문자열이나 가능)

4. **Environment 체크박스:**
   - ✅ **Production** 체크
   - ✅ **Preview** 체크
   - ✅ **Development** 체크
   
   ⚠️ **3개 모두 체크해야 합니다!**

5. **"Add"** 버튼 클릭

---

### 3단계: 재배포 실행 (2분)

**⚠️ 중요: 환경 변수를 추가한 후 반드시 재배포해야 합니다!**

#### 방법 1: Vercel 대시보드에서 (권장)

1. 상단 메뉴에서 **"Deployments"** 탭 클릭

2. 가장 최신 배포(맨 위) 찾기

3. 배포 오른쪽에 있는 **"..."** (점 3개) 메뉴 클릭

4. **"Redeploy"** 선택

5. 팝업에서 **"Redeploy"** 버튼 클릭

6. 배포 완료 대기 (1-2분)
   - 상태가 "Building..." → "Ready"로 변경되면 완료

#### 방법 2: 터미널에서

```powershell
cd c:\Users\polor\field-nine-solutions
vercel --prod --yes
```

---

### 4단계: 확인 (30초)

재배포 완료 후 (1-2분):

1. **환경 변수 진단 페이지 접속:**
   ```
   https://field-nine-solutions-ij38saz8i-kaus2025.vercel.app/debug-env
   ```

2. **모든 변수가 "✅ 정상" 상태여야 합니다**

3. **사이트 접속:**
   ```
   https://field-nine-solutions-ij38saz8i-kaus2025.vercel.app
   ```
   - 에러가 사라지고 로그인 페이지가 보여야 합니다

---

## 🚨 자주 하는 실수

### ❌ 실수 1: 환경 변수 이름 오타
- ❌ `NEXT_PUBLIC_PYTHON_SERVER` (URL 빠짐)
- ❌ `next_public_python_server_url` (소문자)
- ✅ `NEXT_PUBLIC_PYTHON_SERVER_URL` (정확)

### ❌ 실수 2: 환경 선택 안 함
- ❌ Production만 체크
- ✅ Production, Preview, Development 모두 체크

### ❌ 실수 3: 재배포 안 함
- ❌ 환경 변수만 추가하고 재배포 안 함
- ✅ 환경 변수 추가 후 반드시 재배포

### ❌ 실수 4: 값에 공백/따옴표 포함
- ❌ `"http://localhost:8000"` (따옴표 포함)
- ❌ ` http://localhost:8000 ` (앞뒤 공백)
- ✅ `http://localhost:8000` (값만)

---

## 📋 체크리스트

진행 상황을 체크하세요:

- [ ] Vercel 대시보드 접속
- [ ] Settings > Environment Variables 이동
- [ ] `NEXT_PUBLIC_PYTHON_SERVER_URL` 추가
  - [ ] Key 정확히 입력
  - [ ] Value 입력
  - [ ] Production, Preview, Development 모두 체크
- [ ] `ENCRYPTION_KEY` 추가
  - [ ] Key 정확히 입력
  - [ ] Value 입력 (32자 이상)
  - [ ] Production, Preview, Development 모두 체크
- [ ] Deployments 탭으로 이동
- [ ] 최신 배포에서 "Redeploy" 실행
- [ ] 배포 완료 대기 (1-2분)
- [ ] 환경 변수 진단 페이지에서 확인
- [ ] 사이트 접속하여 에러 확인

---

## 💡 팁

**재배포 상태 확인:**
- Vercel 대시보드 > Deployments 탭
- 최신 배포의 상태 확인:
  - "Building..." → 배포 중
  - "Ready" → 배포 완료 ✅
  - "Error" → 에러 발생 (로그 확인)

**자동 재배포:**
- 환경 변수를 추가하면 Vercel이 자동으로 재배포를 시작할 수 있습니다
- 하지만 수동으로 확인하는 것이 안전합니다

---

## 🎯 요약

1. **누락된 변수 2개 추가** (2분)
   - `NEXT_PUBLIC_PYTHON_SERVER_URL`
   - `ENCRYPTION_KEY`

2. **재배포 실행** (2분)
   - Deployments > Redeploy

3. **확인** (30초)
   - `/debug-env` 페이지에서 확인

**총 소요 시간: 약 5분** ⏱️

---

**이 가이드를 따라하시면 100% 해결됩니다!** 🚀
