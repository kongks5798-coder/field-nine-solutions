# 🔍 시스템 진단 및 수리 가이드

## 문제 발생 시 자가 진단 실행

### 1단계: 진단 스크립트 실행

```bash
cd ai_engine
python diagnose_system.py
```

### 2단계: 결과 확인

#### ✅ 모든 테스트 통과
- 시스템이 정상 작동 중입니다
- 브라우저에서 버튼을 다시 시도해보세요

#### ❌ STEP 1 실패 (Supabase 연결)
**증상:**
```
❌ 실패: .env.local 파일에서 Supabase 키를 찾을 수 없습니다!
```

**해결 방법:**
1. 프로젝트 루트에 `.env.local` 파일이 있는지 확인
2. 파일 내용 확인:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
3. 값이 올바른지 Supabase Dashboard에서 확인

#### ❌ STEP 2 실패 (API 서버 연결)
**증상:**
```
❌ API 서버 연결 실패: 서버가 실행 중이지 않습니다!
```

**해결 방법:**
```bash
cd ai_engine
python main.py
```

서버가 정상적으로 시작되면:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

#### ❌ STEP 3 실패 (/simulate-orders)
**증상:**
```
❌ HTTP 오류 (Status: 500)
또는
❌ 요청 실패: ...
```

**해결 방법:**
1. Python 서버 로그 확인 (에러 메시지 확인)
2. Supabase 테이블 스키마 확인 (`orders` 테이블이 존재하는지)
3. RLS 정책 확인 (Service Role Key는 RLS를 우회하므로 문제없어야 함)

---

## CORS 오류 수리 완료

`main.py`의 CORS 설정이 모든 출처를 허용하도록 수정되었습니다:

```python
allow_origins=["*"]  # 모든 출처 허용
```

### 서버 재시작 필요

CORS 설정 변경 후 **반드시 Python 서버를 재시작**해야 합니다:

```bash
# 1. 현재 실행 중인 서버 중지 (Ctrl+C)
# 2. 서버 재시작
cd ai_engine
python main.py
```

---

## 전체 점검 체크리스트

### 환경 설정
- [ ] `.env.local` 파일이 프로젝트 루트에 있음
- [ ] `NEXT_PUBLIC_SUPABASE_URL` 값이 올바름
- [ ] `SUPABASE_SERVICE_ROLE_KEY` 값이 올바름

### Python 서버
- [ ] `pip install fastapi uvicorn python-dotenv supabase requests` 완료
- [ ] `python main.py` 실행 성공
- [ ] `http://127.0.0.1:8000/health` 접속 시 `{"status":"healthy"}` 응답

### Next.js 서버
- [ ] `npm run dev` 실행 성공
- [ ] `http://localhost:3000` 접속 가능

### 데이터베이스
- [ ] Supabase Dashboard에서 `orders` 테이블 존재 확인
- [ ] RLS 정책이 설정되어 있음 (Service Role Key는 우회 가능)

### 진단 테스트
- [ ] `python diagnose_system.py` 실행 시 모든 테스트 통과

---

## 빠른 수리 명령어

### 문제가 발생했을 때 순서대로 실행:

```bash
# 1. 진단 실행
cd ai_engine
python diagnose_system.py

# 2. 문제 발견 시 Python 서버 재시작
# (Ctrl+C로 중지 후)
python main.py

# 3. Next.js 서버도 재시작 (별도 터미널)
# (Ctrl+C로 중지 후)
npm run dev
```

---

## 추가 디버깅

### Python 서버 로그 확인
서버 실행 중 에러 메시지를 자세히 확인하세요:
```bash
python main.py
# 에러 메시지가 콘솔에 출력됩니다
```

### 브라우저 콘솔 확인
1. 브라우저에서 F12 키 누르기
2. Console 탭 확인
3. Network 탭에서 요청/응답 확인

### Supabase 로그 확인
1. Supabase Dashboard > Logs
2. API 요청 로그 확인
3. 에러가 있는지 확인

---

**진단 스크립트가 모든 문제를 찾아낼 것입니다! 🔍**
