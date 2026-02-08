# 🚀 실행 명령어

## 1. 패키지 설치 (한 번만 실행)

```bash
cd ai_engine
pip install fastapi uvicorn python-dotenv supabase
```

또는 requirements.txt 사용:

```bash
cd ai_engine
pip install -r requirements.txt
```

## 2. Python 서버 실행

```bash
cd ai_engine
python main.py
```

서버가 정상적으로 시작되면:
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000
```

## 3. Next.js 개발 서버 실행 (별도 터미널)

```bash
npm run dev
```

## 4. 테스트

1. 브라우저에서 `http://localhost:3000` 접속
2. 페이지 하단의 "주문 동기화" 버튼 클릭
3. Supabase Dashboard > Table Editor > orders 테이블에서 새 주문 확인

---

## ✅ 체크리스트

- [ ] Python 패키지 설치 완료
- [ ] Python 서버 실행 성공 (http://127.0.0.1:8000)
- [ ] Next.js 서버 실행 성공 (http://localhost:3000)
- [ ] "주문 동기화" 버튼 클릭 테스트
- [ ] Supabase에서 주문 데이터 확인
