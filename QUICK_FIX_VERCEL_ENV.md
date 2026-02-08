# ⚡ 필살기: Vercel 환경 변수 5분 안에 설정하기

**현재 문제:** 환경 변수가 없어서 사이트가 작동하지 않음  
**해결 시간:** 5분  
**난이도:** ⭐ (초보자도 가능)

---

## 🎯 가장 빠른 방법: Vercel 대시보드 사용

### 1단계: Vercel 대시보드 열기 (30초)

1. 브라우저에서 이 링크 열기:
   ```
   https://vercel.com/dashboard
   ```
2. 로그인 (이미 로그인되어 있을 수 있음)
3. **`field-nine-solutions`** 프로젝트 클릭

---

### 2단계: 환경 변수 추가 (3분)

1. 프로젝트 페이지에서 **"Settings"** 탭 클릭
2. 왼쪽 메뉴에서 **"Environment Variables"** 클릭
3. 다음 변수들을 **하나씩 추가**:

#### ✅ 변수 1: NEXT_PUBLIC_SUPABASE_URL
- **Key 입력란:** `NEXT_PUBLIC_SUPABASE_URL`
- **Value 입력란:** Supabase URL (예: `https://abcdefghijklmnop.supabase.co`)
- **Environment 체크박스:** ✅ Production, ✅ Preview, ✅ Development 모두 체크
- **"Add" 버튼 클릭**

#### ✅ 변수 2: NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Key 입력란:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value 입력란:** Supabase Anon Key (긴 문자열)
- **Environment 체크박스:** ✅ Production, ✅ Preview, ✅ Development 모두 체크
- **"Add" 버튼 클릭**

#### ✅ 변수 3: SUPABASE_SERVICE_ROLE_KEY
- **Key 입력란:** `SUPABASE_SERVICE_ROLE_KEY`
- **Value 입력란:** Supabase Service Role Key (긴 문자열)
- **Environment 체크박스:** ✅ Production, ✅ Preview, ✅ Development 모두 체크
- **"Add" 버튼 클릭**

#### ✅ 변수 4: ENCRYPTION_KEY
- **Key 입력란:** `ENCRYPTION_KEY`
- **Value 입력란:** 32자 이상의 랜덤 문자열 (예: `my-super-secret-encryption-key-32-chars`)
- **Environment 체크박스:** ✅ Production, ✅ Preview, ✅ Development 모두 체크
- **"Add" 버튼 클릭**

---

### 3단계: Supabase 키 찾는 방법 (1분)

만약 `.env.local` 파일이 없다면:

1. **Supabase 대시보드 열기:**
   ```
   https://app.supabase.com
   ```

2. **프로젝트 선택** (이미 프로젝트가 있다면)

3. **Settings > API 메뉴로 이동:**
   - 왼쪽 메뉴에서 **"Settings"** 클릭
   - **"API"** 탭 클릭

4. **키 복사:**
   - **"Project URL"** → `NEXT_PUBLIC_SUPABASE_URL`에 사용
   - **"anon public"** 키 → `NEXT_PUBLIC_SUPABASE_ANON_KEY`에 사용
   - **"service_role"** 키 → `SUPABASE_SERVICE_ROLE_KEY`에 사용

5. **ENCRYPTION_KEY 생성:**
   - 아무 긴 문자열이나 사용 가능 (32자 이상 권장)
   - 예: `my-field-nine-encryption-key-2024-secure`

---

### 4단계: 재배포 (1분)

환경 변수를 모두 추가한 후:

1. **Deployments 탭으로 이동**
2. 최신 배포 옆의 **"..."** (점 3개) 메뉴 클릭
3. **"Redeploy"** 선택
4. 또는 자동 재배포 대기 (보통 1-2분)

---

## ✅ 확인 방법

재배포가 완료되면:

1. **사이트 접속:**
   ```
   https://field-nine-solutions-ij38saz8i-kaus2025.vercel.app
   ```

2. **에러가 사라지고 로그인 페이지가 보이면 성공!** 🎉

3. **환경 변수 진단 페이지 확인:**
   ```
   https://field-nine-solutions-ij38saz8i-kaus2025.vercel.app/debug-env
   ```
   - 모든 변수가 "✅ SET" 상태여야 합니다

---

## 🚨 문제 해결

### "환경 변수를 추가했는데도 에러가 발생해요"

1. **재배포 확인**
   - 환경 변수 추가 후 자동 재배포가 완료되었는지 확인
   - Deployments 탭에서 최신 배포가 "Ready" 상태인지 확인

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

- [ ] Vercel 대시보드 접속
- [ ] Settings > Environment Variables 이동
- [ ] NEXT_PUBLIC_SUPABASE_URL 추가
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY 추가
- [ ] SUPABASE_SERVICE_ROLE_KEY 추가
- [ ] ENCRYPTION_KEY 추가
- [ ] 모든 환경(Production, Preview, Development)에 체크
- [ ] 재배포 완료 대기
- [ ] 사이트 접속하여 확인

---

## 🎯 요약

**총 소요 시간:** 약 5분  
**필요한 것:** Supabase 키 (또는 .env.local 파일)  
**결과:** 사이트가 정상 작동! 🚀

---

**이 방법으로 한 번에 해결됩니다!** 💪
