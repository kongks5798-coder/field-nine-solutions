# 🔧 PYTHON_BACKEND_URL 환경 변수 설정 가이드

## 📋 상황별 설정 방법

### 상황 1: Python 백엔드가 아직 배포되지 않음 (현재 상황)

**Vercel 환경 변수 설정:**

1. **Key (키):** `PYTHON_BACKEND_URL`
2. **Value (값):** `http://localhost:8000`
   - 또는 임시로: `https://placeholder-backend.example.com`
3. **Environment (환경):** 
   - ✅ Production
   - ✅ Preview
   - ✅ Development
   - (모두 체크)

**설명:**
- 일단 이 값으로 설정하면 빌드는 성공합니다
- 하지만 실제 분석 기능은 Python 백엔드가 없으면 작동하지 않습니다
- 나중에 Python 백엔드를 배포하면 실제 URL로 변경하면 됩니다

---

### 상황 2: Python 백엔드를 로컬에서 실행 중

**Vercel 환경 변수 설정:**

1. **Key (키):** `PYTHON_BACKEND_URL`
2. **Value (값):** `http://localhost:8000`
3. **Environment (환경):** 
   - ❌ Production (로컬은 프로덕션에서 접근 불가)
   - ✅ Preview
   - ✅ Development

**주의:**
- 로컬에서만 실행 중이면 Vercel 프로덕션 배포에서는 접근할 수 없습니다
- Python 백엔드도 별도로 배포해야 합니다

---

### 상황 3: Python 백엔드를 별도 서버에 배포함

**Vercel 환경 변수 설정:**

1. **Key (키):** `PYTHON_BACKEND_URL`
2. **Value (값):** 실제 Python 백엔드 URL
   - 예: `https://trendstream-api.yourdomain.com`
   - 예: `https://python-backend-xxxxx.vercel.app` (Vercel에 배포한 경우)
   - 예: `https://api.trendstream.io` (커스텀 도메인)
3. **Environment (환경):** 
   - ✅ Production
   - ✅ Preview
   - ✅ Development
   - (모두 체크)

---

## 🎯 현재 추천 설정 (Python 백엔드 없을 때)

### Vercel 환경 변수 설정:

**Key:** `PYTHON_BACKEND_URL`

**Value:** `http://localhost:8000`

**Environment:**
- ✅ Production
- ✅ Preview
- ✅ Development

**이유:**
- 코드에서 기본값으로 `http://localhost:8000`을 사용하고 있습니다
- 이렇게 설정하면 빌드는 성공합니다
- 실제 분석 기능은 Python 백엔드가 배포되기 전까지는 작동하지 않습니다
- 나중에 Python 백엔드를 배포하면 실제 URL로 변경하면 됩니다

---

## 📝 단계별 설정 방법

### 1. Vercel 대시보드 접속
1. `vercel.com` 접속
2. 로그인
3. **"field-nine-solutions"** 프로젝트 선택

### 2. 환경 변수 추가
1. 왼쪽 메뉴에서 **"Settings"** 클릭
2. **"Environment Variables"** 클릭
3. **"Add New"** 버튼 클릭

### 3. 값 입력
1. **Key** 입력란에: `PYTHON_BACKEND_URL` 입력
2. **Value** 입력란에: `http://localhost:8000` 입력
3. **Environment** 체크박스:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
   - (모두 체크)
4. **"Add"** 버튼 클릭

### 4. 확인
- 환경 변수 목록에 `PYTHON_BACKEND_URL`이 추가되었는지 확인
- 각 환경(Production, Preview, Development)에 모두 설정되어 있는지 확인

---

## ⚠️ 중요 사항

### 1. Python 백엔드가 없으면 분석 기능이 작동하지 않습니다

현재 코드는 Python 백엔드에 요청을 보내서 분석 결과를 받아옵니다.
Python 백엔드가 없으면:
- ✅ 사이트는 정상적으로 열립니다
- ✅ 로그인, 대시보드 등은 작동합니다
- ❌ 해시태그 분석 기능은 작동하지 않습니다 (에러 발생)

### 2. 나중에 Python 백엔드를 배포하면

1. Python 백엔드를 배포합니다 (예: Vercel, Railway, Render 등)
2. 배포된 URL을 복사합니다
3. Vercel 환경 변수에서 `PYTHON_BACKEND_URL` 값을 실제 URL로 변경합니다
4. 자동으로 재배포되거나 수동으로 재배포합니다

---

## 🚀 Python 백엔드 배포 옵션

나중에 Python 백엔드를 배포할 때 사용할 수 있는 서비스:

1. **Vercel** (Python 서버리스 함수)
2. **Railway** (Python 앱 배포)
3. **Render** (Python 웹 서비스)
4. **AWS Lambda** (서버리스)
5. **Google Cloud Run** (컨테이너)
6. **자체 서버** (로컬 GPU 5090)

---

## 💡 요약

**지금 당장 설정할 값:**

- **Key:** `PYTHON_BACKEND_URL`
- **Value:** `http://localhost:8000`
- **Environment:** Production, Preview, Development 모두 체크

이렇게 설정하면:
- ✅ 빌드가 성공합니다
- ✅ 배포가 완료됩니다
- ⚠️ 분석 기능은 Python 백엔드 배포 후에 작동합니다

---

**보스, 이렇게 설정하시면 됩니다!** 🚀
