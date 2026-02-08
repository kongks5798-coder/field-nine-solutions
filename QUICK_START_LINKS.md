# 🚀 빠른 시작 링크 가이드

## 📍 접속 링크

### 메인 애플리케이션
```
http://localhost:3000
```

### 주요 페이지 링크

1. **홈페이지 (메인)**
   ```
   http://localhost:3000
   ```

2. **로그인 페이지**
   ```
   http://localhost:3000/login
   ```

3. **대시보드 (로그인 후)**
   ```
   http://localhost:3000/dashboard
   ```

4. **주문 동기화 페이지**
   ```
   http://localhost:3000/dashboard/orders
   ```

5. **설정 페이지 (스토어 연동)**
   ```
   http://localhost:3000/dashboard/settings
   ```

6. **분석 페이지**
   ```
   http://localhost:3000/dashboard/analytics
   ```

---

## 🐍 Python 서버 (별도 실행 필요)

Python 서버도 실행해야 주문 동기화가 작동합니다.

**Python 서버 실행 방법:**
1. 새 터미널 창을 엽니다
2. 다음 명령어를 실행합니다:
   ```bash
   cd ai_engine
   pip install -r requirements.txt
   python main.py
   ```

**Python 서버 링크:**
```
http://localhost:8000
```

**Python 서버 헬스 체크:**
```
http://localhost:8000/health
```

---

## ⚠️ 중요 안내

1. **Next.js 서버가 실행 중이어야 합니다**
   - 터미널에서 `npm run dev` 실행 후 접속하세요

2. **Python 서버도 실행해야 합니다**
   - 주문 동기화 기능을 사용하려면 Python 서버가 필요합니다

3. **로그인이 필요합니다**
   - 대시보드 접속 전에 로그인을 해야 합니다
   - Google 또는 Kakao 로그인 사용 가능

---

## 🎯 사용 순서

1. **Next.js 서버 실행** (현재 실행 중)
   - 브라우저에서 `http://localhost:3000` 접속

2. **Python 서버 실행** (별도 터미널)
   - 주문 동기화 기능 사용 시 필요

3. **로그인**
   - `http://localhost:3000/login`에서 로그인

4. **스토어 연동**
   - `http://localhost:3000/dashboard/settings`에서 API Key 입력

5. **주문 동기화**
   - `http://localhost:3000/dashboard/orders`에서 동기화 버튼 클릭

---

**현재 Next.js 서버가 실행 중입니다!**  
**브라우저에서 `http://localhost:3000`을 열어보세요!** 🎉
