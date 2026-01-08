# 🔐 Vercel 환경 변수 설정 가이드

**배포 전 필수 작업입니다!**

---

## ⚠️ 현재 상태

빌드가 환경 변수 누락으로 실패했습니다. 다음 단계를 따라 환경 변수를 설정하세요.

---

## 📋 1단계: Vercel 대시보드 접속

1. **Vercel 대시보드 열기**
   - https://vercel.com/dashboard 접속
   - 로그인 (이미 로그인되어 있을 수 있음)

2. **프로젝트 선택**
   - `field-nine-solutions` 프로젝트 클릭

---

## 🔧 2단계: 환경 변수 추가

1. **Settings 탭 클릭**
   - 프로젝트 페이지에서 **Settings** 클릭

2. **Environment Variables 메뉴 클릭**
   - 왼쪽 메뉴에서 **Environment Variables** 선택

3. **환경 변수 추가**

   다음 변수들을 **하나씩 추가**하세요:

   ### 변수 1: NEXT_PUBLIC_SUPABASE_URL
   - **Key:** `NEXT_PUBLIC_SUPABASE_URL`
   - **Value:** `https://your-project.supabase.co` (실제 Supabase URL)
   - **Environment:** ✅ Production, ✅ Preview, ✅ Development 모두 체크
   - **Add** 버튼 클릭

   ### 변수 2: NEXT_PUBLIC_SUPABASE_ANON_KEY
   - **Key:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value:** `your-anon-key-here` (실제 Anon Key)
   - **Environment:** ✅ Production, ✅ Preview, ✅ Development 모두 체크
   - **Add** 버튼 클릭

   ### 변수 3: SUPABASE_SERVICE_ROLE_KEY
   - **Key:** `SUPABASE_SERVICE_ROLE_KEY`
   - **Value:** `your-service-role-key-here` (실제 Service Role Key)
   - **Environment:** ✅ Production, ✅ Preview, ✅ Development 모두 체크
   - **Add** 버튼 클릭

   ### 변수 4: ENCRYPTION_KEY
   - **Key:** `ENCRYPTION_KEY`
   - **Value:** `your-64-character-hex-key` (64자 hex 문자열)
   - **생성 방법:** 
     ```bash
     # Node.js에서 생성
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```
   - **Environment:** ✅ Production, ✅ Preview, ✅ Development 모두 체크
   - **Add** 버튼 클릭

   ### 변수 5: NEXT_PUBLIC_PYTHON_SERVER_URL (선택)
   - **Key:** `NEXT_PUBLIC_PYTHON_SERVER_URL`
   - **Value:** `https://your-python-server.com` 또는 `http://localhost:8000`
   - **Environment:** ✅ Production, ✅ Preview, ✅ Development 모두 체크
   - **Add** 버튼 클릭

---

## 🔄 3단계: 재배포

환경 변수를 추가한 후:

1. **자동 재배포**
   - 환경 변수 추가 시 자동으로 재배포가 시작될 수 있습니다
   - **Deployments** 탭에서 배포 상태 확인

2. **수동 재배포 (필요 시)**
   ```bash
   vercel --prod --yes
   ```

---

## ✅ 확인 사항

환경 변수 설정 후:
- [ ] 모든 5개 변수가 추가되었는지 확인
- [ ] Production, Preview, Development 모두 체크되었는지 확인
- [ ] 재배포가 시작되었는지 확인 (Deployments 탭)

---

## 📝 Supabase 정보 찾는 방법

1. **Supabase 대시보드 접속**
   - https://supabase.com/dashboard
   - 프로젝트 선택

2. **Settings > API**
   - **Project URL:** `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret:** `SUPABASE_SERVICE_ROLE_KEY`

---

**환경 변수 설정이 완료되면 알려주세요. 재배포를 진행하겠습니다!**
