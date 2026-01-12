# 🔧 PYTHON_BACKEND_URL 환경 변수 설정

## ✅ Vercel 환경 변수 설정 방법

### Key (키):
```
PYTHON_BACKEND_URL
```

### Value (값):
```
http://localhost:8000
```

### Environment (환경):
- ✅ Production
- ✅ Preview  
- ✅ Development
(모두 체크하세요!)

---

## 📝 상세 설명

### 왜 이 값을 사용하나요?

1. **코드에서 기본값으로 사용 중**
   - `app/api/analyze/route.ts`에서 `process.env.PYTHON_BACKEND_URL || 'http://localhost:8000'`로 설정되어 있습니다
   - 환경 변수가 없어도 기본값으로 작동합니다

2. **빌드 성공을 위해 필요**
   - 환경 변수를 설정하면 빌드가 더 안정적입니다
   - 나중에 실제 Python 백엔드 URL로 쉽게 변경할 수 있습니다

3. **Python 백엔드가 없어도 배포 가능**
   - 이 값으로 설정하면 배포는 성공합니다
   - 분석 기능은 Python 백엔드가 배포되기 전까지는 작동하지 않습니다

---

## 🎯 설정 단계

### 1단계: Vercel 대시보드 접속
1. `vercel.com` 접속
2. 로그인
3. **"field-nine-solutions"** 프로젝트 클릭

### 2단계: 환경 변수 추가
1. 왼쪽 메뉴에서 **"Settings"** 클릭
2. **"Environment Variables"** 클릭
3. **"Add New"** 버튼 클릭

### 3단계: 값 입력
1. **Key** 입력란:
   ```
   PYTHON_BACKEND_URL
   ```

2. **Value** 입력란:
   ```
   http://localhost:8000
   ```

3. **Environment** 체크박스:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

4. **"Add"** 버튼 클릭

### 4단계: 확인
- 환경 변수 목록에 `PYTHON_BACKEND_URL`이 보이는지 확인
- Production, Preview, Development가 모두 표시되는지 확인

---

## ⚠️ 주의사항

### Python 백엔드가 없으면:
- ✅ 사이트는 정상적으로 열립니다
- ✅ 로그인, 대시보드 등은 작동합니다
- ❌ 해시태그 분석 기능은 작동하지 않습니다
  - 에러 메시지: "AI 분석 서버에 연결할 수 없습니다"

### 나중에 Python 백엔드를 배포하면:
1. Python 백엔드를 배포합니다 (예: Railway, Render 등)
2. 배포된 URL을 복사합니다
3. Vercel 환경 변수에서 `PYTHON_BACKEND_URL` 값을 실제 URL로 변경합니다
   - 예: `https://trendstream-api.railway.app`
4. 자동으로 재배포됩니다

---

## 💡 요약

**지금 설정할 값:**

| 항목 | 값 |
|------|-----|
| **Key** | `PYTHON_BACKEND_URL` |
| **Value** | `http://localhost:8000` |
| **Environment** | Production, Preview, Development 모두 체크 |

이렇게 설정하면 배포가 완료됩니다! 🚀
