# ⚡ 빠른 에러 수정 가이드

## 🔧 발견된 에러 및 수정

### 1. Next.js dev lock 에러
**에러**: `Unable to acquire lock at .next\devlock`

**해결**:
```powershell
# 기존 프로세스 종료
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force

# .next 폴더 삭제
Remove-Item -Path ".next" -Recurse -Force
```

### 2. uvicorn 모듈 없음
**에러**: `ImportError: No module named 'uvicorn'`

**해결**:
```powershell
cd api
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 3. 포트 충돌
**에러**: `A port 8000 is in use`

**해결**: `api/run.py`에서 자동으로 다른 포트 사용하도록 수정 완료

### 4. 테스트 스크립트 경로 오류
**에러**: `test-arbitrage.ps1`을 찾을 수 없음

**해결**: 스크립트 경로 수정 완료

---

## 🚀 빠른 시작 (수정 후)

### 1. API 서버 설정
```powershell
.\scripts\setup-api.ps1
```

### 2. 전체 시작
```powershell
.\scripts\start-all.ps1
```

또는 수동으로:

```powershell
# API 서버
cd api
.\venv\Scripts\Activate.ps1
python run.py

# 프론트엔드 (새 터미널)
npm run dev
```

---

## ✅ 수정 완료 사항

- [x] Next.js lock 에러 해결
- [x] uvicorn 설치 가이드 추가
- [x] 포트 충돌 자동 해결
- [x] 테스트 스크립트 경로 수정
- [x] 전체 시작 스크립트 추가
- [x] API 서버 설정 스크립트 추가

---

**보스, 모든 에러 수정 완료!** ✅
