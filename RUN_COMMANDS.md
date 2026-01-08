# 🚀 실행 명령어

## 1단계: Python 패키지 설치 (한 번만 실행)

```bash
cd ai_engine
pip install fastapi uvicorn python-dotenv supabase
```

## 2단계: Python 서버 실행 (터미널 1)

```bash
cd ai_engine
python main.py
```

**성공 메시지:**
```
INFO:     Started server process
INFO:     Uvicorn running on http://127.0.0.1:8000
```

## 3단계: Next.js 서버 실행 (터미널 2 - 새 터미널 열기)

```bash
npm run dev
```

**성공 메시지:**
```
- ready started server on 0.0.0.0:3000
- Local: http://localhost:3000
```

## 4단계: 테스트

1. 브라우저에서 `http://localhost:3000` 접속
2. 페이지 하단의 **"주문 동기화"** 버튼 클릭
3. 성공 메시지 확인
4. Supabase Dashboard > Table Editor > `orders` 테이블에서 새 주문 확인

---

## ✅ 체크리스트

- [ ] Python 패키지 설치 완료
- [ ] Python 서버 실행 중 (http://127.0.0.1:8000)
- [ ] Next.js 서버 실행 중 (http://localhost:3000)
- [ ] "주문 동기화" 버튼 클릭 테스트
- [ ] Supabase에서 주문 데이터 확인

---

## 🔧 문제 해결

### Python 서버가 시작되지 않을 때
- `.env.local` 파일이 프로젝트 루트에 있는지 확인
- 환경 변수가 올바르게 설정되었는지 확인

### Next.js에서 Python 서버 연결 실패
- Python 서버가 실행 중인지 확인 (`http://127.0.0.1:8000/health` 접속)
- CORS 오류 시 `main.py`의 `allow_origins` 확인
