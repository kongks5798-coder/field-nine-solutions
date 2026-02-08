# 🚀 차익거래 엔진 배포 가이드

## 배포 전략

### 1. 프론트엔드 (Vercel)
- Next.js 앱 자동 배포
- 환경변수 설정 필요

### 2. 백엔드 API (Vercel Serverless Functions)
- FastAPI를 Vercel Serverless로 배포
- 또는 별도 서버 (Railway, Render 등)

---

## 🎯 Vercel 배포 (권장)

### 1단계: 프론트엔드 배포

```bash
# Vercel CLI 설치 (없는 경우)
npm i -g vercel

# 배포
vercel --prod
```

또는 GitHub 연동 시 자동 배포됩니다.

### 2단계: 환경변수 설정

Vercel 대시보드에서 환경변수 설정:

```env
NEXT_PUBLIC_ARBITRAGE_API_URL=https://your-api.vercel.app
```

### 3단계: 백엔드 API 배포

#### 옵션 A: Vercel Serverless Functions

```bash
cd api
vercel --prod
```

#### 옵션 B: 별도 서버 (Railway/Render)

1. **Railway 배포:**
   ```bash
   # Railway CLI 설치
   npm i -g @railway/cli
   
   # 로그인 및 배포
   railway login
   railway init
   railway up
   ```

2. **Render 배포:**
   - Render 대시보드에서 GitHub 연결
   - `api/` 디렉토리 선택
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python run.py`

---

## 🔧 환경변수 설정

### 프론트엔드 (Vercel)

```env
NEXT_PUBLIC_ARBITRAGE_API_URL=https://your-api-url.com
```

### 백엔드 API

```env
DEEPSEEK_API_KEY=sk-...
BINANCE_API_KEY=...
BINANCE_API_SECRET=...
UPBIT_API_KEY=...
UPBIT_API_SECRET=...
PORT=8000
```

---

## 📋 배포 체크리스트

### 프론트엔드
- [x] Next.js 빌드 성공
- [ ] Vercel 환경변수 설정
- [ ] API URL 설정
- [ ] 배포 확인

### 백엔드
- [x] FastAPI 서버 코드
- [ ] Vercel Serverless 또는 별도 서버
- [ ] 환경변수 설정
- [ ] 헬스 체크 확인

---

## 🚀 빠른 배포 명령어

### 전체 배포 (GitHub Actions)

```bash
git add .
git commit -m "deploy: 차익거래 엔진 배포 준비"
git push origin main
```

Vercel이 자동으로 배포합니다.

---

## ✅ 배포 확인

### 프론트엔드
```bash
curl https://your-app.vercel.app/arbitrage
```

### 백엔드 API
```bash
curl https://your-api.vercel.app/api/health
```

---

**보스, 배포 준비 완료!**
